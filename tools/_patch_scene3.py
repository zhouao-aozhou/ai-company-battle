import sys, os, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

d = sys.argv[1]
path = os.path.join(d, "index.html")
src = open(path, encoding="utf-8", newline="").read()
nl = "\r\n" if "\r\n" in src else "\n"

start_mark = "const ISO_W = 48, ISO_H = 24;"
end_mark = "/* 点 ★ 主管行 = 查看主管详情（不派活，避免误操作） */"
i = src.find(start_mark)
j = src.find(end_mark, i)
if i < 0 or j < 0:
    print("找不到替换范围", i, j)
    sys.exit(1)

new_js = r'''/* =========================================================
   2D 等距办公室（用图集里的家具素材拼场景）
   ========================================================= */
const SHEET = "assets/iso/sheet.png";   // 4 列 × 3 行，每格 64×128
const SC = {
  bgTop: "#efece6", bgBot: "#e4e0d7",
  floorA: "#e0d6c3", floorB: "#d8cdb8", floorLine: "#cfc3ac",
  wall: "#eceae3", wallShade: "#dedbd2", trim: "#cdc8bc",
  glass: "#cfe4e9", metal: "#aeb6c1",
};

/* 取图集里第 (row,col) 格，锚点 = 底部中心 */
function spr(row, col, x, y, scale, extra) {
  scale = scale || 1;
  const w = 64 * scale, h = 128 * scale;
  return `<svg x="${(x - w / 2).toFixed(1)}" y="${(y - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"
    viewBox="${col * 64} ${row * 128} 64 128" preserveAspectRatio="xMidYMid meet" ${extra || ""}>
    <image href="${SHEET}" width="256" height="384" style="image-rendering:pixelated"/></svg>`;
}

function diamond(cx, cy, rw, rh, fill, extra) {
  return `<polygon points="${cx},${cy - rh} ${cx + rw},${cy} ${cx},${cy + rh} ${cx - rw},${cy}" fill="${fill}" ${extra || ""}/>`;
}

function renderOfficeScene(floor) {
  const W = 1120, H = 640;

  // 房间范围（等距地板铺一块矩形区域）
  const NX = 15, NY = 11;
  const TW = 46, TH = 23;
  const OX = W / 2 + 30, OY = 150;
  const P = (gx, gy, gz) => ({ x: (gx - gy) * TW + OX, y: (gx + gy) * TH - (gz || 0) + OY });

  // 地板
  let floorSvg = "";
  for (let gx = -1; gx < NX; gx++) {
    for (let gy = -1; gy < NY; gy++) {
      const col = ((gx + gy) % 2 === 0) ? SC.floorA : SC.floorB;
      const a = P(gx, gy), b = P(gx + 1, gy), c = P(gx + 1, gy + 1), d2 = P(gx, gy + 1);
      floorSvg += `<polygon points="${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d2.x},${d2.y}" fill="${col}" stroke="${SC.floorLine}" stroke-width=".5"/>`;
    }
  }

  // 墙
  const wallH = 118;
  const w1 = P(-1, -1, wallH), w2 = P(NX, -1, wallH), w3 = P(NX, -1, 0), w4 = P(-1, -1, 0);
  const l1 = P(-1, -1, wallH), l2 = P(-1, NY, wallH), l3 = P(-1, NY, 0), l4 = P(-1, -1, 0);
  let wallSvg = `
    <polygon points="${l1.x},${l1.y} ${l2.x},${l2.y} ${l3.x},${l3.y} ${l4.x},${l4.y}" fill="${SC.wallShade}"/>
    <polygon points="${w1.x},${w1.y} ${w2.x},${w2.y} ${w3.x},${w3.y} ${w4.x},${w4.y}" fill="${SC.wall}"/>
    <polygon points="${w4.x},${w4.y} ${w3.x},${w3.y} ${w3.x},${w3.y + 7} ${w4.x},${w4.y + 7}" fill="${SC.trim}"/>`;

  // 窗户（贴在右墙上方）
  const win0 = P(3.2, -1, 96), winW = 190, winH = 74;
  wallSvg += `<rect x="${win0.x - 30}" y="${win0.y - 18}" width="${winW}" height="${winH}" rx="3" fill="#d9ecf2" stroke="${SC.trim}" stroke-width="3"/>
    <line x1="${win0.x - 30 + winW / 2}" y1="${win0.y - 18}" x2="${win0.x - 30 + winW / 2}" y2="${win0.y - 18 + winH}" stroke="${SC.trim}" stroke-width="2"/>`;

  // 挂钟
  const ck = P(10.5, -1, 74);
  wallSvg += `<circle cx="${ck.x}" cy="${ck.y}" r="17" fill="#fbfaf6" stroke="${SC.trim}" stroke-width="2.5"/>
    <line x1="${ck.x}" y1="${ck.y}" x2="${ck.x}" y2="${ck.y - 11}" stroke="#5f6878" stroke-width="2"/>
    <line x1="${ck.x}" y1="${ck.y}" x2="${ck.x + 7}" y2="${ck.y + 4}" stroke="#5f6878" stroke-width="2"/>`;

  // 工位布局（屏幕坐标，从后到前绘制）
  const deskPos = [
    { gx: 1.2, gy: 1.2 }, { gx: 5.6, gy: 1.2 }, { gx: 10.0, gy: 1.2 },
    { gx: 3.4, gy: 5.0 }, { gx: 7.8, gy: 5.0 },
  ];

  let props = "";
  // 后墙边的柜子 / 书架
  const cab = P(12.6, 0.4);
  props += spr(1, 0, cab.x, cab.y, 1.0);
  const shf = P(13.9, 0.4);
  props += spr(1, 1, shf.x, shf.y, 1.0);
  // 打印机
  const prt = P(14.4, 3.4);
  props += spr(1, 2, prt.x, prt.y, 0.9);
  // 白板挂墙
  const bd = P(0.6, 0.2, 40);
  props += `<image href="${SHEET}" x="${bd.x - 60}" y="${bd.y - 90}" width="120" height="240"
      style="image-rendering:pixelated" opacity="0"/>

`;
  props += spr(1, 3, P(6.6, 0.2).x, P(6.6, 0.2).y, 0.95);

  // 桌子（按 gy 从后往前）
  const order = deskPos.map((p, i) => ({ p, i })).sort((a, b) => a.p.gx + a.p.gy - (b.p.gx + b.p.gy));
  let deskSvg = "", chairSvg = "";
  order.forEach(o => {
    const p = P(o.p.gx, o.p.gy);
    // 椅子在桌子后方偏左
    const ch = P(o.p.gx + 1.0, o.p.gy + 0.2);
    chairSvg += spr(2, 2, ch.x, ch.y + 26, 0.95);
    deskSvg += spr(0, 0, p.x, p.y + 6, 1.0);
    // 显示器放桌面
    const m = P(o.p.gx + 1.4, o.p.gy + 1.0, 34);
    deskSvg += spr(0, 3, m.x, m.y + 12, 0.55);
  });

  // 角色头像（放在桌子后方，被桌子挡住下半截）
  let chars = "";
  const clipDefs = [];
  G.staff.forEach((s, i) => {
    const dp = deskPos[i] || deskPos[0];
    const head = P(dp.gx + 1.9, dp.gy + 0.9, 56);
    const R = 30;
    const cid = "avClip" + i;
    clipDefs.push(`<clipPath id="${cid}"><circle cx="${head.x}" cy="${head.y}" r="${R}"/></clipPath>`);
    const sel = selStaff === s.id;
    chars += `<g onclick="selectStaff('${s.id}')" style="cursor:pointer">
      <circle cx="${head.x}" cy="${head.y}" r="${R + 3}" fill="#fff" stroke="${sel ? "#ffd166" : "#cfc9bc"}" stroke-width="3"/>
      <image href="${s.portrait}" x="${head.x - R}" y="${head.y - R}" width="${R * 2}" height="${R * 2}"
             clip-path="url(#${cid})" preserveAspectRatio="xMidYMid slice"/>
    </g>`;
    // 名牌
    const tagW = Math.max(56, s.name.length * 8.4 + 20);
    chars += `<g onclick="selectStaff('${s.id}')" style="cursor:pointer">
      <rect x="${head.x - tagW / 2}" y="${head.y - R - 25}" width="${tagW}" height="20" rx="5"
            fill="#fff" stroke="#cfc9bc" stroke-width="1.5"/>
      <text x="${head.x}" y="${head.y - R - 11}" text-anchor="middle" font-size="11.5" fill="#3d4659"
            font-family="system-ui,-apple-system,'PingFang SC',sans-serif" font-weight="600">${s.name}</text>
    </g>`;
    if (s.working) {
      chars += `<rect x="${head.x - 22}" y="${head.y + R + 4}" width="44" height="16" rx="4" fill="#e07a3a"/>
        <text x="${head.x}" y="${head.y + R + 15}" text-anchor="middle" font-size="9.5" fill="#fff"
              font-family="system-ui">在做活</text>`;
    }
  });

  // 员工状态圆点
  let pips = "";
  G.staff.forEach((s, i) => {
    const dp = deskPos[i] || deskPos[0];
    const team = (G.workers || []).filter(w => w.aiId === s.id);
    if (!team.length) return;
    const p = P(dp.gx + 2.6, dp.gy + 2.4, 30);
    const bw = team.length * 12 + 10;
    pips += `<g onclick="selectStaff('${s.id}')" style="cursor:pointer">
      <rect x="${p.x - bw / 2}" y="${p.y - 11}" width="${bw}" height="20" rx="5" fill="#fff" opacity=".92" stroke="#d6cfc0" stroke-width="1.2"/>`;
    team.forEach((w, k) => {
      const cx = p.x - bw / 2 + 11 + k * 12;
      const col = w.mustRest ? "#ef7a7a" : (w.busy ? "#f0a63c" : "#6fc48b");
      pips += `<circle cx="${cx}" cy="${p.y - 1}" r="4.8" fill="${col}" stroke="#59616f" stroke-width="1.1"/>`;
    });
    pips += `</g>`;
  });

  floor.innerHTML = `
    <div class="sceneWrap">
      <svg class="sceneSvg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          ${clipDefs.join("")}
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#f2f0ea"/><stop offset="1" stop-color="#e3e0d7"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${W}" height="${H}" fill="${SC.bgBot}"/>
        <rect x="0" y="0" width="${W}" height="${H * 0.62}" fill="${SC.bgTop}"/>
        ${floorSvg}
        ${wallSvg}
        ${props}
        ${chairSvg}
        ${chars}
        ${deskSvg}
        ${pips}
      </svg>
    </div>`;

  if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => fitScene(floor));
  else setTimeout(() => fitScene(floor), 16);
}

/* 让场景自适应容器 */
function fitScene(floor) {
  const svg = floor.querySelector(".sceneSvg");
  const wrap = floor.querySelector(".sceneWrap");
  if (!svg || !wrap) return;
  const W = 1120, H = 640;
  const bw = wrap.clientWidth || 0, bh = wrap.clientHeight || 0;
  if (!bw || !bh) return;
  const scale = Math.min(bw / W, bh / H);
  svg.style.position = "absolute";
  svg.style.width = (W * scale) + "px";
  svg.style.height = (H * scale) + "px";
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
print("场景改为素材拼接版")
