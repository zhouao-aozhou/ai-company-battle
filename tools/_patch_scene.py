import sys, os, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

d = sys.argv[1]
path = os.path.join(d, "index.html")
src = open(path, encoding="utf-8", newline="").read()
nl = "\r\n" if "\r\n" in src else "\n"
n = 0


def rep(old, new, label):
    global src, n
    o = old.replace("\n", nl)
    v = new.replace("\n", nl)
    if o in src:
        src = src.replace(o, v, 1)
        n += 1
        print("  ✓ " + label)
    else:
        print("  ✗ " + label)


# ---------------- 1. 办公室改成场景模式（可切换） ----------------
rep('''function renderOffice() {
  const floor = $("floor");
  floor.innerHTML = "";''',
    '''function renderOffice() {
  const floor = $("floor");
  if (!floor) return;
  floor.innerHTML = "";
  if (document.body && document.body.classList && document.body.classList.contains("scene")) {
    renderOfficeScene(floor);
    return;
  }''',
    'renderOffice 支持场景模式')

# ---------------- 2. 场景渲染器 ----------------
rep('/* 点 ★ 主管行 = 查看主管详情（不派活，避免误操作） */',
    r'''/* =========================================================
   2D 斜视办公室场景
   ========================================================= */
const ISO_W = 46, ISO_H = 23;          // 每格瓦片的半宽/半高
function isoPt(gx, gy, gz) {
  return { x: (gx - gy) * ISO_W, y: (gx + gy) * ISO_H - (gz || 0) };
}

/* 画一个立方体（桌子、柜子都靠它） */
function isoBox(gx, gy, gw, gd, h, topCol, leftCol, rightCol) {
  const a = isoPt(gx, gy, h), b = isoPt(gx + gw, gy, h), c = isoPt(gx + gw, gy + gd, h), dd = isoPt(gx, gy + gd, h);
  const a0 = isoPt(gx, gy, 0), b0 = isoPt(gx + gw, gy, 0), c0 = isoPt(gx + gw, gy + gd, 0), d0 = isoPt(gx, gy + gd, 0);
  const p = pts => pts.map(q => q.x + "," + q.y).join(" ");
  return `
    <polygon points="${p([dd, c, c0, d0])}" fill="${leftCol}"/>
    <polygon points="${p([b, c, c0, b0])}" fill="${rightCol}"/>
    <polygon points="${p([a, b, c, dd])}" fill="${topCol}"/>`;
}

function renderOfficeScene(floor) {
  const W = 900, H = 520, OX = W / 2, OY = 150;
  // 桌子摆成 3 + 2 两排
  const spots = [
    { gx: 0, gy: 0 }, { gx: 4, gy: 0 }, { gx: 8, gy: 0 },
    { gx: 2, gy: 3 }, { gx: 6, gy: 3 },
  ];

  const tiles = [];
  const GRID = 12;
  for (let gx = -2; gx <= GRID; gx++) {
    for (let gy = -2; gy <= GRID; gy++) {
      const c = ((gx + gy) % 2 === 0) ? "#e7ddc9" : "#ded2bb";
      const a = isoPt(gx, gy, 0), b = isoPt(gx + 1, gy, 0), cc = isoPt(gx + 1, gy + 1, 0), dd = isoPt(gx, gy + 1, 0);
      tiles.push(`<polygon points="${a.x},${a.y} ${b.x},${b.y} ${cc.x},${cc.y} ${dd.x},${dd.y}" fill="${c}"/>`);
    }
  }

  let furniture = "";
  // 后方隔断墙
  furniture += isoBox(-2, -2, 14, 1, 74, "#cfd8e6", "#a9b6c9", "#c3cddd");
  // 左侧隔断墙
  furniture += isoBox(-2, -1, 1, 12, 74, "#cfd8e6", "#a9b6c9", "#c3cddd");

  G.staff.forEach((s, i) => {
    const sp = spots[i] || spots[0];
    const { gx, gy } = sp;
    // 桌子
    furniture += isoBox(gx, gy, 3, 2, 26, "#f3efe6", "#c9bfa9", "#e6dccb");
    // 显示器
    furniture += isoBox(gx + 0.9, gy + 0.3, 1.2, 0.5, 40, "#3b4658", "#2b3444", "#333d4f");
    // 椅子
    furniture += isoBox(gx + 1.1, gy + 2.1, 1.0, 1.0, 22, "#404b60", "#2f384a", "#39435a");
  });

  // 绿植
  furniture += isoBox(10.6, 0.4, 1.2, 1.2, 34, "#5aa06a", "#3f7a4e", "#4d8d5c");
  furniture += isoBox(-1.2, 8.5, 1.2, 1.2, 30, "#5aa06a", "#3f7a4e", "#4d8d5c");

  // 角色（头像 + 名牌），用绝对定位浮在场景上
  const cast = G.staff.map((s, i) => {
    const sp = spots[i] || spots[0];
    const p = isoPt(sp.gx + 1.5, sp.gy + 1.2, 60);
    const x = p.x + OX, y = p.y + OY;
    const busy = !!s.working;
    return `
      <div class="sceneChar${selStaff === s.id ? " sel" : ""}" style="left:${x}px;top:${y}px"
           onclick="event.stopPropagation();selectStaff('${s.id}')" title="${s.name}｜心情 ${Math.round(s.mood)} 疲劳 ${Math.round(s.fatigue)}">
        <div class="scName">${s.name}</div>
        <img class="scHead" src="${s.portrait}" alt="${s.name}">
        <div class="scBars">
          <i class="m" style="width:${Math.round(s.mood)}%"></i>
        </div>
        ${busy ? `<div class="scBusy">在做活</div>` : ""}
      </div>`;
  }).join("");

  // 同组员工小圆点
  const pips = G.staff.map((s, i) => {
    const sp = spots[i] || spots[0];
    const team = (G.workers || []).filter(w => w.aiId === s.id);
    if (!team.length) return "";
    const p = isoPt(sp.gx + 0.2, sp.gy + 2.6, 34);
    return `<div class="scenePips" style="left:${p.x + OX}px;top:${p.y + OY}px" onclick="event.stopPropagation();selectStaff('${s.id}')">
      ${team.map(w => `<i class="${w.busy ? "busy" : ""}${w.mustRest ? " rest" : ""}" title="${w.name}"></i>`).join("")}
    </div>`;
  }).join("");

  floor.innerHTML = `
    <div class="sceneWrap">
      <svg class="sceneSvg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <g transform="translate(${OX},${OY})">
          ${tiles.join("")}
          ${furniture}
        </g>
      </svg>
      <div class="sceneLayer">${cast}${pips}</div>
    </div>`;

  // 场景图层的坐标要跟 SVG 对齐：用百分比换算
  requestAnimationFrame(() => fitScene(floor));
}

/* 让浮层与 SVG 缩放位置对齐 */
function fitScene(floor) {
  const wrap = floor.querySelector(".sceneWrap");
  const svg = floor.querySelector(".sceneSvg");
  const layer = floor.querySelector(".sceneLayer");
  if (!wrap || !svg || !layer) return;
  const W = 900, H = 520;
  const bw = wrap.clientWidth, bh = wrap.clientHeight;
  const scale = Math.min(bw / W, bh / H);
  const offX = (bw - W * scale) / 2, offY = (bh - H * scale) / 2;
  layer.style.transform = `translate(${offX}px, ${offY}px) scale(${scale})`;
  layer.style.width = W + "px";
  layer.style.height = H + "px";
}

/* 点角色选中该主管 */
function selectStaff(id) {
  selStaff = id;
  selWorker = null;
  renderAll();
}

/* 点 ★ 主管行 = 查看主管详情（不派活，避免误操作） */''',
    '场景渲染器')

# ---------------- 3. 场景样式 ----------------
rep('  /* ---------- 屏幕正下方的效果说明 ---------- */',
    '''  /* ---------- 2D 办公室场景 ---------- */
  .sceneWrap { position: relative; width: 100%; height: 100%; overflow: hidden; }
  .sceneSvg { display: block; }
  .sceneLayer { position: absolute; left: 0; top: 0; transform-origin: 0 0; pointer-events: none; }
  .sceneChar {
    position: absolute; transform: translate(-50%, -100%);
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    cursor: pointer; pointer-events: auto;
  }
  .sceneChar .scName {
    font-size: 10px; color: #1d2740; background: #fff;
    border: 2px solid #2c3a55; border-radius: 3px; padding: 1px 6px;
    box-shadow: 2px 2px 0 rgba(20,28,45,.35); white-space: nowrap;
  }
  .sceneChar .scHead {
    width: 44px; height: 44px; border-radius: 50%; object-fit: cover;
    border: 3px solid #fff; box-shadow: 0 3px 8px rgba(20,30,50,.35);
    background: #dfe6f2;
  }
  .sceneChar.sel .scHead { border-color: #ffd166; box-shadow: 0 0 0 3px rgba(255,209,102,.45), 0 3px 8px rgba(20,30,50,.35); }
  .sceneChar .scBars { width: 40px; height: 4px; background: #cfd7e5; border: 1px solid #2c3a55; border-radius: 2px; overflow: hidden; }
  .sceneChar .scBars i { display: block; height: 100%; background: linear-gradient(90deg,#ff9b9b,#59d98c,#7de3ff); }
  .sceneChar .scBusy {
    font-size: 9px; color: #fff; background: #e07a3a; border-radius: 3px; padding: 0 5px;
    border: 1px solid #8d4a1c;
  }
  .scenePips {
    position: absolute; transform: translate(-50%, -50%);
    display: flex; gap: 3px; pointer-events: auto; cursor: pointer;
  }
  .scenePips i {
    width: 7px; height: 7px; border-radius: 50%; background: #9fd8b0;
    border: 1px solid #2c3a55; display: block;
  }
  .scenePips i.busy { background: #ffc861; }
  .scenePips i.rest { background: #ff7b7b; }

  /* ---------- 屏幕正下方的效果说明 ---------- */''',
    '场景样式')

# ---------------- 4. 画风切换：卡片 / 场景 ----------------
rep('''function applySkin(pixel) {
  const on = !!pixel;
  if (document.body && document.body.classList) document.body.classList.toggle("pixel", on);
  const b = $("btnSkin");
  if (b) b.textContent = on ? "🎨 像素" : "🎨 原版";
  try { localStorage.setItem("aicompany_skin", on ? "pixel" : "flat"); } catch (e) {}
}
function toggleSkin() {
  applySkin(!document.body.classList.contains("pixel"));
}''',
    '''function applySkin(mode) {
  const scene = (mode === "scene");
  if (document.body && document.body.classList) document.body.classList.toggle("scene", scene);
  const b = $("btnSkin");
  if (b) b.textContent = scene ? "🗂 卡片" : "🏢 场景";
  try { localStorage.setItem("aicompany_skin", scene ? "scene" : "cards"); } catch (e) {}
  try { renderOffice(); } catch (e) {}
}
function toggleSkin() {
  applySkin(document.body.classList.contains("scene") ? "cards" : "scene");
}''',
    '画风切换改为场景/卡片')

open(path, "w", encoding="utf-8", newline="").write(src)
print("成功", n, "处")
