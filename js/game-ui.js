function fitLater(floor) {



  fitScene(floor);



  if (typeof requestAnimationFrame === "function") {



    requestAnimationFrame(() => { fitScene(floor); requestAnimationFrame(() => fitScene(floor)); });



  }



  setTimeout(() => fitScene(floor), 80);



  setTimeout(() => fitScene(floor), 300);



  if (typeof window !== "undefined" && window.addEventListener && !window.__officeResizeBound) {



    window.__officeResizeBound = true;



    window.addEventListener("resize", () => {



      const f = document.getElementById("floor");



      if (f && document.body.classList.contains("scene")) fitScene(f);



    });



  }



}







/* 单个部门的房间视图（独立渲染图 + 座位上的角色） */



/* 右下角缩放按钮（大厅/房间通用） */



function zoomBarHtml() {



  return `<div class="zoomBar">



    <button onclick="event.stopPropagation();zoomBy(1.25)" title="放大">＋</button>



    <button onclick="event.stopPropagation();zoomBy(0.8)" title="缩小">－</button>



    <button onclick="event.stopPropagation();resetSceneView()" title="复位">⟲</button>



  </div>`;



}







function renderRoomView(floor) {



  const ai = G.staff.find(s => s.id === roomFocus);



  if (!ai) { roomFocus = null; renderOfficeScene(floor); return; }



  const team = (G.workers || []).filter(w => w.aiId === ai.id);



  const pct = (v, total) => (v / total * 100).toFixed(2) + "%";







  const boss = ROOM_ANCHOR.boss;



  const bossHtml = `<div class="sceneChar sel" style="left:${pct(boss.x, ROOM_W)};top:${pct(boss.y - 70, ROOM_H)}"



       onclick="selectStaff('${ai.id}')">



      <div class="scTag">${ai.name}</div>
      <div class="scWage">¥${ai.wage}/天</div>



      <img class="scHead" src="${ai.portrait}" alt="${ai.name}">



    </div>`;







  const seats = ROOM_ANCHOR.seats;



  const teamHtml = team.slice(0, seats.length).map((w, i) => {



    const sp = seats[i];



    const st = Math.round(w.stamina);



    const jo = w.busy ? G.orders.find(o => o.id === w.busy) : null;



    const col = w.mustRest ? "#ef7a7a" : (st < 35 ? "#f0c04a" : "#6fc48b");



    const state = w.mustRest ? "强制休息"
      : (jo ? "在做「" + jo.title + "」"
      : (w._pending ? "待派单" : "空闲"));



    return `<div class="roomSeat" style="left:${pct(sp.x, ROOM_W)};top:${pct(sp.y + 78, ROOM_H)}"



        onclick="event.stopPropagation();selectWorkerInRoom('${w.id}')">



      <div class="rsTag">${w.name}<i style="background:${col}"></i></div>



      <div class="rsBar"><i style="width:${st}%"></i></div>



      <div class="rsState">${state}</div>



    </div>`;



  }).join("");







  floor.innerHTML = `



    <div class="sceneWrap">



      <div class="roomStage">



        <img class="sceneBg" src="${ROOM_BG[ai.id] || ROOM_BG.claude}" alt="${ai.name} 工作室">



        ${bossHtml}



        ${teamHtml}



      </div>



      <div class="roomTopBar">



        <span class="rtName">${ai.name} 工作室</span>



        <span class="rtSub">${ai.role} · 手下 ${team.length} 人</span>



        <button class="roomBack" onclick="event.stopPropagation();closeRoom()">← 返回大厅</button>



      </div>



      ${zoomBarHtml()}



    </div>`;







  fitLater(floor);



}







/* 进入房间后的浮层：显示这个部门的人和操作 */



function roomOverlay() {



  const id = roomFocus;



  if (!id) return "";



  const ai = G.staff.find(s => s.id === id);



  if (!ai) return "";



  const team = (G.workers || []).filter(w => w.aiId === id);



  const cards = team.map(w => {



    const st = Math.round(w.stamina);



    const jo = w.busy ? G.orders.find(o => o.id === w.busy) : null;



    const col = w.mustRest ? "#ef7a7a" : (st < 35 ? "#f0c04a" : "#6fc48b");



    const state = w.mustRest ? "强制休息" : (jo ? "在做「" + jo.title + "」" : "空闲");



    const sk = Object.keys(w.skills).map(k => `${CFG.types[k].name}${w.skills[k]}`).join(" ");



    return `<div class="roomWorker" onclick="event.stopPropagation();selectWorkerInRoom('${w.id}')" title="${sk}">



      <div class="rwTop"><b>${w.name}</b><i style="background:${col}"></i></div>



      <div class="rwBar"><i style="width:${st}%"></i></div>



      <div class="rwState">${state}</div>



    </div>`;



  }).join("");







  return `<div class="roomOverlay" onclick="event.stopPropagation()">



    <div class="roomCard">



      <div class="roomHead">



        <span class="roomTitle">${ai.name} 工作室</span>



        <span class="roomSub">${ai.role} · 手下 ${team.length} 人</span>



        <button class="roomBack" onclick="event.stopPropagation();closeRoom()">← 返回大厅</button>



      </div>



      <div class="roomBody">



        <div class="roomAi" onclick="selectStaff('${ai.id}')">



          <img src="${ai.portrait}" alt="${ai.name}">



          <div class="raInfo">



            <b>${ai.name}</b>



            <span>心情 ${Math.round(ai.mood)} · 疲劳 ${Math.round(ai.fatigue)} · 信任 ${Math.round(ai.trust)}</span>



          </div>



        </div>



        <div class="roomTeam">${cards || '<div class="rwEmpty">这个部门还没有员工，去管理中心招人</div>'}</div>



      </div>



      <div class="roomFoot">



        ${selOrder ? `<button class="pickbtn" style="margin:0" onclick="assign(${selOrder}, '${ai.id}')">👥 让 ${ai.name} 挑人做当前订单</button>` : `<span style="font-size:11.5px;color:#8ea3c9">先在左边选一张订单，再回来派活</span>`}



      </div>



    </div>



  </div>`;



}







/* 房间里点员工 → 右侧显示他的详情 */



function selectWorkerInRoom(wid) {



  const _ww = (G.workers || []).find((x) => x.id === wid);
  if (_ww) {
    if (_ww.busy) { toast(`${_ww.name} 在做别的单`, "warn"); return; }
    if (_ww.mustRest) { toast(`${_ww.name} 需要休息`, "warn"); return; }
    if (_ww._pending) { toast(`${_ww.name} 已在 3D 待派名单里`, "warn"); return; }
  }
  selWorker = wid;



  const w = G.workers.find(x => x.id === wid);



  if (w) selStaff = w.aiId;



  renderAll();



}







/* 让场景按 1600×1000 等比铺满容器 */



/* ---------- 3D 场景桥接 ---------- */

let scene3dBusy = false;

/* 页面切回前台时检查 3D 是否还活着，丢了就重建（防止休眠/切标签后卡死） */
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState !== "visible") return;
  try {
    if (!document.body.classList.contains("scene")) return;
    const cv = document.querySelector(".scene3d canvas");
    if (!cv) return;
    const gl = cv.getContext && (cv.getContext("webgl2") || cv.getContext("webgl"));
    if (gl && gl.isContextLost && gl.isContextLost()) {
      console.warn("[3D] 上下文丢失，重建场景");
      scene3dBusy = false;
      const box = document.querySelector(".scene3d");
      if (box) box.innerHTML = "";
      if (window.OFFICE3D && window.OFFICE3D.ready === false) { /* 已标记 */ }
      try { if (window.OFFICE3D && window.OFFICE3D.reset) window.OFFICE3D.reset(); } catch (e) {}
      mountScene3D();
    }
  } catch (e) {}
});

function mountScene3D() {
  if (typeof document === "undefined" || !document.querySelector) return;
  const el = document.querySelector(".scene3d");
  if (!el || !window.OFFICE3D || scene3dBusy) return;

  // 容器刚插进 DOM 时尺寸还没稳定，先量一下，为 0 就等下一帧再来
  if (!el.clientWidth || !el.clientHeight) {
    setTimeout(mountScene3D, 40);
    return;
  }

  scene3dBusy = true;
  try {
    Promise.resolve(window.OFFICE3D.init(el)).then(() => {
      scene3dBusy = false;
      syncAnchors3D();
      // 切换皮肤后布局要过几帧才定下来，多补几次尺寸，避免画面先放大再缩回去
      [0, 50, 140, 300, 520, 900, 1500].forEach((ms) => {
        setTimeout(() => {
          try {
            if (window.OFFICE3D && window.OFFICE3D.resize) window.OFFICE3D.resize();
            syncAnchors3D();
          } catch (e) {}
        }, ms);
      });
    }).catch(() => { scene3dBusy = false; });
  } catch (e) { scene3dBusy = false; }
}



if (typeof window !== "undefined") window.__syncAnchors = () => syncAnchors3D();
let _anchorLast = 0;

function syncAnchors3D() {
  if (typeof document === "undefined" || !document.querySelector) return;
  if (!window.OFFICE3D || !window.OFFICE3D.ready) return;

  const wrap = document.querySelector(".scene3d");
  if (!wrap) return;
  const w = wrap.clientWidth, h = wrap.clientHeight;
  if (!w || !h) return;

  // 每次都实时查询：缓存过 DOM 重建后会指向已删除的旧节点，
  // 新节点拿不到 left/top，全部堆在左上角（员工叠一起就是这个原因）
  document.querySelectorAll(".sceneChar").forEach(function (node) {
    const id = node.getAttribute("data-ai");
    if (!id) return;
    const p2 = window.OFFICE3D.anchorOf(id);
    if (!p2) return;
    node.style.left = (p2.x / w * 100).toFixed(3) + "%";
    node.style.top = (p2.y / h * 100).toFixed(3) + "%";
  });

  document.querySelectorAll(".sceneWorker").forEach(function (node) {
    const id = node.getAttribute("data-ai");
    const k = parseInt(node.getAttribute("data-k") || "0", 10);
    if (!id || !window.OFFICE3D.staffAnchor) return;
    const total = parseInt(node.getAttribute("data-total") || "0", 10) || 0;
    const p2 = window.OFFICE3D.staffAnchor(id, k, total);
    if (!p2) return;
    node.style.left = (p2.x / w * 100).toFixed(3) + "%";
    node.style.top = (p2.y / h * 100).toFixed(3) + "%";
  });
}



if (typeof window !== "undefined") {

  window.addEventListener("office3d-loaded", () => { mountScene3D(); });

  window.addEventListener("resize", () => { setTimeout(syncAnchors3D, 60); });

  setInterval(() => { if (!scene3dBusy) mountScene3D(); }, 1200);

}



function fitScene(floor) {



  const wrap = floor.querySelector(".sceneWrap");



  const stage = floor.querySelector(".sceneStage");



  if (!wrap || !stage) return;



  wrap._bw = wrap.clientWidth || 0; wrap._bh = wrap.clientHeight || 0;



  const bw = wrap._bw, bh = wrap._bh;



  if (!bw || !bh) return;



  const z = sceneZoom || 1, px = scenePanX || 0, py = scenePanY || 0;



  // 房间视图：按 1200×820 完整显示



  if (roomFocus) {



    const sc = Math.min(bw / ROOM_W, bh / ROOM_H) * 1.1 * z;



    stage.style.width = (ROOM_W * sc) + "px";



    stage.style.height = (ROOM_H * sc) + "px";



    stage.style.left = ((bw - ROOM_W * sc) / 2 + px) + "px";



    stage.style.top = ((bh - ROOM_H * sc) / 2 + py) + "px";



    stage.style.transform = "none";



    return;



  }



  // 桌面：铺满（cover）；手机：完整显示（contain）



  const wide = (typeof window !== "undefined" ? window.innerWidth : 1600) >= 900;



  const base = wide ? Math.max(bw / OFFICE_W, bh / OFFICE_H) : Math.min(bw / OFFICE_W, bh / OFFICE_H);



  const scale = base * z;



  const dw = OFFICE_W * scale, dh = OFFICE_H * scale;



  stage.style.width = dw + "px";



  stage.style.height = dh + "px";



  stage.style.left = ((bw - dw) / 2 + px) + "px";



  stage.style.top = ((bh - dh) / 2 + py) + "px";



  if (!stage.classList.contains("zoomed")) stage.style.transform = "none";



}







/* 进入某个部门的小房间（镜头拉近 + 展示组内员工） */



let roomFocus = null;







/* 场景缩放与平移（玩家可调） */



let sceneZoom = 1, scenePanX = 0, scenePanY = 0;



const ZOOM_MIN = 0.85, ZOOM_MAX = 2.2;   // 和 office3d 的默认值保持一致







function setSceneZoom(z, keepPan) {



  sceneZoom = Math.max(0.05, Math.min(12, z));   // 放开范围，不做闪烁提示

  if (!keepPan) { scenePanX = 0; scenePanY = 0; }



  try { localStorage.removeItem("aicompany_zoom"); } catch (e) {}   // 视角不持久化，每次进来都是安全的默认值



  // 3D 模式下不去碰 2D 的 stage 布局（会触发重排，缩放时看着像闪）
  if (!document.body.classList.contains("scene")) {
    const f = $("floor");
    if (f) fitScene(f);
  }



}



function resetSceneView() {



  sceneZoom = 1; scenePanX = 0; scenePanY = 0;



  try { localStorage.setItem("aicompany_zoom", "1"); } catch (e) {}



  const f = $("floor");



  if (f) fitScene(f);



}



function zoomBy(k) { setSceneZoom(sceneZoom * k, true); }







function showRoomBar(id) {
  let bar = document.querySelector(".roomBar3d");
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "roomBar3d";
    document.body.appendChild(bar);
  }
  const ai = G.staff.find((x) => x.id === id) || { name: id };
  const team = (G.workers || []).filter((w) => w.aiId === id);
  bar.innerHTML = `<span class="rb-name">${ai.name}</span>
    <span class="rb-sub">${team.length} 名组员</span>
    <button onclick="event.stopPropagation();closeRoom()">← 返回全景</button>`;
  bar.onclick = (e) => e.stopPropagation();
}

function closeRoom() {
  if (window.OFFICE3D && window.OFFICE3D.clearRoom) window.OFFICE3D.clearRoom();
  document.body.classList.remove("room-zoom");
  const bar = document.querySelector(".roomBar3d");
  if (bar) bar.remove();
  roomFocus = null;
  setTimeout(syncAnchors3D, 40);
  renderAll();
}

/* ---------- 派单预览：先看要派谁，再确认 ---------- */
let pendingAssign = null;

function showAssignPreview(orderId, staffId) {
  const o = G.orders.find((x) => x.id === orderId);
  const ai = G.staff.find((x) => x.id === staffId);
  if (!o || !ai) return false;

  const free = G.workers.filter((w) => w.aiId === staffId && !w.busy && !w.mustRest);
  if (!free.length) {
    toast(`${ai.name} 手下的人全在忙，先等结算`, "warn");
    return false;
  }
  const need = Math.max(2, Math.round(o.stars * 1.7), o.minCrew || 1) - o.crew.length;
  if (need <= 0) {
    toast(`「${o.title}」已经够人了`, "warn");
    return false;
  }
  const picked = free
    .slice()
    .sort((a, b) => (b.skills[o.type] * 100 + b.stamina) - (a.skills[o.type] * 100 + a.stamina))
    .slice(0, Math.min(need, free.length));

  const cost = crewCompute(picked);
  pendingAssign = { orderId, staffId, picked: picked.map((w) => w.id), cost };
  renderAssignBar(o, ai, picked, cost);
  // 让被选中的人在场景里高亮
  document.querySelectorAll(".sceneWorker.picked").forEach((el) => el.classList.remove("picked"));
  pendingAssign.picked.forEach((wid) => {
    const el = document.querySelector('.sceneWorker[data-worker="' + wid + '"]');
    if (el) el.classList.add("picked");
  });
  return true;
}

function renderAssignBar(o, ai, picked, cost) {
  let bar = document.querySelector(".assignBar");
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "assignBar";
    document.body.appendChild(bar);
  }
  const names = picked.map((w) => w.name).join("、");
  bar.innerHTML = `<div class="ab-main">
      <div class="ab-title">${o.title}</div>
      <div class="ab-sub">派给 ${ai.name} · 选中 ${picked.length} 人：${names} · 消耗 ${cost} 算力</div>
    </div>
    <button class="ab-ok" onclick="event.stopPropagation();confirmAssign()">确认派单</button>
    <button class="ab-no" onclick="event.stopPropagation();cancelAssign()">取消</button>`;
  bar.onclick = (e) => e.stopPropagation();
}

function confirmAssign() {
  if (!pendingAssign) return;
  const { orderId, staffId } = pendingAssign;
  pendingAssign = null;
  const bar = document.querySelector(".assignBar");
  if (bar) bar.remove();
  document.querySelectorAll(".sceneWorker.picked").forEach((el) => el.classList.remove("picked"));
  assign(orderId, staffId);
}

function cancelAssign() {
  pendingAssign = null;
  const bar = document.querySelector(".assignBar");
  if (bar) bar.remove();
  document.querySelectorAll(".sceneWorker.picked").forEach((el) => el.classList.remove("picked"));
}

/* 点主管：直接弹一个详情窗，心情/疲劳/信任/技能都能看见 */
/* 点小图标看大图 */
/* 组员加薪：¥200，日薪 +10，体力回一点，5 天冷却 */
function raiseWorker(wid) {
  // 打开就先把面板切到这个人，避免提示还停留在上一个主管
  selWorker = wid;
  const w = G.workers.find((x) => x.id === wid);
  if (!w) return;
  if ((w.raiseCd || 0) > 0) { toast(`${w.name} 刚加过薪，还要等 ${w.raiseCd} 天`, "warn"); return; }
  if (G.cash < 200) { toast(`资金不足：加薪要 ¥200，当前 ¥${Math.round(G.cash)}`, "bad"); return; }
  const before = w.wage;
  // 涨幅按档次走：普通 +5 / 资深 +12 / 顶尖 +30（约 20%）
  const bump = w.tier === "elite" ? 30 : (w.tier === "senior" ? 12 : 5);
  w.wage = w.wage + bump;
  w.raiseCd = 5;
  w.stamina = Math.min(100, w.stamina + 15);
  const cost = w.tier === "elite" ? 800 : (w.tier === "senior" ? 400 : 200);
  G.cash -= cost;
  toast(`${w.name} 日薪 ¥${before} → ¥${w.wage}（+${bump}），体力 +15`, "");
  log(`💵 ${w.name} 加薪 ¥${before}→¥${w.wage}/天`);
  save(); renderAll();
}

/* 商店上新提示条 */
function showShopNotice(text) {
  let el = document.getElementById("shopNotice");
  if (el) el.remove();
  el = document.createElement("div");
  el.id = "shopNotice";
  el.innerHTML = `<span>🛒 商店上新：${text}</span><button>去看看 →</button>`;
  el.style.cssText = "position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:70;display:flex;align-items:center;gap:14px;padding:11px 18px;border-radius:12px;background:linear-gradient(180deg,rgba(40,70,120,.95),rgba(24,44,80,.95));color:#dbe9ff;font-size:13px;border:1px solid rgba(120,170,240,.45);box-shadow:0 10px 30px rgba(0,0,0,.35)";
  el.querySelector("button").style.cssText = "padding:5px 12px;border-radius:8px;border:1px solid rgba(140,180,240,.5);background:rgba(70,110,180,.6);color:#fff;cursor:pointer;font-size:12px";
  el.querySelector("button").onclick = () => { el.remove(); try { goHR(); } catch (e) {} };
  document.body.appendChild(el);
  setTimeout(() => { if (el.parentElement) el.style.opacity = "0.9"; }, 12000);
}

function showPetBig(src) {
  showModal("", `<div style="display:flex;flex-direction:column;align-items:center;gap:10px">
      <img src="${src}" style="width:260px;height:260px;object-fit:contain;border-radius:18px;background:rgba(255,255,255,.05)" />
      <div style="font-size:12px;color:#9fb3d4">小鲸鱼娘正在看着你的账本</div>
    </div>`, [{ label: "关闭", fn: null }]);
}

/* ---------- 结局图鉴 ---------- */
const ENDING_KEY = "aicompany_endings_v1";

function loadEndings() {
  try { return JSON.parse(localStorage.getItem(ENDING_KEY) || "{}"); } catch (e) { return {}; }
}
function saveEndings(obj) {
  try { localStorage.setItem(ENDING_KEY, JSON.stringify(obj)); } catch (e) {}
}
function recordEnding(diffId, rank) {
  const seen = loadEndings();
  const key = diffId + "_" + rank;
  if (!seen[key]) {
    seen[key] = Date.now();
    saveEndings(seen);
    return true;   // 首次解锁
  }
  seen[key] = seen[key];   // 已解锁，保留首次时间
  saveEndings(seen);
  return false;
}

function showEndingGallery() {
  const seen = loadEndings();
  const order = [
    ["easy", "轻松", "#59d98c"],
    ["normal", "标准", "#7de3ff"],
    ["hard", "硬核", "#ff9b9b"],
  ];
  const rankMeta = [
    ["S", "金色传说", "#ffd45e"],
    ["A", "相当厉害", "#8fe3ff"],
    ["B", "还不错", "#7de38f"],
    ["C", "勉强及格", "#c8d6ea"],
    ["D", "破产收场", "#ff7b7b"],
  ];
  let total = 0, got = 0;
  const blocks = order.map(([id, name, color]) => {
    const rt = CFG.rankTiers[id];
    const ends = CFG.rankEndings[id];
    const rows = rankMeta.map(([r, _, rc]) => {
      total++;
      const key = id + "_" + r;
      const unlocked = !!seen[key];
      if (unlocked) got++;
      const pair = ends[r] || ["?", ""];
      const need = r === "D" ? "低于保底线" : `¥${Math.round(rt[r] / 10000)} 万`;
      return `<div class="egrow${unlocked ? " on" : ""}">
          <span class="egrank" style="color:${unlocked ? rc : "#5b6675"}">${r}</span>
          <span class="egname">${unlocked ? pair[0] : "？？？"}</span>
          <span class="egcond">${need}</span>
          <span class="egmark">${unlocked ? "✓" : "🔒"}</span>
        </div>`;
    }).join("");
    return `<div class="egblock">
        <div class="eghead" style="color:${color}">${name}难度</div>
        ${rows}
      </div>`;
  }).join("");

  showModal(`结局图鉴 ${got}/${total}`, `<div class="egwrap">${blocks}</div>`, [{ label: "关闭", fn: null }]);
}

/* 在主管详情卡里点「派活」= 把这个组员派给当前订单 */
function pickWorkerForOrder(wid) {
  const w = G.workers.find((x) => x.id === wid);
  if (!w) return;
  if (!selOrder) { toast("先在左边点一张订单，再点派活", "warn"); return; }
  const o = G.orders.find((x) => x.id === selOrder);
  if (!o) { toast("订单已经不在了", "warn"); return; }
  if (w.busy) { toast(`${w.name} 正在做别的单，先撤回那单`, "warn"); return; }
  if (w.mustRest) { toast(`${w.name} 需要休息`, "warn"); return; }
  if (o.crew.indexOf(w.id) >= 0) { toast(`${w.name} 已经在这单上了`, "warn"); return; }
  assign(o.id, w.aiId, [w.id]);
}

function showLeaderCard(id) {
  const s = G.staff.find((x) => x.id === id);
  if (!s) return;
  const team = (G.workers || []).filter((w) => w.aiId === id);
  const busy = team.filter((w) => w.busy).length;
  const bar = (label, val, color) => `<div style="display:flex;align-items:center;gap:10px;margin:7px 0;font-size:13px">
      <span style="width:52px;color:#9fb3d4">${label}</span>
      <span style="flex:1;height:9px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden">
        <i style="display:block;height:100%;width:${Math.max(0, Math.min(100, val))}%;background:${color};border-radius:5px"></i>
      </span>
      <b style="width:34px;text-align:right;color:#fff">${Math.round(val)}</b>
    </div>`;
  const sk = Object.keys(CFG.types).map((k) => {
    const v = s.skills[k] || 0;
    return `<span style="display:inline-block;margin:3px 6px 3px 0;padding:3px 9px;border-radius:7px;font-size:12px;background:rgba(120,160,220,.18);color:#cfe0ff">${CFG.types[k].name} <b style="color:#fff">${v}</b></span>`;
  }).join("");
  const html = `
    <div style="min-width:300px">
      <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">
        <img src="${s.portrait}" style="width:64px;height:64px;border-radius:12px;object-fit:cover;background:#233">
        <div>
          <div style="font-size:19px;font-weight:700;color:#fff">${s.name}</div>
          <div style="font-size:12px;color:#9fb3d4">${s.role || ""} · 组员 ${team.length} 人（${busy} 在做活）</div>
          <div style="font-size:12px;color:#9fb3d4">日薪 ¥${s.wage} · 加薪冷却 ${s.raiseCd || 0} 天</div>
        </div>
      </div>
      ${bar("心情", s.mood, "#ff9bb8")}
      ${bar("疲劳", s.fatigue, "#ffc861")}
      ${bar("信任", s.trust, "#7de3ff")}
      <div style="margin:12px 0 6px;font-size:12px;color:#9fb3d4">技能</div>
      <div>${sk}</div>

      <div style="margin:14px 0 6px;font-size:12px;color:#9fb3d4">
        组员 ${team.length} 人
        ${selOrder ? `<span style="color:#7de38f">· 点名字直接派当前订单</span>` : `<span style="color:#ffc861">· 先在左边选订单</span>`}
      </div>
      <div style="max-height:190px;overflow-y:auto;border:1px solid rgba(120,150,200,.16);border-radius:9px">
        ${
          team.length
            ? team.map((w) => {
                const stat = w.mustRest ? ["需休息", "#ef7a7a"] : (w.busy ? ["在做活", "#f0a63c"] : ["空闲", "#6fc48b"]);
                const skv = Object.keys(CFG.types).map((k) => w.skills[k] || 0).join("/");
                return `<div style="display:flex;align-items:center;gap:9px;padding:7px 11px;border-bottom:1px solid rgba(120,150,200,.1);font-size:12px;cursor:pointer"
                    onclick="pickWorkerForOrder('${w.id}')" title="${selOrder ? "点他做当前订单" : "先在左边选一张订单"}">
                    <span style="flex:1;color:#fff;font-weight:600">${w.name}</span>
                    <span style="color:#8ea3c9">${w.tier === "elite" ? "顶尖" : (w.tier === "senior" ? "资深" : "普通")}</span>
                    <span style="color:#9fb3d4">技 ${skv}</span>
                    <span style="color:#9fb3d4">力 ${Math.round(w.stamina)}</span>
                    <span style="color:#ffd36e">¥${w.wage}</span>
                    <span style="color:#7de3ff">⚡${w.tier === "elite" ? 4 : (w.tier === "senior" ? 3 : 2)}</span>
                    <span style="color:${stat[1]};width:44px;text-align:right">${stat[0]}</span>
                    <button onclick="event.stopPropagation();pickWorkerForOrder('${w.id}')"
                      style="padding:3px 10px;border-radius:7px;font-size:11px;cursor:pointer;
                             background:${selOrder ? "linear-gradient(180deg,#2f6fb8,#1d4576)" : "rgba(70,80,100,.5)"};
                             color:#fff;border:1px solid rgba(120,160,220,.45)">派活</button>
                    <button onclick="event.stopPropagation();raiseWorker('${w.id}');showLeaderCard('${s.id}')"
                      title="日薪 ¥${w.wage} → ¥${w.wage + (w.tier === "elite" ? 30 : (w.tier === "senior" ? 12 : 5))}"
                      style="padding:3px 8px;border-radius:7px;font-size:11px;cursor:pointer;background:rgba(60,110,70,.75);color:#fff;border:1px solid rgba(110,200,140,.5)">加薪 ¥${w.tier === "elite" ? 800 : (w.tier === "senior" ? 400 : 200)}</button>
                    <button onclick="event.stopPropagation();coffeeWorker('${w.id}');showLeaderCard('${s.id}')"
                      style="padding:3px 8px;border-radius:7px;font-size:11px;cursor:pointer;background:rgba(110,80,40,.75);color:#fff;border:1px solid rgba(220,170,90,.5)">咖啡 ¥${CFG.coffeeCost || 80}</button>
                  </div>`;
              }).join("")
            : `<div style="padding:12px;font-size:12px;color:#8ea3c9;text-align:center">还没有组员，去管理中心招人</div>`
        }
      </div>
    </div>`;
  showModal(s.name + " 的状态", html, [
    { label: selOrder ? "主管亲自上" : "先选订单", fn: () => {
        if (!selOrder) { toast("先在左边点一张订单", "warn"); return; }
        const keep = selOrder;
        try { pickLead(id); } catch (e) { console.warn(e); }
        selOrder = keep;                 // pickLead 可能会清掉选中，这里恢复
        // 节流：短时间内只重开一次，避免连点叠出多个弹窗
        clearTimeout(window.__leaderCardTimer);
        window.__leaderCardTimer = setTimeout(() => showLeaderCard(id), 90);
      } },
    { label: "咖啡 ¥80", fn: () => { doCoffee(id); setTimeout(() => showLeaderCard(id), 60); } },
    { label: s.resting ? "取消休息" : "休息一天", fn: () => {
        try { s.resting ? cancelRest(id) : doRest(id); } catch (e) {}
        setTimeout(() => showLeaderCard(id), 60);
      } },
    { label: "谈话 ¥200", fn: () => { doTalk(id); setTimeout(() => showLeaderCard(id), 60); } },
    { label: "加薪 ¥600", fn: () => { doRaise(id); setTimeout(() => showLeaderCard(id), 60); } },
    { label: "关闭", fn: null },
  ]);
}

function openRoom(id) {
  console.log("[openRoom]", id, "3D ready=", !!(window.OFFICE3D && window.OFFICE3D.ready));
  try { if (typeof releasePending === "function") releasePending(); } catch (e) {}

  const is3D = document.body && document.body.classList.contains("scene");

  selStaff = id;
  selWorker = null;

  if (is3D) {
    // 3D 下：详情卡已经把所有信息给全了，右侧面板退回「公司概况」，
    // 避免同一个主管在两处重复显示、按钮也重复一遍
    try {
      const _keep = selStaff;
      selStaff = null;
      renderPanel();
      selStaff = _keep;
    } catch (e) {}
    try { showLeaderCard(id); } catch (e) { console.warn("card", e); }
    try { if (window.OFFICE3D && window.OFFICE3D.focusRoom) window.OFFICE3D.focusRoom(id); } catch (e) {}
    try { showRoomBar(id); } catch (e) {}
    syncAnchors3D();
    return;
  }

  // 2D 下：面板 + 详情卡都保留
  try { renderPanel(); } catch (e) {}
  try { showLeaderCard(id); } catch (e) { console.warn("card", e); }
  try { if (window.OFFICE3D && window.OFFICE3D.focusRoom) window.OFFICE3D.focusRoom(id); } catch (e) {}
  try { showRoomBar(id); } catch (e) {}
  syncAnchors3D();
}














/* 点角色选中该主管 */



function selectStaff(id) {



  selStaff = id;



  selWorker = null;



  renderAll();



}







/* 点 ★ 主管行 = 查看主管详情（不派活，避免误操作） */



function clickLead(aiId) {



  selStaff = aiId;



  selWorker = null;



  renderAll();



}







/* 主管本人下场做当前选中的订单 */



function pickLead(aiId) {



  const s = G.staff.find(x => x.id === aiId);



  if (!s) return;



  if (!selOrder) { toast("先点一张订单，再让主管上", "warn"); return; }



  const o = G.orders.find(x => x.id === selOrder);



  if (!o) return;



  const key = "ai:" + aiId;



  const onboard = o.crew.indexOf(key) >= 0;







  if (onboard) {



    o.crew = o.crew.filter(x => x !== key);



    G.compute += 3;



    s.working = null;



    toast(`${s.name} 从「${o.title}」撤下`, "");



    renderAll();



    return;



  }



  if (s.resting) { toast(`${s.name} 正在休息`, "warn"); return; }



  if (s.working) { toast(`${s.name} 已经在做别的单了`, "warn"); return; }



  if (G.compute < 3) { toast(`算力不足：主管上阵要 3，当前 ${G.compute}`, "bad"); return; }







  G.compute -= 3;



  G.usedToday = (G.usedToday || 0) + 3;



  o.crew.push(key);



  o.assignedTo = o.assignedTo || aiId;



  s.working = { orderId: o.id };



  selStaff = aiId;



  log(`🧠 ${s.name} 亲自接下「${o.title}」`);



  toast(`${s.name} 亲自上：这单进度更快，但会烧自己的精力`, "");



  renderAll();



}







function assign(orderId, staffId, manualIds) {



  const o = G.orders.find(x => x.id === orderId);



  const ai = G.staff.find(x => x.id === staffId);



  if (!o || !ai) return;







  if (ai.resting) {



    showConfirm(



      `${ai.name} 整个组在休息`,



      `要取消休息，让 ${ai.name} 挑人接下「${o.title}」吗？`,



      () => { ai.resting = false; assign(orderId, staffId); },



      "取消休息并派活"



    );



    return;



  }







  const free = G.workers.filter(w => w.aiId === staffId && !w.busy && !w.mustRest);



  if (!free.length) {



    toast(`${ai.name} 手下的人全在忙，先等结算`, "warn");



    return;



  }







  const need = Math.max(2, Math.round(o.stars * 1.7), o.minCrew || 1);   // 这单要几个人



  const have = o.crew.length;



  // 同一张单只能由一个组负责（可以给同组加人，但不能换组）
  if (o.assignedTo && o.assignedTo !== staffId) {
    toast(`「${o.title}」已经派给别的组了`, "warn");
    return;
  }
  // 允许超编：最多需要人数的 2 倍（至少 +2），人多干得快
  const maxCrew = Math.max(need + 2, Math.ceil(need * 2));
  if (have >= maxCrew) {
    toast(`「${o.title}」已经排了 ${have} 人，再多就浪费了（上限 ${maxCrew}）`, "warn");
    return;
  }
  const short = Math.max(1, Math.min(maxCrew - have, need - have > 0 ? need - have : 2));







  const afford = Math.floor(G.compute / CFG.workerCompute);



  if (afford <= 0) {



    toast(`算力不足：派一人要 ${CFG.workerCompute}，当前只有 ${G.compute}`, "bad");



    return;



  }







  // 主管按「这单类型的技能 + 体力」挑人



  let picked;
  if (manualIds && manualIds.length) {
    picked = free.filter((w) => manualIds.indexOf(w.id) >= 0);
    if (!picked.length) { toast("选的人都不空闲了，重新选", "warn"); return; }
    if (picked.length > afford) { toast(`算力只够 ${afford} 人`, "warn"); return; }
  } else {
    picked = free
      .slice()
      .sort((a, b) => (b.skills[o.type] * 100 + b.stamina) - (a.skills[o.type] * 100 + a.stamina))
      .slice(0, Math.min(short, afford, free.length));
  }







  const cost = crewCompute(picked);



  G.compute -= cost;



  G.usedToday = (G.usedToday || 0) + cost;



  picked.forEach(w => { w.busy = o.id; o.crew.push(w.id); });



  o.assignedTo = o.assignedTo || staffId;



  // 派完保留选中的订单，方便继续给他加人；派满了才取消选中
  if (o.crew.length >= Math.max(need + 2, Math.ceil(need * 2))) selOrder = null;



  selStaff = staffId;







  const match = ai.skills[o.type];



  let moodDelta = 0;



  if (match >= 4) { ai.mood = clamp(ai.mood + 5); moodDelta = 5; }



  else if (match <= 2) { ai.mood = clamp(ai.mood - 6); moodDelta = -6; }



  o.moodDelta = (o.moodDelta || 0) + moodDelta;







  const names = picked.map(w => w.name.split("·")[1]).join("、");



  bubble(ai, picked.length > 1 ? `我挑 ${picked.length} 个人上` : `这个人够了`);



  log(`${ai.name} 挑了 ${picked.length} 人（${names}）接下「${o.title}」`);



  toast(`${ai.name} 挑了 ${picked.length} 人：${names}`, "");



  renderAll();



  guideAdvance("orderAssigned");



}







function doCoffee(id) {



  const s = G.staff.find(x => x.id === id); if (!s) return;



  if (G.cash < CFG.coffeeCost) {



    toast(`资金不足：咖啡要 ¥${CFG.coffeeCost}，当前只有 ¥${Math.round(G.cash)}，还差 ¥${Math.round(CFG.coffeeCost - G.cash)}`, "bad");



    return;



  }



  G.cash -= CFG.coffeeCost;



  s.fatigue = clamp(s.fatigue - 30);                        // 立刻回精力



  s.mood = clamp(s.mood - 4);                               // 苦，心情掉



  s.coffeeDebt = (s.coffeeDebt || 0) + CFG.coffeeBacklash;  // 次日反弹：加疲劳



  bubble(s, pick(["……又是咖啡。", "苦。", "纯靠这个续命。", "心跳好快。"]));



  log(`${s.name} 喝了咖啡：精力 +30、心情 -4，明天疲劳 +${CFG.coffeeBacklash}`);



  save(); renderAll();



}



function doRest(id) {



  const s = G.staff.find(x => x.id === id); if (!s) return;



  if (s.resting) { toast(`${s.name} 已经在休息了`, "warn"); return; }



  if (s.working) { toast(`${s.name} 手上有活，今天没法休息`, "warn"); return; }



  s.resting = true;



  bubble(s, "那我先睡会儿");



  log(`${s.name} 今天休息（结算时恢复）`);



  toast(`${s.name} 进入休息状态，点右侧「取消休息」可以撤回`, "warn");



  save(); renderAll();



}



function cancelRest(id) {



  const s = G.staff.find(x => x.id === id); if (!s) return;



  s.resting = false;



  bubble(s, "那我不睡了？");



  toast(`已取消 ${s.name} 的休息`, "");



  save(); renderAll();



}



function doTalk(id) {



  const s = G.staff.find(x => x.id === id); if (!s) return;



  if (s.talkCd > 0) { toast(`谈话冷却中，还要等 ${s.talkCd} 天`, "warn"); return; }



  if (G.cash < 200) { toast(`资金不足：谈话要 ¥200，当前只有 ¥${G.cash}，还差 ¥${200 - G.cash}`, "bad"); return; }



  G.cash -= 200; s.talkCd = 2; s.mood = clamp(s.mood + 14); s.trust = clamp(s.trust + 10);



  bubble(s, pick(["谢谢老板。","……聊得还行。","我会好好干的。"])); log(`${s.name} 一对一谈话，心情 +14`); save(); renderAll();



}



function doRaise(id) {



  const s = G.staff.find(x => x.id === id); if (!s) return;



  if (s.raiseCd > 0) { toast(`刚加过薪，还要等 ${s.raiseCd} 天`, "warn"); return; }



  if (G.cash < 600) { toast(`资金不足：加薪要 ¥600，当前只有 ¥${G.cash}，还差 ¥${600 - G.cash}`, "bad"); return; }



  const _oldWage = s.wage;
  s.wage = s.wage + 40;   // 固定 +¥40/天，不滚雪球
  G.cash -= 600; s.raiseCd = 5; s.trust = clamp(s.trust + 18); s.mood = clamp(s.mood + 20);



  bubble(s, "老板大气！"); log(`${s.name} 加薪 ¥${_oldWage}→¥${s.wage}/天，信任 +18`); save(); renderAll();



}







function bubble(s, text) { s.bubble = text; s.bubbleT = 1; setTimeout(() => { s.bubbleT = 0; renderOffice(); }, 2200); }



function log(text) {



  G.logs.unshift({ d: G.day, text });



  if (G.logs.length > 40) G.logs.pop();



  const box = $("log");



  box.innerHTML = G.logs.slice(0, 2).map((l, i) => `<div class="${i === 0 ? "new" : ""}">D${l.d} · ${l.text}</div>`).join("");



}







/* ---------- 浮动提示 ---------- */



function toast(msg, kind) {



  const wrap = $("toasts");



  if (!wrap) return;



  // 同一句话短时间内不重复堆叠



  const kids = wrap.children;



  if (kids && kids.length) {



    const last = kids[kids.length - 1];



    if (last && last.textContent === msg) return;



  }



  const t = document.createElement("div");



  t.className = "toast" + (kind ? " " + kind : "");



  t.textContent = msg;



  wrap.appendChild(t);



  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 280); }, 2200);



}







/* ---------- 确认弹窗 ---------- */



/* ---------- 员工选择列表 ---------- */
let _pickOrderId = null, _pickStaffId = null, _pickSel = [];

function showWorkerPicker(orderId, staffId) {
  const o = G.orders.find((x) => x.id === orderId);
  const ai = G.staff.find((x) => x.id === staffId);
  if (!o || !ai) return;
  _pickOrderId = orderId;
  _pickStaffId = staffId;
  _pickSel = [];
  renderPicker();
}

function renderPicker() {
  const o = G.orders.find((x) => x.id === _pickOrderId);
  const ai = G.staff.find((x) => x.id === _pickStaffId);
  if (!o || !ai) return;
  const team = G.workers.filter((w) => w.aiId === _pickStaffId);
  const need = Math.max(2, Math.round(o.stars * 1.7), o.minCrew || 1) - o.crew.length;
  const afford = Math.floor(G.compute / CFG.workerCompute);

  // 主管本人（可以亲自上，消耗 3 算力）
  const chiefKey = "ai:" + _pickStaffId;
  const chiefOn = _pickSel.indexOf(chiefKey) >= 0;
  const chiefBusy = !!(ai.working);
  const chiefRest = !!ai.resting;
  const chiefFree = !chiefBusy && !chiefRest;
  const chiefRow = `<div class="pkrow${chiefOn ? " on" : ""}" style="${chiefFree ? "" : "opacity:.42;"}cursor:${chiefFree ? "pointer" : "not-allowed"}"
      onclick="${chiefFree ? `togglePick('${chiefKey}')` : ""}">
      <span class="pkbox">${chiefOn ? "✓" : ""}</span>
      <span class="pkname">${ai.name} <em style="font-style:normal;font-size:10px;color:#ffd36e">主管</em></span>
      <span class="pksk">技能 <b>${ai.skills[o.type] || 0}</b></span>
      <span class="pkstam">精力 <b>${Math.round(ai.mood)}</b></span>
      <span class="pkstate" style="color:${chiefRest ? "#ef7a7a" : (chiefBusy ? "#f0a63c" : "#6fc48b")}">${chiefRest ? "休息中" : (chiefBusy ? "在做单" : "可上阵")}</span>
    </div>`;

  const rows = chiefRow + team.map((w) => {
    const free = !w.busy && !w.mustRest;
    const on = _pickSel.indexOf(w.id) >= 0;
    const sk = w.skills[o.type] || 0;
    const st = w.mustRest ? "需休息" : (w.busy ? "在做活" : "空闲");
    const stCol = w.mustRest ? "#ef7a7a" : (w.busy ? "#f0a63c" : "#6fc48b");
    const dim = free ? "" : "opacity:.42;";
    return `<div class="pkrow${on ? " on" : ""}" style="${dim}cursor:${free ? "pointer" : "not-allowed"}"
      onclick="${free ? `togglePick('${w.id}')` : ""}">
      <span class="pkbox">${on ? "✓" : ""}</span>
      <span class="pkname">${w.name}</span>
      <span class="pksk">技能 <b>${sk}</b></span>
      <span class="pkstam">体力 <b>${w.stamina}</b></span>
      <span class="pksk">⚡ <b>${w.tier === "elite" ? 4 : (w.tier === "senior" ? 3 : 2)}</b></span>
      <span class="pkstate" style="color:${stCol}">${st}</span>
    </div>`;
  }).join("");

  const cost = _pickSel.reduce((a, id) => {
    if (id.indexOf("ai:") === 0) return a + 3;
    const ww = G.workers.find(x => x.id === id);
    return a + (ww ? (ww.tier === "elite" ? 4 : (ww.tier === "senior" ? 3 : 2)) : 2);
  }, 0);
  const html = `<div style="font-size:12.5px;color:#9fb3d4;margin-bottom:10px;line-height:1.7">
      订单：<b style="color:#fff">${o.title}</b> · 类型 ${CFG.types[o.type] ? CFG.types[o.type].name : o.type} · 需要 <b>${need}</b> 人<br>
      部门：<b style="color:#fff">${ai.name}</b> · 算力余额 ${G.compute}（最多派 ${afford} 人）
    </div>
    <div class="pklist">${rows}</div>
    <div id="pkFoot" style="margin-top:12px;font-size:13px;color:#cfe0ff">
      已选 <b id="pkCount">${_pickSel.length}</b> 人 · 消耗 <b id="pkCost">${cost}</b> 算力
    </div>`;
  showModal("选择派出的人", html, [
    { label: "取消", fn: () => { releasePending(); } },
    { label: "确认派单", fn: () => {
        if (!_pickSel.length) { toast("至少选一个人", "warn"); return; }
        const oid = _pickOrderId, sid = _pickStaffId, sel = _pickSel.slice();
        _pickSel = [];
        releasePending();
        // 主管亲自上
        if (sel.indexOf("ai:" + sid) >= 0) {
          const keep = selOrder;
          selOrder = oid;
          try { pickLead(sid); } catch (e) { console.warn(e); }
          selOrder = keep;
        }
        // 再派组员
        const workers = sel.filter((id) => id.indexOf("ai:") !== 0);
        if (workers.length) assign(oid, sid, workers);
      } },
  ]);
}

/* 释放所有待派标记 */
function releasePending() {
  (G.workers || []).forEach((w) => {
    if (w._pending) w._pending = null;
  });
  _pickSel = [];
}

function togglePick(wid) {
  const i = _pickSel.indexOf(wid);
  const w = G.workers.find((x) => x.id === wid);
  if (i >= 0) {
    _pickSel.splice(i, 1);
    if (w) w._pending = null;
  } else {
    // 已经被别的单预定了就不给选
    if (w && w._pending && w._pending !== _pickOrderId) {
      toast(`${w.name} 已被另一张单预定`, "warn");
      return;
    }
    _pickSel.push(wid);
    if (w) w._pending = _pickOrderId;
  }
  // 只更新勾选状态和统计，不重建整个弹窗
  // 按顺序重画所有行的勾选态（第 0 行是主管）
  const rows = document.querySelectorAll(".pkrow");
  const ids = ["ai:" + _pickStaffId].concat(
    G.workers.filter((w) => w.aiId === _pickStaffId).map((w) => w.id)
  );
  ids.forEach((id, idx) => {
    const el = rows[idx];
    if (!el) return;
    const on = _pickSel.indexOf(id) >= 0;
    el.classList.toggle("on", on);
    const box = el.querySelector(".pkbox");
    if (box) box.textContent = on ? "✓" : "";
  });
  const c = document.getElementById("pkCount");
  const k = document.getElementById("pkCost");
  if (c) c.textContent = _pickSel.length;
  if (k) k.textContent = _pickSel.length * CFG.workerCompute;
}

function showConfirm(title, html, onOk, okLabel) {



  showModal(title, html, [



    { label: "取消", fn: null },



    { label: okLabel || "确定", fn: onOk },



  ]);



}







/* ---------- 日结转场 ---------- */



let dayFxTimer = null;



function showDayTransition(day, items) {



  const box = $("dayfx");



  if (!box) return;



  const d = box.querySelector(".dayfx-day");



  const l = box.querySelector(".dayfx-list");



  if (d) d.innerHTML = "第 <b>" + day + "</b> 天";



  if (l) l.innerHTML = (items && items.length)



    ? items.map(t => '<div class="dayfx-line">' + t + "</div>").join("")



    : "";



  box.classList.add("on");



  clearTimeout(dayFxTimer);



  dayFxTimer = setTimeout(() => box.classList.remove("on"), 1500);



}







/* =========================================================



   一天结算



   ========================================================= */



function moodMult(m) {



  const d = (m - 75) / 55;



  return Math.max(0.35, 1.2 - 0.65 * d * d);



}



function energyMult(f) { return 0.55 + 0.45 * (1 - f / 100); }







function endDay() {



  if (G.finished) return;



  const deltas = [];



  const workedIds = new Set();



  const workedLeads = new Set();







  // 0. 算力超载：先算出加成与费用



  const ov = overloadInfo();







  // 1. 项目推进（按参与人数累加）



  const doneIds = [];



  G.orders.forEach(o => {



    if (!o.crew.length) return;



    let gain = 0;



    o.crew.forEach(wid => {



      // 主管本人



      if (typeof wid === "string" && wid.indexOf("ai:") === 0) {



        const ai = G.staff.find(s => s.id === wid.slice(3));



        if (!ai) return;



        const lv = ai.skills[o.type] || 1;



        const eff = (lv * 8 + 6) * moodMult(ai.mood) * energyMult(ai.fatigue);



        gain += eff;



        const streak = ai.streak || 0;



        const cost = Math.min(CFG.leadFatigueMax, CFG.leadFatigueBase + streak * CFG.leadFatigueStep);



        ai.fatigue = clamp(ai.fatigue + cost);



        // 心情看这单对不对口



        if (lv >= 4) {



          ai.mood = clamp(ai.mood + 3);   // 擅长：有成就感



          bubble(ai, pick(["这活我喜欢。", "拿手活。", "正合我意。"]));



        } else if (lv <= 2) {



          ai.mood = clamp(ai.mood - 4);   // 不对口：煎熬



          bubble(ai, pick(["……这个我不熟。", "又要熬。", "不太对口啊。"]));



        } else {



          ai.mood = clamp(ai.mood - 2);



        }



        ai.streak = streak + 1;



        workedLeads.add(ai.id);



        return;







      }



      const w = G.workers.find(x => x.id === wid);



      if (!w) return;



      const ai = G.staff.find(s => s.id === w.aiId);



      const lv = w.skills[o.type] || 1;



      const eff = (lv * 5 + 3) * moodMult(ai.mood) * (0.55 + 0.45 * (w.stamina / 100));



      gain += eff;



      w.stamina = clamp(w.stamina - 14);



      workedIds.add(w.id);



    });



    o.progress += gain * (1 + ov.bonus);



    if (o.progress >= o.need) doneIds.push(o.id);



  });







  // 2. 交付



  doneIds.forEach(id => {



    const o = G.orders.find(x => x.id === id);



    if (!o) return;



    G.cash += o.reward;



    G.reputation = clamp(G.reputation + 4);



    G.investor = clamp(G.investor + 2);



    o.crew.forEach(wid => {



      if (typeof wid === "string" && wid.indexOf("ai:") === 0) {



        const ai = G.staff.find(s => s.id === wid.slice(3));



        if (ai) ai.working = null;



        return;



      }



      const w = G.workers.find(x => x.id === wid);



      if (w) { w.busy = null; w.stamina = clamp(w.stamina + 4); }



    });



    // 参与的每个组都记功（可能不止一个组）



    crewGroups(o).forEach(gid => {



      const ai = G.staff.find(s => s.id === gid);



      if (!ai) return;



      ai.mood = clamp(ai.mood + 8);



      ai.trust = clamp(ai.trust + 4);



      ai.level = Math.min(3, ai.level + (Math.random() < 0.25 ? 1 : 0));



      bubble(ai, pick(["交付了！", "这单拿下。", "客户挺满意。"]));



    });



    log(`✅ ${o.title} 交付（${o.crew.length} 人），+¥${o.reward}`);



    deltas.push(`✅ <b>${o.title}</b> 交付 <span style="color:#59d98c">+¥${o.reward}</span>`);



    G.orders = G.orders.filter(x => x.id !== id);



  });







  // 3. 空闲的人恢复体力



  G.workers.forEach(w => {



    if (w.mustRest) {



      // 强制休息：满血复活



      w.stamina = clamp(w.stamina + CFG.forceRestRecover);



      w.mustRest = false;



      w.busy = null;



    } else if (!w.busy && !workedIds.has(w.id)) {



      w.stamina = clamp(w.stamina + CFG.idleRecover);   // 完全空闲：充分恢复



    } else if (workedIds.has(w.id)) {



      w.stamina = clamp(w.stamina + CFG.workRecover);   // 干过活：也能回一点



    }



    // 累到红线以下 → 明天必须休息



    if (w.stamina < CFG.exhaustLine) {



      w.mustRest = true;



      deltas.push(`😵 ${w.name} 体力见底，明天强制休息`);



    }



  });







  // 4. AI 的状态



  G.staff.forEach(s => {



    // 休息中的 AI：结算时恢复，跳过当天的常规漂移



    if (s.resting) {



      s.fatigue = clamp(s.fatigue - 35);



      s.mood = clamp(s.mood + 8);



      s.trust = clamp(s.trust + 2);



      s.resting = false;



      s.streak = 0;



      deltas.push(`😴 ${s.name} 休息了一天（疲劳 -35，心情 +8）`);



      return;



    }



    if (!workedLeads.has(s.id)) s.streak = 0;   // 歇一天就清零



    const busy = G.workers.filter(w => w.aiId === s.id && w.busy).length;



    if (workedLeads.has(s.id)) {



      // 亲自上阵：疲劳/心情已在结算时按连击算过，这里不再叠加



    } else if (busy) {



      s.fatigue = clamp(s.fatigue + 7);



      s.mood = clamp(s.mood - 2);



    } else {



      s.mood = clamp(s.mood + 2);



      s.fatigue = clamp(s.fatigue - 4);



    }



    s.mood = clamp(s.mood - 1.5);



    if (s.coffeeDebt) {                        // 咖啡后遗症：次日反噬



      s.fatigue = clamp(s.fatigue + s.coffeeDebt);



      s.mood = clamp(s.mood - 1);



      s.coffeeDebt = 0;



    }



    if (s.fatigue > 75) s.mood = clamp(s.mood - 5);



    s.talkCd = Math.max(0, s.talkCd - 1);



    s.raiseCd = Math.max(0, s.raiseCd - 1);
  (G.workers || []).forEach(w => { if (w.raiseCd > 0) w.raiseCd = Math.max(0, w.raiseCd - 1); });



  });







  // 5. 订单倒计时 / 超时



  G.orders.forEach(o => { o.daysLeft--; });



  const expired = G.orders.filter(o => o.daysLeft <= 0);



  expired.forEach(o => {



    if (!o.crew.length) return;   // 没接的单直接过期，不罚款（玩家可以主动放弃）



    if ((G.shield || 0) > 0) {
      G.shield -= 1;
      log(`🛡️ 逾期免罚券生效，免除 ¥${o.penalty}`);
    } else {
      G.cash -= o.penalty;
    }



    G.reputation = clamp(G.reputation - 3);



    o.crew.forEach(wid => {



      if (typeof wid === "string" && wid.indexOf("ai:") === 0) {



        const ai = G.staff.find(s => s.id === wid.slice(3));



        if (ai) ai.working = null;



        return;



      }



      const w = G.workers.find(x => x.id === wid);



      if (w) w.busy = null;



    });



    log(`❌ ${o.title} 超时，违约金 ¥${o.penalty}`);



    deltas.push(`❌ <b>${o.title}</b> 超时 <span style="color:#ff6b6b">-¥${o.penalty}</span>`);



  });



  G.orders = G.orders.filter(o => o.daysLeft > 0);







  // 6. 固定开销



  const aiWages = G.staff.reduce((a, s) => a + s.wage, 0);



  const workerWages = G.workers.reduce((a, w) => a + w.wage, 0);



  const wages = aiWages + workerWages;



  const costMul = ((CFG.diff && CFG.diff.costMul) || 1) * (1 + ((CFG.diff && CFG.diff.costRamp) || 0) * (G.day - 1));



  G.cash -= Math.round((wages + CFG.rentPerDay) * costMul);



  log(`💸 发薪 ¥${wages}（AI ${aiWages} + 员工 ${workerWages}）+ 房租 ¥${CFG.rentPerDay}`);



  deltas.push(`💸 发薪 <span style="color:#ff9b9b">-¥${wages}</span> · 房租 <span style="color:#ff9b9b">-¥${CFG.rentPerDay}</span>`);







  // 第一次超载：跟玩家解释清楚算法



  if (ov.fee > 0 && !G.seenOverloadTip) {



    G.seenOverloadTip = true;



    setTimeout(() => showOverloadHelp(ov), 700);



  }







  // 算力超载费



  if (ov.fee > 0) {



    G.cash -= ov.fee;



    deltas.push(`⚡ 超频运行（超出 ${ov.over} 点，产出 +${Math.round(ov.bonus * 100)}%）`);



    deltas.push(`💸 超载费 <span style="color:#ff9b9b">-¥${ov.fee}</span>`);



    log(`⚡ 超载 ${ov.over} 点：产出 +${Math.round(ov.bonus * 100)}%，扣 ¥${ov.fee}`);



  }







  // 7. 算力恢复



  // 商店上新提示（当天刚解锁的道具）
  try {
    const _newItems = Object.keys(ITEMS).map((k) => ITEMS[k])
      .filter((it) => it.unlockDay && it.unlockDay === (G.day + 1));
    if (_newItems.length) {
      G.shopNotice = _newItems.map((it) => `${it.icon} ${it.name}`).join("、");
    }
  } catch (e) {}
  if (G.shopNotice) { setTimeout(() => { showShopNotice(G.shopNotice); G.shopNotice = null; save(); }, 700); }
  // 随机事件：第 5 天后才有，时间与概率全随机，无任何提示
  if (typeof maybeRandomEvent === "function") setTimeout(() => { try { maybeRandomEvent(); } catch (e) { console.warn(e); } }, 1400);

  G.usedToday = 0;   // 新的一天，免费额度重置
  G.quotaBoost = 0;  // 动员令只当天有效
  // 昨天派出去还没干完的人，今天继续占着算力额度
  const _leftBusy = (G.workers || []).filter((w) => w.busy).length;
  G.quotaPenalty = _leftBusy * CFG.workerCompute;



  const cmpBefore = G.compute;



  G.compute = Math.min(CFG.maxCompute, G.compute + CFG.computePerDay);



  if (G.compute > cmpBefore) log(`⚡ 算力恢复 +${G.compute - cmpBefore}`);







  // 8. 士气



  const avgMood = G.staff.reduce((a, s) => a + s.mood, 0) / G.staff.length;



  G.morale = clamp(G.morale + (avgMood - 55) * 0.25);







  // 9. 投资人（每 7 天）



  if (G.day % 7 === 0) {



    if (G.cash > 8000 && G.reputation > 60) { G.investor = clamp(G.investor + 8); log("🏦 投资人满意，信心 +8"); }



    else if (G.cash < 1500) { G.investor = clamp(G.investor - 10); log("🏦 投资人不满，信心 -10"); }



  }







  // 10. 随机事件



  if (Math.random() < 0.35) {



    const e = pick(CFG.events);



    const extra = e.fx(G) || "";



    showModal(e.name, e.desc + (extra ? `<br><b>${extra}</b>` : ""));



    log(`🎲 事件：${e.name}`);



    deltas.push(`🎲 事件：<b>${e.name}</b>`);



  }







  // 11. 新订单



  for (let i = 0; i < ordersPerDay(G.day); i++) spawnOrder();







  // 12. 推进



  G.lastAssign = null;



  const typesBefore = unlockedTypes(G.day);



  G.day++;



  const typesAfter = unlockedTypes(G.day);



  const newTypes = typesAfter.filter(t => typesBefore.indexOf(t) < 0);



  if (newTypes.length) {



    const names = newTypes.map(t => CFG.types[t].name).join("、");



    log(`🔓 新订单类型解锁：${names}`);



    deltas.push(`🔓 新订单类型解锁：<b>${names}</b>`);



  }



  // 记录这一天的历史（截断 deltas 里的 HTML，只留纯文本摘要）



  const plain = deltas.map(x => String(x).replace(/<[^>]+>/g, "")).filter(Boolean);



  G.history = G.history || [];



  G.history.push({



    day: G.day - 1,



    cash: Math.round(G.cash),



    compute: Math.round(G.compute),



    rep: Math.round(G.reputation),



    morale: Math.round(G.morale),



    investor: Math.round(G.investor),



    workers: G.workers.length,



    deltas: plain,



  });



  if (G.history.length > 60) G.history = G.history.slice(-60);







  checkEnd();



  if (!G.finished) showDayTransition(G.day, deltas);



  G.peakCash = Math.max(G.peakCash || 0, G.cash);



  guideAdvance("dayEnded");



  save();



  renderAll();



}







function checkEnd() {



  let ending = null;



  if (G.cash < 0) ending = { t: "破产了", d: "资金链断裂，公司清算。你保住了员工的最后一个月工资，但公司没了。" };



  else if (G.staff.every(s => s.mood < 25)) ending = { t: "集体离职", d: "全员心情崩盘，核心团队一夜之间走光。" };



  else if (G.reputation < 15) ending = { t: "口碑崩盘", d: "差评刷屏，再也没有客户上门。" };



  else if (G.day > CFG.days) {



    const avg = G.staff.reduce((a, s) => a + s.mood, 0) / G.staff.length;



    if (G.investor > 70 && avg > 70) ending = { t: "人性化乌托邦", d: "公司赚钱，员工开心。你证明了：不压榨也能活得好。" };



    else if (avg < 40) ending = { t: "黑心公司", d: "利润漂亮，员工麻木。有人把你的公司写成了反面教材。" };



    else ending = { t: "平稳收官", d: "不惊艳，但活下来了。这行本来就不容易。" };

  // 现金评级（每个难度门槛不同）
  const _cash = Math.max(0, Math.round(G.cash));
  const _rt = (CFG.rankTiers && CFG.rankTiers[CFG.diff.id]) || { S: 5000000, A: 2000000, B: 1000000, C: 300000 };
  ending.rank = _cash >= _rt.S ? "S" : _cash >= _rt.A ? "A" : _cash >= _rt.B ? "B" : _cash >= _rt.C ? "C" : "破产";
  ending.cash = _cash;
  ending.rankTier = _rt;



  }



  if (ending) {

  // 按评级取该难度专属的结局文案
  if (ending && ending.rank) {
    const _endSet = (CFG.rankEndings && CFG.rankEndings[CFG.diff.id]) || CFG.rankEndings.normal;
    const _pair = _endSet[ending.rank] || _endSet.D || ["平稳收官", "不惊艳，但活下来了。"];
    ending.t = _pair[0];
    ending.d = _pair[1];
  }
  // 记录到结局图鉴
  try { recordEnding(CFG.diff.id, ending.rank); } catch (e) {}

  G.finished = true;



    const _rankColors = { S: "#ffd45e", A: "#8fe3ff", B: "#7de38f", C: "#c8d6ea", "破产": "#ff7b7b" };
  const _rankColor = _rankColors[ending.rank] || "#c8d6ea";
  const _rankBox = `<div style="display:flex;align-items:center;gap:14px;margin:14px 0 4px;padding:12px 16px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(150,180,220,.2)">
      <span style="font-size:${ending.rank === "破产" ? 26 : 38}px;font-weight:800;line-height:1;color:${_rankColor};text-shadow:0 0 18px ${_rankColor}55">${ending.rank}</span>
      <span style="font-size:12.5px;color:#9fb3d4;line-height:1.7">
        最终资金 <b style="color:#fff">¥${(ending.cash || 0).toLocaleString()}</b> · ${CFG.diff.name}难度<br>
        S ¥${Math.round((ending.rankTier?.S || 0) / 10000)}万 · A ¥${Math.round((ending.rankTier?.A || 0) / 10000)}万 · B ¥${Math.round((ending.rankTier?.B || 0) / 10000)}万 · C ¥${Math.round((ending.rankTier?.C || 0) / 10000)}万
      </span>
    </div>`;
  showModal("结局：" + ending.t, ending.d + _rankBox + `<div style="font-size:12px;color:#8ea3c9">第 ${G.day - 1} 天 · 口碑 ${G.reputation} · 士气 ${G.morale}</div>`,



      [{ label: "重开一局", fn: () => { pickDifficulty(true); } }]);



  }



}







/* =========================================================



   弹窗 / 存档



   ========================================================= */



function showModal(title, html, acts) {
  // 防止弹窗叠加：先把可能存在的旧层关掉
  try { const _m = $("modal"); if (_m) _m.classList.remove("on"); } catch (e) {}



  const box = $("modalBox");



  box.innerHTML = `<h2>${title}</h2><p>${html}</p><div class="acts"></div>`;



  const actsEl = box.querySelector(".acts");



  const list = acts || [{ label: "知道了", fn: null }];



  list.forEach(a => {



    const b = document.createElement("button");



    b.textContent = a.label;



    b.onclick = () => { $("modal").classList.remove("on"); if (a.fn) a.fn(); };



    actsEl.appendChild(b);



  });



  $("modal").classList.add("on");



}







const SAVE_KEY = "aicompany_v3";   // 结构变了就升版，旧存档自动作废



function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) {} }



function load() {



  try {



    const raw = localStorage.getItem(SAVE_KEY);



    if (!raw) return false;



    G = JSON.parse(raw);
    const _dd = CFG.difficulties.find((x) => x.id === G.diffId);
    if (_dd) CFG.diff = _dd;   // 存档自带难度，不让玩家换档卡评级



    // 结构校验：老版本存档没有 workers / crew，直接作废，避免渲染崩溃



    if (!G || !Array.isArray(G.staff) || !Array.isArray(G.orders) || !Array.isArray(G.workers)) return false;



    if (G.staff.length !== CFG.staff.length || G.workers.length === 0) return false;



    if (!G.orders.every(o => Array.isArray(o.crew))) return false;



    if (typeof G.peakCash !== "number") G.peakCash = Math.max(G.cash || 0, CFG.startCash);



    if (!Array.isArray(G.bag)) G.bag = [];



    if (!Array.isArray(G.history)) G.history = [];



    CFG.diff = CFG.difficulties.find(x => x.id === G.diffId) || CFG.difficulties[0];



    if (!G.bought || typeof G.bought !== "object") G.bought = {};



    // 旧存档迁移：初始下属技能压到 2~3（招募来的按档次保留）



    let migrated = false;



    (G.workers || []).forEach(w => {



      if (w.tier) return;



      Object.keys(w.skills || {}).forEach(k => {



        if (w.skills[k] > 3) { w.skills[k] = 3; migrated = true; }



        if (w.skills[k] < 2) { w.skills[k] = 2; migrated = true; }



      });



    });



    if (migrated) { try { save(); } catch (e) {} }



    return true;



  } catch (e) { return false; }



}







/* =========================================================



   启动



   ========================================================= */











/* =========================================================



   招聘与转卖



   ========================================================= */



function peakCash() {



  return Math.max(G.peakCash || 0, G.cash || 0);



}







function tierUnlocked(t) {



  return peakCash() >= t.needPeak;



}







function makeWorker(ai, tier) {



  const sk = {};



  const bestType = Object.keys(ai.skills).sort((a, b) => ai.skills[b] - ai.skills[a])[0];



  const lucky = Math.random() < 0.1;   // 每个新人 10% 的概率触发专精加成



  Object.keys(CFG.types).forEach(k => {



    let v = rnd(tier.lo, tier.hi);



    // 专精加成：这个 AI 最拿手的领域再 +1（普通档不加）



    if (k === bestType && tier.id !== "junior" && lucky) v = Math.min(5, v + 1);



    sk[k] = Math.max(1, Math.min(5, v));



  });















  const idx = G.workers.filter(w => w.aiId === ai.id).length + 1;

  return {



    id: ai.id + "-" + idx + "-" + Date.now().toString().slice(-4),



    aiId: ai.id,



    name: ai.name + "·" + idx,



    skills: sk,



    stamina: rnd(80, 100),



    busy: null,



    wage: tier.id === "elite" ? 150 : (tier.id === "senior" ? 60 : CFG.workerWage),



    tier: tier.id,



  };



}







function recruit(tierId, aiId) {



  const tier = CFG.recruitTiers.find(t => t.id === tierId);



  const ai = G.staff.find(s => s.id === aiId);



  if (!tier || !ai) return;



  if (!tierUnlocked(tier)) {



    toast(`需要历史最高资金达到 ¥${tier.needPeak} 才能招「${tier.name}」（当前最高 ¥${Math.round(peakCash())}）`, "bad");



    return;



  }



  if (G.cash < tier.cost) {



    toast(`资金不足：招一个「${tier.name}」要 ¥${tier.cost}，当前 ¥${Math.round(G.cash)}，还差 ¥${Math.round(tier.cost - G.cash)}`, "bad");



    return;



  }



  G.cash -= tier.cost;



  const w = makeWorker(ai, tier);



  G.workers.push(w);



  log(`🎓 ${ai.name} 招到 ${w.name}（${tier.name}）`);



  toast(`招到 ${w.name}（${tier.name}），日薪 ¥${w.wage}`, "");



  save();



  renderAll();



}







/* 当天的算力超载情况 */



function overloadInfo() {



  const used = G.usedToday || 0;



  const over = Math.max(0, used - effFreeCompute());



  const fee = over > 0 ? Math.round(CFG.overFeeBase * Math.pow(over, CFG.overFeeExp)) : 0;



  const bonus = Math.min(CFG.overBonusMax, CFG.overBonusPerPt * over);



  return { used, over, fee, bonus };



}







/* 卖价：基础 300 + 技能总和×50；



   但招募来的人最多只能卖回当初招募价的 85%（防止"招→卖"刷钱） */



/* 这单是哪些组在做（可能不止一个组） */



function crewGroups(o) {



  const set = new Set();



  (o.crew || []).forEach(id => {



    if (typeof id === "string" && id.indexOf("ai:") === 0) { set.add(id.slice(3)); return; }



    const w = G.workers.find(x => x.id === id);



    if (w) set.add(w.aiId);



  });



  return [...set];



}







function sellPrice(w) {



  let p = CFG.sellBase + Object.values(w.skills).reduce((a, b) => a + b, 0) * 50;



  if (w.paid) p = Math.min(p, Math.round(w.paid * 0.85));



  return p;



}







function sellWorker(workerId) {



  const w = G.workers.find(x => x.id === workerId);



  if (!w) return;



  if (w.busy) { toast(`${w.name} 手上有活，先撤回再卖`, "warn"); return; }



  const ai = G.staff.find(s => s.id === w.aiId);



  const sum = Object.values(w.skills).reduce((a, b) => a + b, 0);



  const price = sellPrice(w);



  showConfirm(



    `卖掉 ${w.name}？`,



    `${w.name} 属于 ${ai ? ai.name : "某组"}，技能总和 ${sum}。<br><br>` +



    `可得 <b style="color:#ffc861">¥${price}</b>，之后每天少付 ¥${w.wage} 工资。<br>` +



    `<span style="color:#8ea3c9;font-size:12px">卖掉就找不回来了。</span>`,



    () => {



      G.cash += price;



      G.peakCash = Math.max(G.peakCash || 0, G.cash);



      G.workers = G.workers.filter(x => x.id !== workerId);



      log(`💸 卖掉 ${w.name}，+¥${price}`);



      toast(`已卖掉 ${w.name}，+¥${price}`, "");



      save();



      renderAll();



    },



    "卖掉"



  );



}















/* =========================================================



   操作效果（悬停按钮显示在屏幕下方）



   ========================================================= */


