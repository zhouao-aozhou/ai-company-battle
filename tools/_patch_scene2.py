import sys, os, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

d = sys.argv[1]
path = os.path.join(d, "index.html")
src = open(path, encoding="utf-8", newline="").read()
nl = "\r\n" if "\r\n" in src else "\n"

start_mark = "const ISO_W = 46, ISO_H = 23;"
end_mark = "/* 点 ★ 主管行 = 查看主管详情（不派活，避免误操作） */"
i = src.find(start_mark)
j = src.find(end_mark, i)
if i < 0 or j < 0:
    print("找不到替换范围", i, j)
    sys.exit(1)

new_js = r'''/* =========================================================
   2D 斜视办公室（SVG 程序化绘制）
   ========================================================= */
const ISO_W = 48, ISO_H = 24;
const C = {
  bg: "#e9e7e1", wallA: "#e6e3db", wallB: "#dbd7cd", trim: "#c9c4b8",
  floorA: "#ded4c2", floorB: "#d6cbb7", floorLine: "#cbbfa8",
  deskTop: "#f4f2ec", deskEdge: "#d7d2c7", deskSide: "#e4e0d7", deskDark: "#c3bdb0",
  metal: "#b9bec7", metalDark: "#98a0ab",
  mon: "#2f3742", monFace: "#48536a", monScreen: "#6d84a8",
  chair: "#3d4553", chairLight: "#4d5666",
  plant: "#6faa7d", plantDark: "#4f845e", pot: "#e8e5de",
  glass: "#c5dde3", paper: "#ffffff",
};

function isoPt(gx, gy, gz) {
  return { x: (gx - gy) * ISO_W, y: (gx + gy) * ISO_H - (gz || 0) };
}

function pr(pts) { return pts.map(q => q.x.toFixed(1) + "," + q.y.toFixed(1)).join(" "); }

/* 立方体：顶面 + 左面 + 右面 */
function isoBox(gx, gy, gw, gd, h, top, left, right) {
  const a = isoPt(gx, gy, h), b = isoPt(gx + gw, gy, h), c = isoPt(gx + gw, gy + gd, h), d2 = isoPt(gx, gy + gd, h);
  const a0 = isoPt(gx, gy, 0), b0 = isoPt(gx + gw, gy, 0), c0 = isoPt(gx + gw, gy + gd, 0), d0 = isoPt(gx, gy + gd, 0);
  return `
    <polygon points="${pr([d2, c, c0, d0])}" fill="${left}"/>
    <polygon points="${pr([b, c, c0, b0])}" fill="${right}"/>
    <polygon points="${pr([a, b, c, d2])}" fill="${top}"/>`;
}

/* 地面阴影 */
function isoShadow(gx, gy, gw, gd, op) {
  const a = isoPt(gx, gy, 0), b = isoPt(gx + gw, gy, 0), c = isoPt(gx + gw, gy + gd, 0), d2 = isoPt(gx, gy + gd, 0);
  return `<polygon points="${pr([a, b, c, d2])}" fill="#000" opacity="${op || 0.07}"/>`;
}

/* 一盆绿植 */
function plant(gx, gy) {
  let s = isoShadow(gx - 0.2, gy - 0.2, 1.6, 1.6, 0.06);
  s += isoBox(gx, gy, 0.9, 0.9, 16, C.pot, "#d8d4cb", "#ebe8e1");
  const p = isoPt(gx + 0.45, gy + 0.45, 26);
  const leaves = [
    [0, -16, 13, C.plantDark], [-11, -6, 10, C.plant], [11, -7, 10, C.plantDark],
    [0, -30, 10, C.plant], [-8, -24, 9, C.plantDark], [9, -25, 9, C.plant],
  ];
  leaves.forEach(l => {
    s += `<ellipse cx="${p.x + l[0]}" cy="${p.y + l[1]}" rx="${l[2]}" ry="${l[2] * 0.72}" fill="${l[3]}" opacity=".95"/>`;
  });
  return s;
}

/* 工位：桌子 + 显示器 + 键盘 + 椅子 */
function workstation(gx, gy, withMonitor) {
  let s = isoShadow(gx - 0.3, gy - 0.2, 3.6, 2.8, 0.08);
  // 桌子
  s += isoBox(gx, gy, 3, 2, 26, C.deskTop, C.deskSide, C.deskEdge);
  // 桌面上的显示器
  if (withMonitor) {
    const m = isoPt(gx + 0.95, gy + 0.35, 26);
    s += `<ellipse cx="${m.x + 40}" cy="${m.y + 6}" rx="26" ry="6" fill="#000" opacity=".08"/>`;
    s += isoBox(gx + 0.95, gy + 0.35, 1.3, 0.28, 40, C.mon, "#242b35", "#2f3742");
    // 屏幕面（朝内）
    const s1 = isoPt(gx + 0.95, gy + 0.63, 40), s2 = isoPt(gx + 2.25, gy + 0.63, 40);
    const s3 = isoPt(gx + 2.25, gy + 0.63, 27), s4 = isoPt(gx + 0.95, gy + 0.63, 27);
    s += `<polygon points="${pr([s1, s2, s3, s4])}" fill="${C.monFace}"/>`;
    s += `<polygon points="${pr([s1, s2, s3, s4])}" fill="${C.monScreen}" opacity=".55" transform="translate(0,-3) scale(1)"/>`;
    // 键盘
    s += isoBox(gx + 1.0, gy + 1.05, 1.0, 0.42, 28, "#e9e6de", "#d5d0c5", "#f2efe8");
  }
  // 椅子
  const ch = isoPt(gx + 1.5, gy + 2.35, 0);
  s += `<ellipse cx="${ch.x}" cy="${ch.y + 2}" rx="30" ry="11" fill="#000" opacity=".10"/>`;
  s += isoBox(gx + 1.05, gy + 2.15, 0.9, 0.9, 20, C.chairLight, C.chair, "#48515f");
  s += isoBox(gx + 1.05, gy + 2.15, 0.9, 0.35, 46, C.chair, "#2c333e", "#39414e");
  return s;
}

/* 玻璃隔断（半透明板 + 竖框） */
function glassPanel(gx, gy, gw, gd, h, vertical) {
  const t = isoPt(gx, gy, h), b = isoPt(gx + (vertical ? 0 : gw), gy + (vertical ? gd : 0), h);
  const b0 = isoPt(gx + (vertical ? 0 : gw), gy + (vertical ? gd : 0), 0), t0 = isoPt(gx, gy, 0);
  const post = (p0, p1) => `<line x1="${p0.x}" y1="${p0.y}" x2="${p1.x}" y2="${p1.y}" stroke="${C.metalDark}" stroke-width="3"/>`;
  return `<polygon points="${pr([t, b, b0, t0])}" fill="${C.glass}" opacity=".42"/>
    ${post(t, t0)} ${post(b, b0)}
    <polygon points="${pr([t, b, b0, t0])}" fill="none" stroke="${C.metal}" stroke-width="1.2" opacity=".6"/>`;
}

/* 文件柜 */
function cabinet(gx, gy) {
  let s = isoShadow(gx - 0.1, gy - 0.2, 1.4, 1.4, 0.08);
  s += isoBox(gx, gy, 1, 1, 44, C.deskTop, "#ddd8cd", "#eae6dd");
  const f = isoPt(gx + 1, gy, 8);
  for (let k = 0; k < 3; k++) {
    s += `<line x1="${f.x}" y1="${f.y - k * 12}" x2="${f.x}" y2="${f.y - k * 12 - 9}" stroke="${C.deskDark}" stroke-width="1.6"/>`;
  }
  return s;
}

function renderOfficeScene(floor) {
  const W = 1120, H = 660, OX = W / 2 + 40, OY = 250;
  const spots = [
    { gx: 0, gy: 0 }, { gx: 4.2, gy: 0 }, { gx: 8.4, gy: 0 },
    { gx: 2.1, gy: 3.6 }, { gx: 6.3, gy: 3.6 },
  ];

  // 地板
  let floorSvg = "";
  for (let gx = -4; gx <= 16; gx++) {
    for (let gy = -4; gy <= 12; gy++) {
      const col = ((gx + gy) % 2 === 0) ? C.floorA : C.floorB;
      const a = isoPt(gx, gy, 0), b = isoPt(gx + 1, gy, 0), c = isoPt(gx + 1, gy + 1, 0), d2 = isoPt(gx, gy + 1, 0);
      floorSvg += `<polygon points="${pr([a, b, c, d2])}" fill="${col}" stroke="${C.floorLine}" stroke-width=".6" opacity=".95"/>`;
    }
  }

  // 墙（后 + 左）
  let wallSvg = "";
  wallSvg += isoBox(-4, -4, 21, 1, 104, C.wallA, C.wallB, C.wallA);
  wallSvg += isoBox(-4, -3, 1, 15, 104, C.wallB, "#cfcabf", C.wallA);
  // 踢脚线
  wallSvg += isoBox(-4, -3.15, 21, 0.15, 8, C.trim, C.trim, C.trim);
  // 挂钟
  const clock = isoPt(9, -3.05, 74);
  wallSvg += `<circle cx="${clock.x}" cy="${clock.y}" r="17" fill="#fbfaf6" stroke="${C.trim}" stroke-width="2"/>
    <line x1="${clock.x}" y1="${clock.y}" x2="${clock.x}" y2="${clock.y - 11}" stroke="#5a6473" stroke-width="2"/>
    <line x1="${clock.x}" y1="${clock.y}" x2="${clock.x + 7}" y2="${clock.y + 4}" stroke="#5a6473" stroke-width="2"/>`;
  // 窗户
  const win = isoPt(2.2, -3.05, 30);
  wallSvg += `<rect x="${win.x - 70}" y="${win.y - 34}" width="140" height="66" rx="3" fill="#cfe3ea" stroke="${C.trim}" stroke-width="3"/>
    <line x1="${win.x - 70}" y1="${win.y - 1}" x2="${win.x + 70}" y2="${win.y - 1}" stroke="${C.trim}" stroke-width="2"/>
    <line x1="${win.x}" y1="${win.y - 34}" x2="${win.x}" y2="${win.y + 32}" stroke="${C.trim}" stroke-width="2"/>`;

  // 玻璃隔断
  let glassSvg = glassPanel(4.0, -0.2, 0, 3.4, 74, true);
  glassSvg += glassPanel(8.2, -0.2, 0, 3.4, 74, true);

  // 家具
  let furn = "";
  furn += cabinet(12.2, -0.6);
  furn += cabinet(13.4, -0.6);
  furn += plant(13.2, 6.4);
  furn += plant(-1.0, 8.2);
  furn += plant(5.2, 7.4);

  // 角色（先画，桌子会挡住下半身）
  const clipDefs = [];
  let chars = "";
  G.staff.forEach((s, i) => {
    const sp = spots[i] || spots[0];
    const p = isoPt(sp.gx + 1.55, sp.gy + 0.75, 24);
    const R = 34;
    const cid = "avClip" + i;
    clipDefs.push(`<clipPath id="${cid}"><circle cx="${p.x}" cy="${p.y - 26}" r="${R}"/></clipPath>`);
    chars += `<g class="sceneCharG" onclick="selectStaff('${s.id}')" style="cursor:pointer">
      <ellipse cx="${p.x}" cy="${p.y + 16}" rx="30" ry="9" fill="#000" opacity=".10"/>
      <circle cx="${p.x}" cy="${p.y - 26}" r="${R + 3}" fill="#fff" stroke="${selStaff === s.id ? "#ffd166" : "#d9d4c8"}" stroke-width="3"/>
      <image href="${s.portrait}" x="${p.x - R}" y="${p.y - 26 - R}" width="${R * 2}" height="${R * 2}"
             clip-path="url(#${cid})" preserveAspectRatio="xMidYMid slice"/>
    </g>`;
    // 名牌
    const tagW = Math.max(52, s.name.length * 8 + 18);
    chars += `<g class="sceneTag" onclick="selectStaff('${s.id}')" style="cursor:pointer">
      <rect x="${p.x - tagW / 2}" y="${p.y - 26 - R - 26}" width="${tagW}" height="19" rx="4"
            fill="#fff" stroke="#c9c2b4" stroke-width="1.4"/>
      <text x="${p.x}" y="${p.y - 26 - R - 12.5}" text-anchor="middle" font-size="11"
            fill="#3a4356" font-family="system-ui,-apple-system,sans-serif" font-weight="600">${s.name}</text>
    </g>`;
    if (s.working) {
      chars += `<g><rect x="${p.x - 20}" y="${p.y + 20}" width="40" height="15" rx="3" fill="#e07a3a"/>
        <text x="${p.x}" y="${p.y + 30.5}" text-anchor="middle" font-size="9" fill="#fff" font-family="system-ui">在做活</text></g>`;
    }
  });

  // 桌子（画在角色之后 → 挡住下半身）
  let desks = "";
  G.staff.forEach((s, i) => {
    const sp = spots[i] || spots[0];
    desks += workstation(sp.gx, sp.gy, true);
  });

  // 员工小圆点
  let pips = "";
  G.staff.forEach((s, i) => {
    const sp = spots[i] || spots[0];
    const team = (G.workers || []).filter(w => w.aiId === s.id);
    if (!team.length) return;
    const p = isoPt(sp.gx + 2.9, sp.gy + 2.5, 46);
    pips += `<g class="scenePipsG" onclick="selectStaff('${s.id}')" style="cursor:pointer">
      <rect x="${p.x - (team.length * 11) / 2 - 4}" y="${p.y - 11}" width="${team.length * 11 + 8}" height="19" rx="4" fill="#fff" opacity=".88" stroke="#d5cfc2"/>`;
    team.forEach((w, k) => {
      const cx = p.x - (team.length * 11) / 2 + 5 + k * 11;
      const col = w.mustRest ? "#ff7b7b" : (w.busy ? "#ffb347" : "#79c98f");
      pips += `<circle cx="${cx}" cy="${p.y - 1.5}" r="4.6" fill="${col}" stroke="#5d6572" stroke-width="1.2"/>`;
    });
    pips += `</g>`;
  });

  floor.innerHTML = `
    <div class="sceneWrap">
      <svg class="sceneSvg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>${clipDefs.join("")}</defs>
        <rect x="0" y="0" width="${W}" height="${H}" fill="${C.bg}"/>
        <g transform="translate(${OX},${OY})">
          ${floorSvg}
          ${wallSvg}
          ${glassSvg}
          ${furn}
          ${pips}
          ${chars}
          ${desks}
        </g>
      </svg>
    </div>`;

  if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => fitScene(floor));
  else setTimeout(() => fitScene(floor), 16);
}

/* 让场景自适应容器（SVG 已按比例缩放，无需额外变换） */
function fitScene(floor) {
  const svg = floor.querySelector(".sceneSvg");
  if (!svg) return;
  const wrap = floor.querySelector(".sceneWrap");
  if (!wrap) return;
  const W = 1120, H = 660;
  const bw = wrap.clientWidth || 0, bh = wrap.clientHeight || 0;
  if (!bw || !bh) return;
  const scale = Math.min(bw / W, bh / H);
  svg.style.width = (W * scale) + "px";
  svg.style.height = (H * scale) + "px";
  svg.style.position = "absolute";
  svg.style.left = ((bw - W * scale) / 2) + "px";
  svg.style.top = ((bh - H * scale) / 2) + "px";
}

/* 点角色选中该主管 */
function selectStaff(id) {
  selStaff = id;
  selWorker = null;
  renderAll();
}

'''

src = src[:i] + new_js.replace("\n", nl) + src[j:]
open(path, "w", encoding="utf-8", newline="").write(src)
print("场景已重写")
