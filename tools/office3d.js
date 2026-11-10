/* 办公室 3D 场景：实时 three.js 渲染 */
import * as THREE from "three";
import { GLTFLoader } from "./GLTFLoader.js";

const C = {
  floor: 0xe9e3d5,
  roadLight: 0xf2ede3,
  roadDark: 0xe6dfd1,
  curb: 0xd8d2c6,
  wall: 0xf7f4ee,
  glass: 0xd8e8ee,
  frame: 0xa9b4c0,
};

const GRAD = (() => {
  const t = new THREE.DataTexture(new Uint8Array([150, 200, 235, 255]), 4, 1, THREE.RedFormat);
  t.needsUpdate = true;
  t.minFilter = t.magFilter = THREE.NearestFilter;
  return t;
})();

const toon = (color) => new THREE.MeshToonMaterial({ color, gradientMap: GRAD });

export const STATIONS = [
  { id: "claude", x: -15, z: -5.4, side: -1, color: 0xf0a882 },
  { id: "deepseek", x: -7.5, z: 5.4, side: 1, color: 0x9cc0e6 },
  { id: "gemini", x: 0, z: -5.4, side: -1, color: 0xc3abe4 },
  { id: "grok", x: 7.5, z: 5.4, side: 1, color: 0xf0a678 },
  { id: "chatgpt", x: 15, z: -5.4, side: -1, color: 0x9ad6b0 },
];

const RW = 7.2, RD = 6.0, RH = 3.4, LOW = RH * 0.58;
const PLAT = 0;                   // 同一平面，无高差
const SIDE_X0 = 6, SIDE_X1 = 48;  // 右侧平台范围
const RAMP_X0 = 6, RAMP_X1 = 17;  // 坡道 x 区间
const RAMP_HW = 4.2;              // 坡道半宽(z)

let renderer = null, scene = null, camera = null, container = null;
const camPos = new THREE.Vector3(24, 24, 24);
const CAM_BASE = new THREE.Vector3(24, 24, 24);   // 全景时的机位
const camLook = new THREE.Vector3(0, 1, 0);
let zoom = 0.8, panX = 0, panY = 0;   // 0.8 = 整体放大 25%
let heroMode = false;                 // 角色特写模式
let focusedRoom = null;               // 当前聚焦的房间（部门 id）
const roomMats = {};                  // deptId -> 地垫材质
let ringMesh = null;                  // 选中房间的金色光圈
let ringBase = null;                  // 光圈中心
let fpMode = false;                   // 第一人称模式
let heroTarget = null;                // 被特写的对象
let perspCam = null;                  // 特写用透视相机
let heroLights = [];                  // 特写补光
let RENDER_SCALE = 2.0;      // 画布 = 容器 × 倍率（会随 zoom 动态调整）
let raf = null, ready = false;

function add(mesh) { scene.add(mesh); return mesh; }

function wallSolid(x, z, w, d, h) {
  // 墙体：暖白，受光面与侧面形成明暗差
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(0xece5d7));
  m.position.set(x, h / 2, z);
  m.castShadow = true; m.receiveShadow = true;
  add(m);
  // 墙顶压条（深一档，勾出轮廓）
  const capW = w > d ? w : w + 0.06;
  const capD = w > d ? d + 0.06 : d;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(capW, 0.06, capD), toon(0xd8d2c6));
  cap.position.set(x, h + 0.03, z);
  add(cap);
  return m;
}

function wallGlass(x, z, w, d, h, base) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color: C.glass, transparent: true, opacity: 0.14,
      roughness: 0.1, metalness: 0, side: THREE.DoubleSide,
    })
  );
  m.position.set(x, base + h / 2, z);
  return add(m);
}

function frameBar(x, z, w, d, y) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.09, d), toon(C.frame));
  m.position.set(x, y, z);
  return add(m);
}

function buildDesk(cx, cz, rot) {
  const TOP = 1.28, DW = 2.2, DD = 1.15;
  const ry = rot || 0;
  const group = new THREE.Group();
  group.position.set(cx, 0, cz);
  group.rotation.y = ry;
  scene.add(group);
  const put = (m) => { group.add(m); return m; };

  // 桌面（浅木白）
  const top = new THREE.Mesh(new THREE.BoxGeometry(DW, 0.08, DD), toon(0xfaf6ee));
  top.position.set(0, TOP, 0);
  top.castShadow = true; top.receiveShadow = true;
  put(top);

  // 前挡板（面向椅子那侧，浅灰白）
  const panel = new THREE.Mesh(new THREE.BoxGeometry(DW, 0.62, 0.06), toon(0xf2ece1));
  panel.position.set(0, TOP - 0.36, DD / 2 - 0.05);
  panel.castShadow = true;
  put(panel);

  // 桌腿（细金属）
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, TOP, 0.06), toon(0xbfc6cf));
    leg.position.set(sx * (DW / 2 - 0.1), TOP / 2, sz * (DD / 2 - 0.1));
    leg.castShadow = true;
    put(leg);
  });

  // 显示器：支架 + 底板 + 屏体 + 屏幕
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.12), toon(0x2b3038));
  stand.position.set(0, TOP + 0.21, -0.28);
  put(stand);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.035, 0.24), toon(0x2b3038));
  base.position.set(0, TOP + 0.05, -0.28);
  put(base);
  [-0.52, 0.52].forEach((dx) => {
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.62, 0.05), toon(0x1f242b));
    bezel.position.set(dx, TOP + 0.7, -0.3);
    bezel.castShadow = true;
    put(bezel);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.52, 0.02), toon(0x33404f));
    screen.position.set(dx, TOP + 0.7, -0.272);
    put(screen);
    const sstand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.07), toon(0x2b3038));
    sstand.position.set(dx, TOP + 0.26, -0.28);
    put(sstand);
  });

  // 键盘 + 鼠标
  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.025, 0.26), toon(0x2b3038));
  kb.position.set(-0.12, TOP + 0.055, 0.14);
  put(kb);
  const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.16), toon(0x2b3038));
  mouse.position.set(0.42, TOP + 0.06, 0.16);
  put(mouse);

  // 黑色办公椅：五爪底座 + 立柱 + 坐垫 + 靠背 + 扶手
  const chairZ = DD / 2 + 0.62;
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.07), toon(0x23272e));
    leg.position.set(Math.cos(ang) * 0.2, 0.08, chairZ + Math.sin(ang) * 0.2);
    leg.rotation.y = -ang;
    leg.castShadow = true;
    put(leg);
  }
  const poleC = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 8), toon(0x9aa2ae));
  poleC.position.set(0, 0.29, chairZ);
  put(poleC);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.11, 0.72), toon(0x24282f));
  seat.position.set(0, 0.55, chairZ);
  seat.castShadow = true;
  put(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.1), toon(0x24282f));
  back.position.set(0, 0.96, chairZ + 0.34);
  back.castShadow = true;
  put(back);
  [-1, 1].forEach((sg) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.5), toon(0x353b44));
    arm.position.set(sg * 0.4, 0.74, chairZ + 0.06);
    put(arm);
  });
  return group;
}

function buildPlant(cx, cz) {
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.42, 10), toon(0xd8cfc0));
  pot.position.set(cx, 0.21, cz);
  pot.castShadow = true;
  add(pot);
  const bush = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), toon(0x74c48a));
  bush.position.set(cx, 0.66, cz);
  bush.castShadow = true;
  add(bush);
}

function buildRoom(s, baseY, openBack) {
  const y0 = baseY || 0;
  const DOOR = 2.2;
  const { x, z, side, color } = s;
  const put = (m) => { m.position.y += y0; return m; };
  const wallS = (x1, z1, w, d, h) => put(wallSolid(x1, z1, w, d, h));
  const wallG = (x1, z1, w, d, h, b) => put(wallGlass(x1, z1, w, d, h, b));
  const frame = (x1, z1, w, d, y2) => put(frameBar(x1, z1, w, d, y2));
  const halfW = RW / 2, halfD = RD / 2;
  // 门朝走廊那一侧（内侧），背墙朝外侧
  const doorZ = z - side * halfD;
  const backZ = z + side * halfD;

  if (openBack) {
    const segW = (RW - DOOR) / 2;
    wallS(x - (DOOR / 2 + segW / 2), backZ, segW, 0.16, LOW);
    wallS(x + (DOOR / 2 + segW / 2), backZ, segW, 0.16, LOW);
    wallG(x - (DOOR / 2 + segW / 2), backZ, segW, 0.08, RH - LOW, LOW);
    wallG(x + (DOOR / 2 + segW / 2), backZ, segW, 0.08, RH - LOW, LOW);
  } else {
    wallS(x, backZ, RW, 0.16, LOW);
    wallG(x, backZ, RW, 0.08, RH - LOW, LOW);
  }
  frame(x, backZ, RW, 0.1, RH);

  [-halfW, halfW].forEach((dx) => {
    wallS(x + dx, z, 0.16, RD, LOW);
    wallG(x + dx, z, 0.08, RD, RH - LOW, LOW);
    frame(x + dx, z, 0.1, RD, RH);
  });

  // 门那面：中间留 2.2 米空档（真正能走进去）
  const dseg = (RW - DOOR) / 2;
  wallG(x - (DOOR / 2 + dseg / 2), doorZ, dseg, 0.08, RH - LOW, LOW);
  wallG(x + (DOOR / 2 + dseg / 2), doorZ, dseg, 0.08, RH - LOW, LOW);
  wallS(x - (DOOR / 2 + dseg / 2), doorZ, dseg, 0.16, LOW);
  wallS(x + (DOOR / 2 + dseg / 2), doorZ, dseg, 0.16, LOW);
  frame(x, doorZ, RW, 0.1, RH);
  // 门框立柱
  [-1, 1].forEach((sg) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, LOW, 0.16), toon(C.frame));
    post.position.set(x + sg * (DOOR / 2), LOW / 2, doorZ);
    add(post);
  });

  const tinted = new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.9);
  const mat = new THREE.Mesh(new THREE.BoxGeometry(RW - 0.4, 0.02, RD - 0.4), toon(tinted));
  mat.position.set(x, 0.02 + y0, z);
  mat.receiveShadow = true;
  add(mat);
  // 记录下来，用于选中高亮
  if (s && s.id) roomMats[s.id] = { mat, base: tinted.clone() };

  const raise = (fn) => { const before = scene.children.length; fn(); for (let i = before; i < scene.children.length; i++) scene.children[i].position.y += y0; };
  raise(() => buildDesk(x - 1.55, z - 0.75));
  raise(() => buildDesk(x + 1.55, z - 0.75));
  raise(() => buildPlant(x + RW / 2 - 0.9, z + RD / 2 - 0.9));

  // —— 房间装饰 ——
  raise(() => deskProps(x - 1.55, z - 0.75, 0));
  raise(() => deskProps(x + 1.55, z - 0.75, 0));
  raise(() => pendantLamp(x, z, 4.2));
  raise(() => doorMat(x, doorZ + side * 0.85, 2.0, 1.1));
  const artCols = [0xe9c7a8, 0xa8c5e9, 0xc9b0e0, 0xf0c0a0, 0xa8dcc0];
  const artCol = artCols[Math.abs(Math.round(x + z)) % artCols.length];
  raise(() => wallArt(x, 2.4, backZ + side * 0.16, 1.5, 1.0, artCol, side > 0 ? 0 : Math.PI));
  raise(() => whiteboard(x - halfW + 0.16, 2.2, z, 2.2, 1.2, Math.PI / 2));
}

/* 左侧主平台（抬高） */
function buildMainPlatform() {
  const w = 60, d = 46;
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), tiledFloorMaterial(w / 2, d / 2));
  box.position.set(0, -0.2, 0);
  box.receiveShadow = true;
  add(box);
  // 地板边缘的柔和投影带，强化厚度感
  const band = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.06, d + 0.6), toon(0xd9d1c0));
  band.position.set(0, -0.4, 0);
  band.receiveShadow = true;
  add(band);
  // 侧壁阴影条，强化厚度
  const edge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), toon(0xdfd8c8));
  edge.position.set(0, 0.01, 0);
  edge.receiveShadow = true;
  add(edge);
}

/* 连接路：同一平面，从主区通往右侧平台 */
function buildRamp() {
  const len = RAMP_X1 - RAMP_X0;
  const seg = 1.0;
  for (let i = 0; i < len / seg; i++) {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(seg, 0.05, RAMP_HW * 2),
      toon(i % 2 ? C.roadLight : C.roadDark)
    );
    plate.position.set(RAMP_X0 + i * seg + seg / 2, 0.03, 0);
    plate.receiveShadow = true;
    add(plate);
  }
  [-1, 1].forEach((sg) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.14, 0.16), toon(C.curb));
    rail.position.set((RAMP_X0 + RAMP_X1) / 2, 0.06, sg * RAMP_HW);
    add(rail);
  });
}

/* 右侧大平台 */
function buildSidePlatform() {
  const w = SIDE_X1 - RAMP_X1, d = 30;
  const cx = (RAMP_X1 + SIDE_X1) / 2;
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), toon(C.floor));
  box.position.set(cx, -0.2, 0);
  box.receiveShadow = true;
  add(box);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), toon(0xdfd8c8));
  edge.position.set(cx, 0.01, 0);
  edge.receiveShadow = true;
  add(edge);
  return { cx, w, d };
}

/* 组员工作间：挂在主管室外侧，用一条短通道连过去 */
function buildStaffWing(dept, baseY) {
  const y0 = baseY || 0;
  const { x, z, side, color } = dept;
  const GAP = 4.4;                       // 通道长度
  const staffZ = z + side * (RD / 2 + GAP + RD / 2);   // 组员间中心
  const runwayZ = z + side * (RD / 2 + GAP / 2);

  // 通道（地面条带）
  const strip = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.05, GAP), toon(0xf4efe4));
  strip.position.set(x, y0 + 0.03, runwayZ);
  strip.receiveShadow = true;
  add(strip);
  // 通道两侧压边
  [-1, 1].forEach((sg) => {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, GAP), toon(C.curb));
    curb.position.set(x + sg * 1.46, y0 + 0.06, runwayZ);
    add(curb);
  });

  // 组员间：门朝主管室那一侧（side 取反）
  buildRoom({ id: dept.id + "_staff", x, z: staffZ, side: -side, color }, y0);
  // 组员间门口地垫
  doorMat(x, staffZ - side * (RD / 2) - side * 0.9, 2.0, 1.2);
}

/* 地砖纹理：一块砖 + 缝隙，循环铺满地板 */
function makeTileTexture() {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  // 砖体
  g.fillStyle = "#e4ddcc";
  g.fillRect(0, 0, S, S);
  // 上左高光
  g.fillStyle = "rgba(255,255,255,0.42)";
  g.fillRect(0, 0, S, 5);
  g.fillRect(0, 0, 5, S);
  // 下右阴影
  g.fillStyle = "rgba(140,128,105,0.34)";
  g.fillRect(0, S - 6, S, 6);
  g.fillRect(S - 6, 0, 6, S);
  // 砖缝
  g.strokeStyle = "#cdc3ad";
  g.lineWidth = 4;
  g.strokeRect(2, 2, S - 4, S - 4);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

let TILE_TEX = null;
function tiledFloorMaterial(repX, repY) {
  if (!TILE_TEX) TILE_TEX = makeTileTexture();
  const t = TILE_TEX.clone();
  t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repX, repY);
  return new THREE.MeshToonMaterial({ map: t, gradientMap: GRAD });
}

/* ---------- 装饰件 ---------- */
function buildFloorGrid() {
  const pts = [];
  for (let x = -28; x <= 28; x += 4) pts.push(x, 0.012, -22, x, 0.012, 22);
  for (let z = -22; z <= 22; z += 4) pts.push(-28, 0.012, z, 28, 0.012, z);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xded7c7, transparent: true, opacity: 0.85 }));
  add(lines);
}

function bush(cx, cz, r) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(r || 0.42, 10, 8), toon(0x7cc48f));
  b.position.set(cx, (r || 0.42) * 0.95, cz);
  b.castShadow = true;
  add(b);
}

function pottedPlant(cx, cz, scale) {
  const k = scale || 1;
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * k, 0.24 * k, 0.5 * k, 10), toon(0xd9d0c0));
  pot.position.set(cx, 0.25 * k, cz);
  pot.castShadow = true;
  add(pot);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * k, 0.05 * k, 0.7 * k, 6), toon(0x7a8b6a));
  stem.position.set(cx, 0.75 * k, cz);
  add(stem);
  [[0, 1.05], [-0.28, 0.9], [0.28, 0.9]].forEach(([dx, dy]) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.32 * k, 9, 7), toon(0x6fbf7f));
    leaf.position.set(cx + dx * k, dy * k, cz);
    leaf.castShadow = true;
    add(leaf);
  });
}

function sofa(cx, cz, rot) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rot || 0;
  add(g);
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 1.1), toon(0xcbcfd6));
  base.position.set(0, 0.25, 0);
  base.castShadow = true; base.receiveShadow = true;
  g.add(base);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.62, 0.24), toon(0xbfc4cd));
  back.position.set(0, 0.72, -0.43);
  back.castShadow = true;
  g.add(back);
  [-1, 1].forEach((sg) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 1.1), toon(0xc4c9d1));
    arm.position.set(sg * 1.19, 0.62, 0);
    g.add(arm);
  });
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.8), toon(0xe4e8ee));
  cushion.position.set(0, 0.56, 0.06);
  g.add(cushion);
}

function coffeeTable(cx, cz) {
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.8), toon(0xf3ede2));
  top.position.set(cx, 0.42, cz);
  top.castShadow = true;
  add(top);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.4, 0.07), toon(0xbcc0c8));
    leg.position.set(cx + sx * 0.65, 0.2, cz + sz * 0.32);
    add(leg);
  });
}

function cabinet(cx, cz, rot) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rot || 0;
  add(g);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 0.5), toon(0xe8e1d2));
  body.position.set(0, 0.75, 0);
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  for (let i = 0; i < 3; i++) {
    const drawer = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.03, 0.04), toon(0xcfc7b6));
    drawer.position.set(0, 0.4 + i * 0.42, 0.27);
    g.add(drawer);
  }
}

function trashBin(cx, cz) {
  const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.55, 10), toon(0xb9bec6));
  bin.position.set(cx, 0.27, cz);
  bin.castShadow = true;
  add(bin);
}

function rug(cx, cz, w, d, color) {
  const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), toon(color));
  r.position.set(cx, 0.03, cz);
  r.receiveShadow = true;
  add(r);
}

function buildTanks() {
  const spots = [
    [-27, -8, 0.35, 0],
    [27, 2, -0.4, 1],
    [-26, 21, 0.15, 2],
    [27, 18, -0.3, 3],
    [-12, 20.5, 0.1, 0],
    [12, 20.5, -0.2, 1],
    [-26, -19, 0.4, 3],
    [24, -19.5, -0.35, 0],
    [0, 20.5, 0.25, 2],
    [0, -20, 0.2, 3],
  ];
  spots.forEach(([x, z, r, sd]) => aquarium(x, z, r, sd));
}

function buildFacilities() {
  // 走廊东端：咖啡吧台（面朝走廊）
  barCounter(24, -1.6, Math.PI);
  // 走廊西端：饮水机 + 打印机
  waterCooler(-24, 3.2);
  printer(-24, -3.4, Math.PI / 2);
  // 西南空地：乒乓球台
  pingPong(-21, 14.5, 0.25);
  // 东南角：书架
  bookshelf(24, 9.5, -Math.PI / 2);
  bookshelf(24, 12.4, -Math.PI / 2);
  // 西南角：休息角
  rug(-24, 17.5, 5.4, 3.4, 0xe6ddcb);
  sofa(-24, 16.3, 0);
  coffeeTable(-24, 18.4);
  // 西北角：绿植花坛
  [-26, -24.4, -22.8].forEach((bx) => bush(bx, -16.5, 0.4));
  [-26, -24.4, -22.8].forEach((bx) => bush(bx, -18.2, 0.34));
}

function buildDecor() {
  // 走廊两侧：交替摆放盆栽与灌木
  [-16, -8, 8, 16].forEach((x, i) => {
    pottedPlant(x, (i % 2 ? 1 : -1) * 3.6, 0.9);
  });
  [-12, -4, 4, 12].forEach((x, i) => {
    bush(x, (i % 2 ? -1 : 1) * 4.2, 0.4);
  });

  // 左端休息区：沙发 + 茶几 + 地毯
  rug(-23.5, 13, 6.4, 4.2, 0xe6ddcb);
  sofa(-23.5, 11.4, 0);
  sofa(-23.5, 14.8, Math.PI);
  coffeeTable(-23.5, 13.1);
  pottedPlant(-26.6, 11.2, 1.1);
  pottedPlant(-26.6, 15.0, 1.1);

  // 右端：文件柜排 + 垃圾桶
  cabinet(25.5, 10.5, -Math.PI / 2);
  cabinet(25.5, 12.4, -Math.PI / 2);
  trashBin(24.4, 9.0);

  // 主入口两侧对称盆栽
  pottedPlant(-20.5, -3.4, 1.0);
  pottedPlant(-20.5, 3.4, 1.0);
  pottedPlant(20.5, -3.4, 1.0);
  pottedPlant(20.5, 3.4, 1.0);

  // 中央走廊两端的地毯
  rug(0, 0, 6, 3.2, 0xefe8da);
}

/* 墙上挂画 */
function wallArt(x, y, z, w, h, color, rotY) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY || 0;
  add(g);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.05), toon(0xbfae8e));
  frame.castShadow = true;
  g.add(frame);
  const canvas = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), toon(color));
  canvas.position.z = 0.035;
  g.add(canvas);
}

/* 白板 */
function whiteboard(x, y, z, w, h, rotY) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY || 0;
  add(g);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, h + 0.12, 0.06), toon(0x9aa3ae));
  frame.castShadow = true;
  g.add(frame);
  const board = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), toon(0xfbfdff));
  board.position.z = 0.04;
  g.add(board);
  // 简笔线条
  [[-0.5, 0.25, 0.7], [-0.3, -0.05, 0.5], [0.1, 0.15, 0.9]].forEach(([dx, dy, len]) => {
    const line = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, 0.01), toon(0x9fb4cc));
    line.position.set(dx * w * 0.5, dy * h * 0.5, 0.052);
    g.add(line);
  });
}

/* 桌上物件：杯子 + 文件堆 */
function deskProps(cx, cz, y0) {
  const base = y0 || 0;
  // 文件堆
  for (let i = 0; i < 3; i++) {
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.02, 0.32), toon(i % 2 ? 0xfbf8f1 : 0xf1ece0));
    paper.position.set(cx - 0.72, 1.35 + i * 0.022, cz + 0.12);
    paper.rotation.y = (i - 1) * 0.08;
    add(paper);
  }
  // 杯子
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.2, 10), toon(0xd8e6ee));
  cup.position.set(cx + 0.78, 1.4, cz + 0.1);
  cup.castShadow = true;
  add(cup);
  // 笔筒
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 8), toon(0xb9c2cc));
  holder.position.set(cx - 0.95, 1.38, cz - 0.28);
  add(holder);
}

/* 吊灯：从上方垂下的灯罩 */
function pendantLamp(cx, cz, topY) {
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.1, 5), toon(0x8d949e));
  cable.position.set(cx, (topY || 4.6) - 0.55, cz);
  add(cable);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.44, 12, 1, true), toon(0xf5efe2));
  shade.position.set(cx, (topY || 4.6) - 1.25, cz);
  shade.rotation.x = Math.PI;
  shade.castShadow = true;
  add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), toon(0xfff3cf));
  bulb.position.set(cx, (topY || 4.6) - 1.42, cz);
  add(bulb);
}

/* 门口地垫 */
function doorMat(cx, cz, w, d) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w || 1.8, 0.015, d || 1.1), toon(0xcdd3da));
  m.position.set(cx, 0.025, cz);
  m.receiveShadow = true;
  add(m);
}

/* 咖啡吧台 */
function barCounter(cx, cz, rot) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz); g.rotation.y = rot || 0; add(g);
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.05, 0.8), toon(0xdfd6c6));
  body.position.set(0, 0.52, 0); body.castShadow = true; body.receiveShadow = true; g.add(body);
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.1, 0.95), toon(0xf5eee1));
  top.position.set(0, 1.1, 0); top.castShadow = true; g.add(top);
  // 咖啡机
  const mach = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 0.55), toon(0x3d4550));
  mach.position.set(-1.1, 1.52, -0.1); mach.castShadow = true; g.add(mach);
  const cupTray = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.4), toon(0xb0b7c0));
  cupTray.position.set(-1.1, 1.16, 0.12); g.add(cupTray);
  // 杯子若干
  [-0.3, 0.15, 0.7].forEach((dx, i) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.19, 9), toon(i % 2 ? 0xe8eef4 : 0xf3e7d6));
    c.position.set(dx, 1.25, 0.1); g.add(c);
  });
  // 高脚凳
  [-1.2, 0, 1.2].forEach((dx) => {
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.09, 12), toon(0xc9ced6));
    seat.position.set(dx, 0.76, 0.95); seat.castShadow = true; g.add(seat);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.72, 8), toon(0x9aa2ae));
    pole.position.set(dx, 0.38, 0.95); g.add(pole);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 12), toon(0x9aa2ae));
    foot.position.set(dx, 0.03, 0.95); g.add(foot);
  });
}

/* 书架 */
function bookshelf(cx, cz, rot) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz); g.rotation.y = rot || 0; add(g);
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 0.42), toon(0xe3d9c6));
  body.position.set(0, 1.1, 0); body.castShadow = true; body.receiveShadow = true; g.add(body);
  for (let r = 0; r < 3; r++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 0.4), toon(0xcfc3ad));
    shelf.position.set(0, 0.55 + r * 0.62, 0.02); g.add(shelf);
    for (let i = 0; i < 7; i++) {
      const bw = 0.1 + (i % 3) * 0.03;
      const bk = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.44, 0.3),
        toon([0xb9765f, 0x6f8fae, 0x93a86f, 0xc7a26a, 0x8c7fae, 0x6fa39a][i % 6]));
      bk.position.set(-0.86 + i * 0.26, 0.82 + r * 0.62, 0.02);
      g.add(bk);
    }
  }
}

/* 乒乓球桌 */
function pingPong(cx, cz, rot) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz); g.rotation.y = rot || 0; add(g);
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 1.4), toon(0x4c8f7a));
  top.position.set(0, 0.76, 0); top.castShadow = true; top.receiveShadow = true; g.add(top);
  const net = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 1.42), toon(0xeef2f5));
  net.position.set(0.5, 0.87, 0); g.add(net);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 0.08), toon(0x3f4a55));
    leg.position.set(sx * 1.1, 0.37, sz * 0.55); g.add(leg);
  });
}

/* 饮水机 */
function waterCooler(cx, cz) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz); add(g);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.1, 0.5), toon(0xdfe5ec));
  body.position.set(0, 0.55, 0); body.castShadow = true; g.add(body);
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.6, 12), toon(0xa8d0e6));
  bottle.position.set(0, 1.4, 0); g.add(bottle);
}

/* 打印机 */
function printer(cx, cz, rot) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz); g.rotation.y = rot || 0; add(g);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.72, 0.9), toon(0xdad2c2));
  stand.position.set(0, 0.36, 0); stand.castShadow = true; g.add(stand);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.52, 0.68), toon(0x464e5a));
  body.position.set(0, 0.98, 0); body.castShadow = true; g.add(body);
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.24), toon(0xb9c0ca));
  tray.position.set(0, 0.78, 0.42); g.add(tray);
}

/* 卡通鱼缸 */
const tanks = [];
function aquarium(cx, cz, rotY, seed) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY || 0;
  add(g);

  const W = 2.2, H = 1.25, D = 1.0, y0 = 0.5;

  // 底座
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.16, 0.5, D + 0.16), toon(0xdfd6c6));
  base.position.set(0, 0.25, 0);
  base.castShadow = true; base.receiveShadow = true;
  g.add(base);

  // 玻璃：整块半透明盒（一个物体，省 draw call）
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(W, H, D),
    new THREE.MeshStandardMaterial({ color: 0xdcf1f7, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0 })
  );
  glass.position.set(0, y0 + H / 2, 0);
  g.add(glass);

  // 水体
  const water = new THREE.Mesh(
    new THREE.BoxGeometry(W - 0.14, H - 0.2, D - 0.14),
    new THREE.MeshStandardMaterial({ color: 0x8fd4e8, transparent: true, opacity: 0.4, roughness: 0.2, metalness: 0 })
  );
  water.position.set(0, y0 + (H - 0.2) / 2 + 0.06, 0);
  g.add(water);

  // 底砂
  const pebbleCols = [0xd8d2c4, 0xc9b8a0, 0xa8b8c4, 0xe0c8a8, 0xb8c8c0, 0xcdbfae];
  for (let i = 0; i < 10; i++) {
    const pb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 7, 5), toon(pebbleCols[i % 6]));
    pb.position.set(-W / 2 + 0.2 + i * 0.2, y0 + 0.06, -D / 2 + 0.2 + (i % 3) * 0.22);
    pb.scale.y = 0.6;
    g.add(pb);
  }

  // 水草
  for (let i = 0; i < 3; i++) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.6, 5), toon(0x7cc48f));
    stem.position.set(-W / 2 + 0.35 + i * 0.55, y0 + 0.34, -D / 2 + 0.24);
    stem.rotation.z = (i - 1) * 0.12;
    g.add(stem);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 5), toon(0x8fd49b));
    leaf.position.set(-W / 2 + 0.35 + i * 0.55, y0 + 0.68, -D / 2 + 0.24);
    leaf.scale.set(1, 0.55, 0.7);
    g.add(leaf);
  }

  // 鱼
  const fishes = [];
  const fishCols = [0xf2a86a, 0xf0b878, 0x8fb8e0, 0xf09060];
  for (let i = 0; i < 3; i++) {
    const fg = new THREE.Group();
    const col = fishCols[(i + (seed || 0)) % 4];
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), toon(col));
    body.scale.set(1.5, 1, 0.8);
    fg.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 6), toon(col));
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-0.26, 0, 0);
    fg.add(tail);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 5), toon(0x2a3038));
    eye.position.set(0.14, 0.045, 0.09);
    fg.add(eye);
    if (i % 2 === 1) {
      for (let k = -1; k <= 1; k++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.2), toon(0x5b86c0));
        stripe.position.set(k * 0.09, 0, 0);
        fg.add(stripe);
      }
    }
    g.add(fg);
    fishes.push({
      obj: fg,
      bx: -W / 2 + 0.45 + i * 0.55,
      by: y0 + 0.58 + (i % 2) * 0.18,
      bz: -D / 2 + 0.32 + (i % 2) * 0.3,
      phase: i * 1.7 + (seed || 0),
      speed: 0.5 + (i % 3) * 0.18,
    });
  }

  // 气泡
  const bubbles = [];
  for (let i = 0; i < 4; i++) {
    const bb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), toon(0xffffff));
    bb.position.set(-0.6 + i * 0.3, y0 + 0.2, 0.12);
    g.add(bb);
    bubbles.push({ obj: bb, phase: i * 0.9 });
  }

  tanks.push({ fishes, bubbles, y0, H });
  return g;
}

function animateTanks(t) {
  if (!tanks.length) return;
  const time = (t || 0) * 0.001;
  for (let i = 0; i < tanks.length; i++) {
    const tk = tanks[i];
    for (let j = 0; j < tk.fishes.length; j++) {
      const f = tk.fishes[j];
      const s2 = Math.sin(time * f.speed + f.phase);
      f.obj.position.set(f.bx + s2 * 0.2, f.by + Math.sin(time * 0.7 + f.phase) * 0.06, f.bz);
      f.obj.rotation.y = s2 * 0.5;
    }
    for (let j = 0; j < tk.bubbles.length; j++) {
      const b = tk.bubbles[j];
      const p = (time * 0.35 + b.phase) % 1;
      b.obj.position.y = tk.y0 + 0.15 + p * (tk.H - 0.35);
      b.obj.scale.setScalar(0.7 + p * 0.6);
    }
  }
}

/* 视角对面的两面围墙（西墙 + 北墙），形成空间纵深 */
﻿/* ---------- Q 版角色（金发双马尾 · 黑金哥特裙） ---------- */
function buildChibi(cx, cz, rotY, scale) {
  const K = scale || 1;
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY || 0;
  g.scale.setScalar(K);
  add(g);

  const SKIN = 0xfbe2d2, HAIR = 0xf2e2ac, DRESS = 0x2c2732, DRESS_L = 0x3a3442;
  const GOLD = 0xc9a24d, RED = 0xa8323c, EYE = 0x5a8fd0;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), toon(SKIN));
  head.position.set(0, 1.62, 0); head.scale.set(1, 0.98, 0.95); head.castShadow = true; g.add(head);

  const backHair = new THREE.Mesh(new THREE.SphereGeometry(0.46, 18, 14), toon(HAIR));
  backHair.position.set(0, 1.66, -0.05); g.add(backHair);
  const bang = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 12), toon(HAIR));
  bang.position.set(0, 1.78, 0.06); bang.scale.set(1.0, 0.62, 0.98); g.add(bang);

  [-0.15, 0.15].forEach((dx) => {
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), toon(0xffffff));
    white.position.set(dx, 1.60, 0.37); white.scale.set(1, 1.15, 0.5); g.add(white);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), toon(EYE));
    iris.position.set(dx, 1.60, 0.41); iris.scale.set(1, 1.1, 0.4); g.add(iris);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), toon(0x24314a));
    pupil.position.set(dx, 1.60, 0.44); pupil.scale.set(1, 1, 0.4); g.add(pupil);
  });
  [-0.26, 0.26].forEach((dx) => {
    const blush = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), toon(0xf6b8b8));
    blush.position.set(dx, 1.48, 0.34); blush.scale.set(1, 0.55, 0.3); g.add(blush);
  });
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), toon(0x9c4a52));
  mouth.position.set(0, 1.44, 0.40); mouth.scale.set(1.2, 0.8, 0.35); g.add(mouth);

  [-1, 1].forEach((sg) => {
    const seg = [
      [0.52 * sg, 1.72, -0.10, 0.20], [0.66 * sg, 1.46, -0.14, 0.24],
      [0.74 * sg, 1.16, -0.16, 0.26], [0.78 * sg, 0.86, -0.12, 0.24],
      [0.76 * sg, 0.60, -0.04, 0.21], [0.70 * sg, 0.40, 0.06, 0.17],
    ];
    seg.forEach(([x, y, z, r]) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), toon(HAIR));
      b.position.set(x, y, z); b.castShadow = true; g.add(b);
    });
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.12), toon(DRESS));
    ribbon.position.set(0.48 * sg, 1.88, 0.02); ribbon.rotation.z = sg * 0.4; g.add(ribbon);
  });

  const dressSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.68, 0.62, 18), toon(DRESS));
  dressSkirt.position.set(0, 0.86, 0); dressSkirt.castShadow = true; dressSkirt.receiveShadow = true; g.add(dressSkirt);
  const lining = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.72, 0.12, 18), toon(RED));
  lining.position.set(0, 0.58, 0); g.add(lining);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.30, 0.38, 14), toon(DRESS_L));
  torso.position.set(0, 1.24, 0); torso.castShadow = true; g.add(torso);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.06, 16), toon(GOLD));
  belt.position.set(0, 1.06, 0); g.add(belt);
  const trim = new THREE.Mesh(new THREE.CylinderGeometry(0.685, 0.685, 0.05, 18), toon(GOLD));
  trim.position.set(0, 0.70, 0); g.add(trim);

  [-1, 1].forEach((sg) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.28, 6, 10), toon(SKIN));
    arm.position.set(0.30 * sg, 1.20, 0.02); arm.rotation.z = sg * 0.42; arm.castShadow = true; g.add(arm);
    const cuff = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), toon(DRESS));
    cuff.position.set(0.34 * sg, 1.34, 0.02); g.add(cuff);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 8), toon(0x1f1b24));
    hand.position.set(0.40 * sg, 1.02, 0.04); g.add(hand);
  });

  [-1, 1].forEach((sg) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.34, 5, 8), toon(0x2b2630));
    leg.position.set(0.15 * sg, 0.30, 0); g.add(leg);
    const boot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), toon(0x1f1b24));
    boot.position.set(0.15 * sg, 0.10, 0.04); boot.scale.set(1, 0.8, 1.25); g.add(boot);
  });

  const bowL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), toon(DRESS));
  bowL.position.set(-0.16, 2.02, -0.02); bowL.scale.set(1.2, 0.8, 0.6); g.add(bowL);
  const bowR = bowL.clone(); bowR.position.x = 0.16; g.add(bowR);
  const bowC = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), toon(GOLD));
  bowC.position.set(0, 2.02, -0.02); g.add(bowC);

  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.9, 0.07), toon(GOLD));
  crossV.position.set(0, 1.55, -0.42); g.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.07, 0.07), toon(GOLD));
  crossH.position.set(0, 1.72, -0.42); g.add(crossH);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, 0.015, 0); g.add(shadow);

  return g;
}

/* 真实模型：tools/models/grok.glb 存在就替换掉程序化小人 */
function buildChibis() {
  const fallback = buildChibi(6.2, 4.0, Math.PI * 0.92, 1.0);

  try {
    const ENABLE_3D_CHAR = false;   // 关闭 3D 人物模型，用回头像
    if (!ENABLE_3D_CHAR) return;
    const loader = new GLTFLoader();
    loader.load(
      "./models/grok.glb",
      (gltf) => {
        const inner = gltf.scene;
        // 注意：这个 glb 的节点里已经带了 +90° X 旋转（Blender 导出时做的 Z-up→Y-up），
        // 所以这里绝对不能再转，否则会躺倒。

        const wrap = new THREE.Group();
        wrap.add(inner);

        // 按高度缩放到 2 米
        const box1 = new THREE.Box3().setFromObject(wrap);
        const h1 = box1.getSize(new THREE.Vector3()).y;
        if (h1 > 0.0001) wrap.scale.setScalar(3.0 / h1);   // Grok 高度 3 米（房间 3.4 米，占 88%）

        // 朝向（绕世界竖轴）
        wrap.rotation.y = Math.PI * 0.92;

        // 旋转后再测，落到底面、对准房间位置
        const box2 = new THREE.Box3().setFromObject(wrap);
        const c2 = box2.getCenter(new THREE.Vector3());
        wrap.position.set(7.2 - c2.x, -box2.min.y, 4.6 - c2.z);   // 挪到房间中心偏门侧

        wrap.traverse((nd) => {
          if (nd.isMesh) {
            nd.castShadow = true;
            nd.receiveShadow = true;
            // 单图重建的模型背面常有空洞，双面渲染兜底
            const mats = Array.isArray(nd.material) ? nd.material : [nd.material];
            mats.forEach((m) => {
              if (!m) return;
              m.side = THREE.DoubleSide;
              // 提升贴图采样质量
              ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap"].forEach((k) => {
                const t = m[k];
                if (t) {
                  t.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 4;
                  t.minFilter = THREE.LinearMipmapLinearFilter;
                  t.magFilter = THREE.LinearFilter;
                  t.generateMipmaps = true;
                  t.needsUpdate = true;
                }
              });
            });
          }
        });

        scene.add(wrap);
        window.__GROK_HERO = wrap;
        if (fallback) fallback.visible = false;
        window.__GROK3D_OK = true;
        console.log('[grok.glb] 加载完成，高度 ', h1.toFixed(3), 'm');
      },
      undefined,
      (err) => { window.__GROK3D_ERR = String(err && err.message || err);
        console.error("[grok.glb] 加载失败:", err); }
    );
  } catch (e) { /* 忽略 */ }
}


function buildBackWalls() {
  const WH = 6.2;            // 墙高
  const WT = 0.4;            // 墙厚
  const WALL = 0xf0eade;     // 墙面色
  const WALL_D = 0xe6dfd1;   // 暗面
  const SKIRT = 0xcfc6b4;    // 踢脚线
  const TOP = 0xd6cdba;      // 压顶

  // 西墙：位于 x = -30.4，沿 z 展开
  const wx = -30.4, z0 = -23.4, z1 = 23.4, zLen = z1 - z0;
  const west = new THREE.Mesh(new THREE.BoxGeometry(WT, WH, zLen), toon(WALL));
  west.position.set(wx, WH / 2, (z0 + z1) / 2);
  west.castShadow = true; west.receiveShadow = true;
  add(west);
  // 踢脚线
  const westSkirt = new THREE.Mesh(new THREE.BoxGeometry(WT + 0.06, 0.42, zLen), toon(SKIRT));
  westSkirt.position.set(wx, 0.21, (z0 + z1) / 2);
  add(westSkirt);
  // 压顶
  const westTop = new THREE.Mesh(new THREE.BoxGeometry(WT + 0.1, 0.16, zLen), toon(TOP));
  westTop.position.set(wx, WH, (z0 + z1) / 2);
  add(westTop);

  // 北墙：位于 z = -23.4，沿 x 展开
  const wz = -23.4, x0 = -30.4, x1 = 30.4, xLen = x1 - x0;
  const north = new THREE.Mesh(new THREE.BoxGeometry(xLen, WH, WT), toon(WALL_D));
  north.position.set((x0 + x1) / 2, WH / 2, wz);
  north.castShadow = true; north.receiveShadow = true;
  add(north);
  const northSkirt = new THREE.Mesh(new THREE.BoxGeometry(xLen, 0.42, WT + 0.06), toon(SKIRT));
  northSkirt.position.set((x0 + x1) / 2, 0.21, wz);
  add(northSkirt);
  const northTop = new THREE.Mesh(new THREE.BoxGeometry(xLen, 0.16, WT + 0.1), toon(TOP));
  northTop.position.set((x0 + x1) / 2, WH, wz);
  add(northTop);

  // 两面墙交汇处的立柱，收口更干净
  const corner = new THREE.Mesh(new THREE.BoxGeometry(WT + 0.12, WH, WT + 0.12), toon(0xe9e2d4));
  corner.position.set(wx, WH / 2, wz);
  corner.castShadow = true;
  add(corner);
}

function buildCorridor() {
  const LEN = 40, HALF = 2.2;
  // 连续浅色通道（不做深浅交替）
  const strip = new THREE.Mesh(new THREE.BoxGeometry(LEN, 0.05, HALF * 2), toon(0xf4efe5));
  strip.position.set(0, PLAT + 0.025, 0);
  strip.receiveShadow = true;
  add(strip);
  [-1, 1].forEach((sg) => {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(LEN, 0.12, 0.16), toon(C.curb));
    curb.position.set(0, PLAT + 0.05, sg * HALF);
    add(curb);
  });
}

function buildLamps() {
  [-16, -8, 0, 8, 16].forEach((x) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 8), toon(0xa9b4c0));
    pole.position.set(x, PLAT + 1.3, 2.75);
    pole.castShadow = true;
    add(pole);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), toon(0xfff2c8));
    head.position.set(x, PLAT + 2.7, 2.75);
    add(head);
  });
}

/* 只更新相机与画布位移：缩放/平移走这里，不重建画布 */
function applyView() {
  if (!renderer || !camera) return;
  const cv = renderer.domElement;
  const w = (container && container.clientWidth) || 1;
  const h = (container && container.clientHeight) || 1;
  if (!w || !h) return;
  // 渲染倍率固定：之前随 zoom 变化，每滚一格就重建一次画布 → 画面一闪一闪。
  // 固定 2 倍后，缩放只改相机视野，画布尺寸不动，完全不闪。
  if (Math.abs(RENDER_SCALE - 2.0) > 0.01) {
    RENDER_SCALE = 2.0;
    resize();
    return;
  }
  cv.style.transform = `translate(${panX}px, ${panY}px)`;
  const aspect = w / h;
  const hh = 30 * zoom;   // 视野基准从 16.875 提到 30，才装得下整个办公室
  const hw = hh * aspect;
  camera.left = -hw; camera.right = hw;
  camera.top = hh; camera.bottom = -hh;
  camera.position.copy(camPos);
  camera.lookAt(camLook);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

/* 容器尺寸变化时才重建画布 */
let resizeScheduled = false;
function resize() {
  if (resizeScheduled) return;
  resizeScheduled = true;
  requestAnimationFrame(() => {
    resizeScheduled = false;
    if (!renderer || !container) return;
    const cw = container.clientWidth, ch = container.clientHeight;
    if (!cw || !ch) return;
    const w = Math.round(cw * RENDER_SCALE), h = Math.round(ch * RENDER_SCALE);
    const cv = renderer.domElement;
    // 尺寸没变就不重设
    if (cv.width !== w || cv.height !== h) {
      renderer.setSize(w, h, false);
    }
    // CSS 尺寸每次都要设（画布物理尺寸可能没变，但 CSS 可能是旧值）
    cv.style.width = cw + "px";
    cv.style.height = ch + "px";
    cv.style.position = "absolute";
    cv.style.left = "0";
    cv.style.top = "0";
    cv.style.maxWidth = "none";
    applyView();
  });
}

function project(x, y, z) {
  if (!camera || !renderer) return { x: 0, y: 0 };
  const v = new THREE.Vector3(x, y, z).project(camera);
  const cv = renderer.domElement;
  const cw = container.clientWidth, ch = container.clientHeight;
  return {
    x: (v.x * 0.5 + 0.5) * cw + panX,
    y: (-v.y * 0.5 + 0.5) * ch + panY,
  };
}

/* 组员间里的座位锚点：每个部门两个位置 */
/* 组员站位：网格排布，支持任意人数（房间内最多 4 列 × 3 行 = 12 个） */
const STAFF_MAX_SHOWN = 12;
function staffAnchor(deptId, index, total) {
  const st = STATIONS.find((v) => v.id === deptId);
  if (!st) return { x: 0, y: 0 };
  const staffZ = st.z + st.side * (RD / 2 + 4.4 + RD / 2);
  const n = Math.max(1, Math.min(total || 1, STAFF_MAX_SHOWN));
  const perRow = n <= 3 ? n : (n <= 8 ? 4 : 3);
  const rows = Math.max(1, Math.ceil(n / perRow));
  const row = Math.floor(index / perRow);
  const col = index % perRow;
  const sx = 3.2, sz = 2.6;   // 间距加大，避免组员在屏幕上挤成一团
  const ox = (col - (perRow - 1) / 2) * sx;
  const oz = (row - (rows - 1) / 2) * sz;
  return project(st.x + ox, 1.5, staffZ + oz);
}

function anchorOf(id) {
  const s = STATIONS.find((v) => v.id === id) || STATIONS[0];
  return project(s.x, 1.7, s.z);
}

/* 进入角色特写：透视相机贴近拍，加补光，像 3A 的角色展示 */
function focusHero(obj) {
  if (!obj) return;
  heroTarget = obj;
  heroMode = true;
  if (!perspCam) {
    perspCam = new THREE.PerspectiveCamera(32, 16 / 9, 0.05, 200);
  }
  // 用模型实际包围盒算机位
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const h = Math.max(size.y, 0.5);
  const dist = h * 2.35;
  const eye = center.clone().add(new THREE.Vector3(dist * 0.42, h * 0.16, dist * 0.90));
  perspCam.position.copy(eye);
  perspCam.lookAt(center.x, center.y + h * 0.06, center.z);
  perspCam.updateMatrixWorld();

  // 补光：主光 + 轮廓光，只加一次
  if (!heroLights.length) {
    const key = new THREE.DirectionalLight(0xfff2dd, 3.2);
    key.position.copy(eye).add(new THREE.Vector3(1.2, 2.0, 1.6));
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 40;
    key.shadow.camera.left = -4; key.shadow.camera.right = 4;
    key.shadow.camera.top = 6; key.shadow.camera.bottom = -2;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xbcd6ff, 1.9);
    rim.position.copy(eye).add(new THREE.Vector3(-2.0, 1.4, -1.8));
    scene.add(rim);
    const fill = new THREE.PointLight(0xffffff, 0.8, 12);
    fill.position.copy(center).add(new THREE.Vector3(0, h * 0.5, h * 1.1));
    scene.add(fill);
    heroLights = [key, rim, fill];
  }
}

/* 第一人称：站在角色眼睛的位置往外看 */
function firstPersonEye(obj) {
  if (!obj || !perspCam) return;
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const eyeY = box.min.y + size.y * 0.88;     // 接近头部
  perspCam.position.set(center.x, eyeY, center.z);
  perspCam.fov = 78;                          // 广角，接近人眼
  // 朝房间门口方向看（Grok 房间门在 +z 侧）
  perspCam.lookAt(center.x, eyeY - size.y * 0.10, center.z + 6);
  perspCam.updateProjectionMatrix();
  perspCam.updateMatrixWorld();
  fpMode = true;
}

/* 退出特写 */
function unfocusHero() {
  heroMode = false;
  fpMode = false;
  heroTarget = null;
  heroLights.forEach((l) => { l.visible = false; });
  heroLights = [];
}

function renderLoop(t) {
  raf = requestAnimationFrame(renderLoop);
  if (renderer && scene && camera) {
      animateTanks(t || 0);
      if (heroMode && perspCam) {
        // 特写时按容器比例更新透视相机
        const cv = renderer.domElement;
        const cw = parseFloat(cv.style.width) || 1;
        const chh = parseFloat(cv.style.height) || 1;
        perspCam.aspect = cw / chh;
        perspCam.updateProjectionMatrix();
        renderer.render(scene, perspCam);
      } else {
        renderer.render(scene, camera);
        if (typeof window !== "undefined" && window.__syncAnchors) window.__syncAnchors();
      if (ringMesh && ringMesh.visible) {
        const tt = (t || 0) * 0.003;
        const k = 1 + Math.sin(tt) * 0.06;
        ringMesh.scale.set(k, k, 1);
        ringMesh.material.opacity = 0.55 + Math.sin(tt) * 0.3;
      }
      }
  }
}

export async function init(el) {
  // 切皮肤 / 重渲染会把 <div class="scene3d"> 整个换掉，
  // canvas 会随旧节点一起被移除 —— 这里把它接到新容器上
  if (ready && renderer) {
    container = el;
    if (renderer.domElement.parentNode !== el) {
      el.appendChild(renderer.domElement);
    }
    resize();
    return api;
  }
  container = el;
  if (ready) { resize(); return api; }

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);   // 画布尺寸已经乘过 RENDER_SCALE，这里再乘就是双重放大（4 倍像素）
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // 容器尺寸一变就重算画布（进场时布局还没稳定，靠这个自动纠正）
  try {
    if (window.ResizeObserver && !container.__ro) {
      container.__ro = new ResizeObserver(function () {
        try { resize(); } catch (e) {}
      });
      container.__ro.observe(container);
    }
  } catch (e) {}

  const cw = container.clientWidth || 1200, ch = container.clientHeight || 700;
  renderer.setSize(cw * RENDER_SCALE, ch * RENDER_SCALE, false);
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(C.floor);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc9bd, 1.5));
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.0);
  sun.position.set(9, 16, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 140;
  sun.shadow.camera.left = -34; sun.shadow.camera.right = 34;
  sun.shadow.camera.top = 34; sun.shadow.camera.bottom = -34;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 2.5;
  scene.add(sun);

  // 补光：来自相反方向的冷色天光，避免暗面死黑
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.55);
  fill.position.set(-14, 10, -12);
  scene.add(fill);

  // 环境光：整体提亮暗部
  scene.add(new THREE.AmbientLight(0xffffff, 0.30));

  camera = new THREE.OrthographicCamera(-30, 30, 16.875, -16.875, 0.1, 500);

  buildMainPlatform();
  buildCorridor();
  buildLamps();
  buildDecor();
  buildFacilities();
  buildTanks();
  buildBackWalls();
  // 人物一律用 HTML 头像，场景里不放 3D 小人
  STATIONS.forEach((st) => { buildRoom(st, PLAT, true); buildStaffWing(st, PLAT); });

  ready = true;
  resize();
  window.addEventListener("resize", resize);
  renderLoop();
  return api;
}

const api = {
  get ready() { return ready; },
  init,
  resize,
  anchorOf,
  staffAnchor,
  get staffMaxShown() { return STAFF_MAX_SHOWN; },
  project,
  get stations() { return STATIONS; },
  focusHero,
  unfocusHero,
  get heroMode() { return heroMode; },
  get fpMode() { return fpMode; },
  firstPersonEye,
  get heroObj() { return heroTarget; },
  get heroCam() { return perspCam; },
  /* 相机飞向某个部门的房间：保持同一套 3D 场景，只是镜头推近 */
  /* 选中某个部门：地垫点亮 + 其余压暗，相机不动 */
  /* 选中房间的金色光圈 */
  highlightRoom(deptId) {
    const st = STATIONS.find((v) => v.id === deptId);
    if (!ringMesh && scene) {
      const geo = new THREE.RingGeometry(3.1, 3.9, 48);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffd36e, transparent: true, opacity: 0.9,
        side: THREE.DoubleSide, depthWrite: false,
      });
      ringMesh = new THREE.Mesh(geo, mat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.renderOrder = 5;
      scene.add(ringMesh);
    }
    if (ringMesh) {
      if (st) {
        ringMesh.position.set(st.x, 0.06, st.z);
        ringMesh.visible = true;
      } else {
        ringMesh.visible = false;
      }
    }
    // 光圈呼吸动画由 renderLoop 里的时间驱动
    ringBase = st ? { x: st.x, z: st.z } : null;
  },

  _highlightRoomOld(deptId) {
    Object.keys(roomMats).forEach((id) => {
      const rm = roomMats[id];
      if (!rm || !rm.mat) return;
      const on = id === deptId;
      rm.mat.color.copy(rm.base);
      if (on) {
        rm.mat.color.lerp(new THREE.Color(0xffd36e), 0.62);
        if (rm.mat.emissive) rm.mat.emissive.setHex(0x6b4f10);
      } else {
        rm.mat.color.lerp(new THREE.Color(0x8a8a8a), deptId ? 0.42 : 0.0);
        if (rm.mat.emissive) rm.mat.emissive.setHex(0x000000);
      }
      rm.mat.needsUpdate = true;
    });
  },

  /* 点主管：轻微放大（到地板刚好完整装下的极限），相机不移动，一个房间都不会消失 */
  focusRoom(deptId) {
    const st = STATIONS.find((v) => v.id === deptId);
    if (!st) return false;
    focusedRoom = deptId;
    try { api.highlightRoom(deptId); } catch (e) { console.warn(e); }
    try {
      camPos.copy(CAM_BASE);
      camLook.set(0, 1, 0);
      zoom = 0.62;          // 0.8 → 0.62，放大 29%，但地板仍在画面内
      RENDER_SCALE = 2.2;
      resize();
      applyView();
    } catch (e) { console.warn("camera", e); }
    return true;
  },
  /* 清除选中，回到全景 */
  clearRoom() {
    focusedRoom = null;
    try { api.highlightRoom(null); } catch (e) {}
    try {
      camPos.copy(CAM_BASE);
      camLook.set(0, 1, 0);
      zoom = 0.8;
      RENDER_SCALE = 2.0;
      resize();
      applyView();
    } catch (e) {}
  },
  get focusedRoom() { return focusedRoom; },
  setZoom(z) { zoom = Math.max(0.25, Math.min(2.6, z)); applyView(); },
  getZoom() { return zoom; },
  setPan(x, y) { panX = x; panY = y; applyView(); },
  getPan() { return { x: panX, y: panY }; },
  reset() { zoom = 0.8; panX = 0; panY = 0; applyView(); },
  canvas() { return renderer ? renderer.domElement : null; },
};

export default api;
