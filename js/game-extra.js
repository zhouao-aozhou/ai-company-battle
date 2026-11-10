const ACTION_TIPS = {



  coffee:     "☕ <b>主管咖啡</b> ¥80 — 精力 +30（疲劳 -30）· 心情 -4 · 次日疲劳 +18",



  rest:       "😴 <b>休息一天</b> — 疲劳 -35 · 心情 +8 · 信任 +2 <em>（当天不能干活）</em>",



  cancelRest: "↩ <b>取消休息</b> — 立刻恢复正常状态",



  talk:       "💬 <b>一对一谈话</b> ¥200 — 心情 +14 · 信任 +10 <em>冷却 2 天</em>",



  raise:      "💵 <b>加薪</b> ¥600 — 心情 +20 · 信任 +18 <em>冷却 5 天</em>",
  wraise:     "💵 <b>组员加薪</b> — 普通 ¥200 / 资深 ¥400 / 顶尖 ¥800 · 日薪 +5 / +12 / +30 · 体力 +15 <em>冷却 5 天</em>",
  wcoffee:    "☕ <b>组员咖啡</b> ¥80 — 体力回满 <em>（已经满体力时按钮会变灰）</em>",
  sell:       "💸 <b>卖掉组员</b> — 一次性拿到钱，之后不再给他发工资 <em>（在做活时不能卖）</em>",



  pickTeam:   "👥 <b>主管挑人</b> — 按订单类型挑技能最高、体力最好的人",



  pickLead:   "🧠 <b>主管亲自上</b> — 算力 3 · 产出约 1.6 倍 · 疲劳 +12~36（连上递增）· 对口心情 +3 / 不对口 -4",



  wcoffee:    "☕ <b>员工咖啡</b> ¥80 — 体力 +15",



  sell:       "💸 <b>卖掉员工</b> — 得 300 + 技能总和×50，之后不再付日薪",



  hire:       "🎓 <b>招募</b> — 先选档次，再点部门并确认",



};







let actTipTimer = null;



function showActionTip(key) {



  const tip = $("actTip");



  const info = ACTION_TIPS[key];



  if (!tip || !info) return;



  tip.innerHTML = info;



  tip.classList.add("on");



  clearTimeout(actTipTimer);



}



function hideActionTip() {



  const tip = $("actTip");



  if (!tip) return;



  clearTimeout(actTipTimer);



  actTipTimer = setTimeout(() => tip.classList.remove("on"), 90);



}







/* =========================================================



   第二界面：人事中心（招聘 / 人员）



   ========================================================= */



let pickTier = null;



let hrTab = "recruit";







function goHR() {



  renderHR();



  document.body.classList.add("hr-mode");



}







function goBack() {



  document.body.classList.remove("hr-mode");



}







/* 手机端：拖动底部面板的把手来调整高度 */



let sheetH = 0;          // 当前高度(px)，0 = 跟随 CSS 默认



function initSheetDrag() {



  if (typeof document.querySelector !== "function") return;



  const h = $("sheetHandle");



  if (!h) return;



  const main = document.querySelector("main");



  if (!main) return;







  let startY = 0, startH = 0, dragging = false, moved = 0;







  const curH = () => {



    const col = document.querySelector(".col.right");



    return col ? col.getBoundingClientRect().height : 0;



  };



  const setH = (px) => {



    const vh = window.innerHeight;



    const minH = vh * 0.10, maxH = vh * 0.78;



    const v = Math.max(minH, Math.min(maxH, px));



    sheetH = v;



    main.style.setProperty("--rh", v + "px");



  };







  const down = (e) => {



    dragging = true; moved = 0;



    startY = (e.touches ? e.touches[0].clientY : e.clientY);



    startH = curH();



    if (h.setPointerCapture && e.pointerId !== undefined) {



      try { h.setPointerCapture(e.pointerId); } catch (err) {}



    }



  };



  const move = (e) => {



    if (!dragging) return;



    const y = (e.touches ? e.touches[0].clientY : e.clientY);



    const dy = startY - y;          // 往上拖为正



    moved = Math.max(moved, Math.abs(dy));



    if (moved > 3) { e.preventDefault(); }



    setH(startH + dy);



  };



  const up = () => {



    if (!dragging) return;



    dragging = false;



    if (moved < 6) {



      // 没怎么动 = 点一下：在收起/展开之间切换



      const vh = window.innerHeight;



      const now = curH();



      setH(now < vh * 0.42 ? vh * 0.70 : vh * 0.18);



    }



    try { localStorage.setItem("aicompany_sheet_h", String(sheetH || 0)); } catch (err) {}



  };







  h.addEventListener("mousedown", down);



  h.addEventListener("touchstart", down, { passive: true });



  window.addEventListener("mousemove", move);



  window.addEventListener("touchmove", move, { passive: false });



  window.addEventListener("mouseup", up);



  window.addEventListener("touchend", up);







  // 恢复上次拖到的高度



  try {



    const saved = Number(localStorage.getItem("aicompany_sheet_h") || 0);



    if (saved > 60) setH(saved);



  } catch (err) {}



}







function goHistory() {







  renderHistory();



  document.body.classList.add("hist-mode");



}







function goBackHistory() {



  document.body.classList.remove("hist-mode");



}







function renderHistory() {



  const box = $("histList");



  const stat = $("histStat");



  const hist = (G.history || []).slice().reverse();



  if (stat) stat.innerHTML = `已记录 <b>${hist.length}</b> 天 · 当前第 <b>${Math.min(G.day, CFG.days)}</b> 天`;



  if (!box) return;



  if (!hist.length) {



    box.innerHTML = `<div class="bag-empty">还没有历史，先结束一天再看看</div>`;



    return;



  }



  box.innerHTML = hist.map(h => {



    const lines = (h.deltas || []).map(t => `<div class="hline">${t}</div>`).join("");



    return `<div class="hcard">



      <h4><span>第 ${h.day} 天</span><em>资金 ¥${h.cash.toLocaleString()}</em></h4>



      ${lines}



      <div class="hstats">



        <span>资金 <b>¥${h.cash.toLocaleString()}</b></span>



        <span>算力 <b>${h.compute}</b></span>



        <span>口碑 <b>${h.rep}</b></span>



        <span>士气 <b>${h.morale}</b></span>



        <span>投资人 <b>${h.investor}</b></span>



        <span>员工 <b>${h.workers}</b> 人</span>



      </div>



    </div>`;



  }).join("");



}







function goBag() {



  renderBagPage();



  document.body.classList.add("bag-mode");



}







function goBackBag() {



  document.body.classList.remove("bag-mode");



}







function renderBagPage() {



  const stat = $("bagStat");



  if (stat) stat.innerHTML = `当前资金 <b>¥${Math.round(G.cash)}</b>`;



  renderBag();



}







function switchHRTab(tab) {



  hrTab = tab;



  if (typeof document.querySelectorAll === "function") {



    document.querySelectorAll(".hr-tab").forEach(b => {



      b.classList.toggle("on", b.getAttribute("data-tab") === tab);



    });



  }



  ["recruit", "staff", "shop"].forEach(k => {



    const el = $("pane" + k.charAt(0).toUpperCase() + k.slice(1));



    if (el) el.classList.toggle("on", tab === k);



  });



  renderHR();



}







/* =========================================================



   商店 / 背包 / 道具



   ========================================================= */



const ITEMS = {



  sup: { id: "sup", icon: "🎫", name: "主管进阶券", kind: "sup", base: 3000, growth: 1.7, color: "#b48cff",



    desc: "选中主管的任意技能 +1；主管技能上限随购买张数提高" },



  jr: { id: "jr", icon: "📗", name: "初级培训券", kind: "worker", tier: "junior", cost: 1200, cap: 4, color: "#8fb7ff",



    desc: "普通员工技能 +1，最多到 4" },



  sr: { id: "sr", icon: "📘", name: "中级培训券", kind: "worker", tier: "senior", cost: 3500, cap: 5, color: "#59d98c",



    desc: "资深员工技能 +1，最多到 5" },



  el: { id: "el", icon: "📙", name: "高级培训券", kind: "worker", tier: "elite", cost: 9000, cap: 6, color: "#ffc861",



    desc: "顶尖员工技能 +1，最多到 6" },



  // —— 增益 / 保护 类 ——
  boost: { id: "boost", icon: "🚀", name: "订单加速器", kind: "compute", color: "#ff9bd0",
    cost: 3200, unlockDay: 12,
    desc: "在手订单进度全部 +15%" },
  shield: { id: "shield", icon: "🛡️", name: "逾期免罚券", kind: "compute", color: "#8fe3ff",
    cost: 2200, unlockDay: 18,
    desc: "下一次订单逾期不扣钱（自动消耗）" },
  invite: { id: "invite", icon: "📨", name: "客户介绍信", kind: "compute", color: "#ffc861",
    cost: 3800, unlockDay: 22,
    desc: "立刻来一张新订单" },
  tea: { id: "tea", icon: "🍰", name: "下午茶", kind: "compute", color: "#ffb3c7",
    cost: 1600, unlockDay: 9,
    desc: "全体主管心情 +10" },
  supply: { id: "supply", icon: "💊", name: "体能补给", kind: "compute", color: "#7de38f",
    cost: 1400, unlockDay: 9,
    desc: "全体组员体力 +22" },
  cap: { id: "cap", icon: "⚡", name: "算力包", kind: "compute", color: "#7de3ff",
    cost: 2500, unlockDay: 15,
    desc: "立即 +30 算力，可囤着大批出动员工时用" },
  capmax: { id: "capmax", icon: "🔋", name: "算力上限扩容", kind: "compute", color: "#8fe3ff",
    cost: 9000, unlockDay: 50,
    desc: "算力上限永久 +50，能存住更多算力" },
  mobil: { id: "mobil", icon: "📢", name: "动员令", kind: "compute", color: "#ffc861",
    cost: 4500, unlockDay: 30,
    desc: "今日免费算力额度 +8，当天可以放开派人" },
  brk: { id: "brk", icon: "💎", name: "突破券", kind: "any", color: "#ff7bd0",



    desc: "给主管或任意员工用：无视档次上限 +1（最高 8），只能靠自主研发获得" },



};







function workerTier(w) { return w.tier || "junior"; }



function supCap() { return 5 + (G.bought.sup || 0); }



function supCost() { return Math.round(ITEMS.sup.base * Math.pow(ITEMS.sup.growth, G.bought.sup || 0)); }



function brkCost() { return Math.round(12000 * Math.pow(1.5, G.bought.brk || 0)); }







function bagOf(id) { const e = (G.bag || []).find(x => x.id === id); return e ? e.n : 0; }



function addBag(id, cnt) {



  G.bag = G.bag || [];



  const e = G.bag.find(x => x.id === id);



  if (e) e.n += (cnt || 1); else G.bag.push({ id: id, n: cnt || 1 });



}



function takeBag(id) {



  const e = (G.bag || []).find(x => x.id === id);



  if (!e || e.n <= 0) return false;



  e.n -= 1;



  G.bag = G.bag.filter(x => x.n > 0);



  return true;



}







/* 有 3 个以上顶尖员工的部门 → 可自主研发 */



function brkTeams() {



  return G.staff.filter(s => G.workers.filter(w => w.aiId === s.id && workerTier(w) === "elite").length >= 3);



}







function buyItem(id) {



  const it = ITEMS[id];
  



  if (!it) return;



  let cost = 0;



  if (id === "sup") cost = supCost();



  else if (id === "brk") cost = brkCost();



  else cost = it.cost;



  if (G.cash < cost) { toast(`资金不足：要 ¥${cost}，当前 ¥${Math.round(G.cash)}`, "bad"); return; }



  showConfirm(



    `买一张「${it.name}」？`,



    `${it.desc}<br>花费 <b style="color:#ffc861">¥${cost}</b>，买完剩 <b>¥${Math.round(G.cash - cost)}</b>。<br>` +



    `<span style="color:#8ea3c9;font-size:12px">买到的道具会放进背包，用的时候再选人。</span>`,



    () => doBuy(id, cost),



    `买下 ¥${cost}`



  );



}







function doBuy(id, cost) {



  if (G.cash < cost) { toast(`资金不足：要 ¥${cost}，当前 ¥${Math.round(G.cash)}`, "bad"); return; }



  const it = ITEMS[id];



  G.cash -= cost;



  G.bought[id] = (G.bought[id] || 0) + 1;



  addBag(id, 1);



  log(`🛒 买了「${it.name}」（¥${cost}）`);



  if (window.SFX) SFX.coin();
  toast(`买到「${it.name}」，已放进背包`, "");



  save(); renderHR();



}







function renderShop() {



  const sup = $("shopSup");



  if (sup) {



    const cost = supCost();



    sup.innerHTML = `<div class="icard" onclick="buyItem('sup')">



      <div class="ic-icon">${ITEMS.sup.icon}</div>



      <div class="ic-main">



        <div class="ic-name" style="color:${ITEMS.sup.color}">${ITEMS.sup.name}</div>



        <div class="ic-desc">${ITEMS.sup.desc}</div>







      </div>



      <div class="ic-price ${G.cash >= cost ? "" : "cant"}">¥${cost}</div>



    </div>`;



  }



  const cp = $("shopCompute");
  if (cp) {
    cp.innerHTML = ["tea", "supply", "boost", "shield", "invite", "cap", "capmax", "mobil"].filter((id) => ITEMS[id] && isItemUnlocked(ITEMS[id])).map((id) => {
      const it = ITEMS[id];
      if (!it) return "";
      const price = it.cost;
      return `<div class="icard" onclick="buyItem('${id}')">
        <div class="ic-icon">${it.icon}</div>
        <div class="ic-main">
          <div class="ic-name" style="color:${it.color}">${it.name}</div>
          <div class="ic-desc">${it.desc}</div>
        </div>
        <div class="ic-price ${G.cash >= price ? "" : "cant"}">¥${price}</div>
      </div>`;
    }).join("");
    if (!cp.innerHTML) {
      cp.innerHTML = `<div style="padding:10px 4px;font-size:12px;color:#7f93b8">还没有解锁增益道具，继续经营吧～</div>`;
    }
  }

  const wk = $("shopWorker");



  if (wk) {



    wk.innerHTML = ["jr", "sr", "el"].map(id => {



      const it = ITEMS[id];



      const afford = G.cash >= it.cost;



      return `<div class="icard" onclick="buyItem('${id}')">



        <div class="ic-icon">${it.icon}</div>



        <div class="ic-main">



          <div class="ic-name" style="color:${it.color}">${it.name}</div>



          <div class="ic-desc">${it.desc}</div>



        </div>



        <div class="ic-price ${afford ? "" : "cant"}">¥${it.cost}</div>



      </div>`;



    }).join("");



  }



  const teams = brkTeams();



  const sec = $("shopBrkSec"), box = $("shopBrk");



  if (sec) sec.style.display = teams.length ? "" : "none";



  if (box) {



    box.innerHTML = teams.map(s => {



      const cost = brkCost();



      return `<div class="icard" onclick="buyItem('brk')">



        <div class="ic-icon">${ITEMS.brk.icon}</div>



        <div class="ic-main">



          <div class="ic-name" style="color:${ITEMS.brk.color}">${s.name} 组 · 自主研发</div>



          <div class="ic-desc">${s.name} 旗下有 ${G.workers.filter(w => w.aiId === s.id && workerTier(w) === "elite").length} 名顶尖员工</div>



          <div class="ic-desc">产出 1 张「突破券」，已研发 ${G.bought.brk || 0} 张</div>



        </div>



        <div class="ic-price ${G.cash >= cost ? "" : "cant"}">¥${cost}</div>



      </div>`;



    }).join("");



  }



}







function renderBag() {



  const box = $("bagList");



  if (!box) return;



  const items = (G.bag || []).filter(x => x.n > 0);



  if (!items.length) {



    box.innerHTML = `<div class="bag-empty">背包是空的，去「商店」看看</div>`;



    return;



  }



  box.innerHTML = items.map(e => {



    const it = ITEMS[e.id];



    if (!it) return "";



    return `<div class="icard" onclick="useItem('${e.id}')">



      <div class="ic-icon">${it.icon}</div>



      <div class="ic-main">



        <div class="ic-name" style="color:${it.color}">${it.name} <span class="ic-n">×${e.n}</span></div>



        <div class="ic-desc">${it.desc}</div>



      </div>



      <div class="ic-price use">使用</div>



    </div>`;



  }).join("");



}







/* --- 使用道具：先选人，再选技能 --- */



function useItem(id) {



  const it = ITEMS[id];



  if (!it || bagOf(id) <= 0) return;



  // 算力 / 增益类道具：点一下直接生效，不需要选人
  if (it.kind === "compute") {
    if (!takeBag(id)) { toast("背包里没有这个道具了", "bad"); return; }
    if (id === "cap") {
      G.compute = Math.min(CFG.maxCompute, G.compute + 30);
      toast(`算力 +30 → ${Math.round(G.compute)}`, "");
    } else if (id === "capmax") {
      CFG.maxCompute = (CFG.maxCompute || 999) + 50;
      toast(`算力上限 → ${CFG.maxCompute}`, "");
    } else if (id === "mobil") {
      G.quotaBoost = (G.quotaBoost || 0) + 8;
      toast("今日免费额度 +8", "");
    } else if (id === "boost") {
      let cnt = 0;
      G.orders.forEach((o) => {
        const pg = o.progress || 0;
        if (pg > 0 && pg < 100) { o.progress = Math.min(100, pg + 15); cnt++; }
      });
      toast(cnt ? `${cnt} 张单进度 +15%` : "没有进行中的订单", cnt ? "" : "warn");
    } else if (id === "shield") {
      G.shield = (G.shield || 0) + 1;
      toast(`逾期免罚 ${G.shield} 次`, "");
    } else if (id === "invite") {
      if (typeof spawnOrder === "function") spawnOrder();
      toast("来了一张新订单", "");
    } else if (id === "tea") {
      G.staff.forEach((s) => { s.mood = clamp(s.mood + 10); });
      toast("全体主管心情 +10", "");
    } else if (id === "supply") {
      G.workers.forEach((w) => { w.stamina = Math.min(100, w.stamina + 22); });
      toast("全体组员体力 +22", "");
    }
    log(`⚡ 使用了「${it.name}」`);
    save(); renderAll();
    try { renderBag(); } catch (e) {}
    try { renderBagPage(); } catch (e) {}
    return;
  }



  let list = [];



  if (it.kind === "sup" || it.kind === "any") {



    list = list.concat(G.staff.map(s => ({ kind: "staff", obj: s, label: s.name + "（主管）", sub: "上限 " + supCap() })));



  }



  if (it.kind === "worker") {



    list = G.workers.filter(w => workerTier(w) === it.tier)



      .map(w => ({ kind: "worker", obj: w, label: w.name, sub: "上限 " + it.cap }));



  } else if (it.kind === "any") {



    list = list.concat(G.workers.map(w => ({ kind: "worker", obj: w, label: w.name, sub: "上限 8" })));



  }



  if (!list.length) { toast("没有可以对应用的人（先去招人）", "warn"); return; }



  const html = `<div class="picklist">` + list.map(t =>



    `<button class="pickrow" onclick="pickItemSkill('${id}', '${t.kind}', '${t.obj.id}')">${t.label} <em>${t.sub}</em></button>`



  ).join("") + `</div>`;



  showModal(`${it.icon} ${it.name} · 给谁用？`, html, [{ label: "取消", fn: null }]);



}







function pickItemSkill(id, kind, targetId) {



  const it = ITEMS[id];



  const obj = kind === "staff" ? G.staff.find(s => s.id === targetId) : G.workers.find(w => w.id === targetId);



  if (!obj) return;



  const capNow = kind === "staff" ? supCap() : (it.kind === "any" ? 8 : it.cap);



  const html = `<div class="picklist">` + Object.keys(CFG.types).map(k => {



    const cur = obj.skills[k] || 0;



    const full = cur >= capNow;



    return `<button class="pickrow${full ? " cant" : ""}" onclick="${full ? "" : `applyItem('${id}', '${kind}', '${targetId}', '${k}')`}">` +



      `${CFG.types[k].name} <em>${cur} / ${capNow}${full ? " 已满" : ""}</em></button>`;



  }).join("") + `</div>`;



  showModal(`${it.icon} ${it.name} · ${obj.name}`, html, [{ label: "取消", fn: null }]);



}







function applyItem(id, kind, targetId, k) {



  const it = ITEMS[id];



  const capNow = kind === "staff" ? supCap() : (it.kind === "any" ? 8 : it.cap);



  const obj = kind === "staff" ? G.staff.find(s => s.id === targetId) : G.workers.find(w => w.id === targetId);



  if (!obj) return;



  const cur = obj.skills[k] || 0;



  if (cur >= capNow) { toast("这项已经到上限了", "warn"); return; }



  showConfirm(



    `用「${it.name}」？`,



    `${obj.name} 的 <b>${CFG.types[k].name}</b> 从 <b>${cur}</b> 提升到 <b style="color:#59d98c">${cur + 1}</b>（上限 ${capNow}）<br>` +



    `<span style="color:#8ea3c9;font-size:12px">道具用掉就没了，选错不能退回。</span>`,



    () => doApplyItem(id, obj, k),



    "确定使用"



  );



}







function doApplyItem(id, obj, k) {



  if (!takeBag(id)) { toast("背包里没有这个道具了", "bad"); return; }



  obj.skills[k] = (obj.skills[k] || 0) + 1;



  log(`✨ ${obj.name} 的「${CFG.types[k].name}」提升到 ${obj.skills[k]}`);



  toast(`${obj.name} 的${CFG.types[k].name} +1 → ${obj.skills[k]}`, "");



  $("modal").classList.remove("on");



  save(); renderAll(); renderHR();
  try { renderBag(); } catch (e) {}
  try { renderBagPage(); } catch (e) {}



}







function renderHR() {



  const stat = $("hrStat");



  if (stat) stat.innerHTML = `当前资金 <b>¥${Math.round(G.cash)}</b> · 历史最高 <b>¥${Math.round(peakCash())}</b>`;







  const tiers = $("rpTiers");



  if (tiers) {



    tiers.innerHTML = CFG.recruitTiers.map(t => {



      const ok = tierUnlocked(t);



      const afford = G.cash >= t.cost;



      const sel = pickTier === t.id ? " sel" : "";



      const lock = ok ? (afford ? "" : " cant") : " locked";



      return `<div class="rtier${sel}${lock}" onclick="${ok ? `selectTier('${t.id}')` : `toast('需要历史最高 ¥${t.needPeak} 才解锁「${t.name}」','bad')`}">



        <div class="rt-name" style="color:${t.color}">${t.name}</div>



        <div class="rt-cost">¥${t.cost}</div>



        <div class="rt-skill">技能 ${t.lo}-${t.hi}</div>



        <div class="rt-req">${ok ? "已解锁" : "需历史最高 ¥" + t.needPeak}</div>



      </div>`;



    }).join("");



  }







  const depts = $("rpDepts");



  if (depts) {



    const t = CFG.recruitTiers.find(x => x.id === pickTier);



    depts.innerHTML = G.staff.map(ai => {



      const cnt = G.workers.filter(w => w.aiId === ai.id).length;



      const busy = G.workers.filter(w => w.aiId === ai.id && w.busy).length;



      const can = t && tierUnlocked(t) && G.cash >= t.cost;



      return `<div class="rdept${can ? " can" : ""}" onclick="${can ? `hireTo('${ai.id}')` : `toast('${t ? "资金不够或档次未解锁" : "先在上面选一个档次"}','warn')`}">



        <img src="${ai.portrait}" alt="">



        <div class="rd-name">${ai.name}</div>



        <div class="rd-cnt">${cnt} 人${busy ? " · " + busy + " 在忙" : ""}</div>



      </div>`;



    }).join("");



  }







  const foot = $("rpFoot");



  if (foot) {



    const t = CFG.recruitTiers.find(x => x.id === pickTier);



    foot.innerHTML = t



      ? `已选 <b style="color:${t.color}">${t.name}</b>（¥${t.cost}，技能 ${t.lo}-${t.hi}）— 点上面的部门把人招进去`



      : `先选一个档次，再点部门把人招进去。招募会立即扣钱，新员工从明天开始算工资。`;



  }



  renderShop();











  const list = $("staffList");



  if (list) {



    list.innerHTML = G.staff.map(ai => {



      const team = G.workers.filter(w => w.aiId === ai.id);



      const rows = team.map((w, i) => {



        const st = Math.round(w.stamina);



        const jo = w.busy ? G.orders.find(o => o.id === w.busy) : null;



        const price = sellPrice(w);



        const sk = Object.keys(w.skills).map(k =>



          `<span class="skchip">${CFG.types[k].name}<b>${w.skills[k]}</b></span>`).join("");



        return `<div class="srowwrap">



          <div class="srow">



            <span class="sidx">${i + 1}</span>



            <span class="sname">${w.name}</span>



            <span class="wbar"><i style="width:${st}%"></i></span>



            <span class="sstate">${w.mustRest ? "😵 强制休息" : (jo ? "在做「" + jo.title + "」" : "空闲")}</span>



            <span class="sprice">¥${price}</span>



            <button class="sbtn coffee" onclick="coffeeWorker('${w.id}')" ${st >= 100 ? "disabled" : ""}>☕</button>



            <button class="sbtn" onclick="sellWorker('${w.id}')" ${w.busy ? "disabled" : ""}>卖掉</button>



          </div>



          <div class="sskills">${sk}</div>



        </div>`;



      }).join("");



      return `<div class="scard">



        <div class="scard-h"><img src="${ai.portrait}" alt=""><b>${ai.name}</b><span>${team.length} 人</span></div>



        ${rows || '<div class="sempty">这个部门还没人</div>'}



      </div>`;



    }).join("");



  }



}







function selectTier(id) {



  pickTier = (pickTier === id) ? null : id;



  renderHR();



}







function hireTo(aiId) {



  const t = CFG.recruitTiers.find(x => x.id === pickTier);



  const ai = G.staff.find(s => s.id === aiId);



  if (!t || !ai) return;



  if (!tierUnlocked(t)) { toast(`「${t.name}」还没解锁`, "bad"); return; }



  if (G.cash < t.cost) { toast(`资金不足：要 ¥${t.cost}，当前 ¥${Math.round(G.cash)}`, "bad"); return; }







  const cnt = G.workers.filter(w => w.aiId === ai.id).length;



  const after = Math.round(G.cash - t.cost);



  showConfirm(



    `确定招募到 ${ai.name} 旗下？`,



    `档次：<b style="color:${t.color}">${t.name}</b>（技能 ${t.lo}-${t.hi}）<br>` +



    `花费 <b style="color:#ffc861">¥${t.cost}</b>，完成后剩余 <b>¥${after}</b>。<br>` +



    `<span style="color:#8ea3c9;font-size:12px">${ai.name} 现有 ${cnt} 人 → ${cnt + 1} 人，每天多付 ¥${t.id === "elite" ? 150 : (t.id === "senior" ? 60 : CFG.workerWage)} 工资。</span>`,



    () => doHire(aiId, t, ai),



    `确定招到 ${ai.name}`



  );



}







function doHire(aiId, t, ai) {



  if (G.cash < t.cost) { toast(`资金不足：要 ¥${t.cost}，当前 ¥${Math.round(G.cash)}`, "bad"); return; }



  G.cash -= t.cost;



  const w = makeWorker(ai, t);



  w.paid = t.cost;          // 记下招募成本，卖价以它为上限



  G.workers.push(w);



  log(`🎓 ${ai.name} 招到 ${w.name}（${t.name}）`);



  toast(`${w.name} 加入 ${ai.name}（${t.name}，日薪 ¥${w.wage}）`, "");
  renderAll();



  renderHR();



}







/* =========================================================



   存档系统：手动存档位 + 导出/导入文件



   ========================================================= */



function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }



function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }







function saveMeta() {



  const d = new Date();



  const p = n => (n < 10 ? "0" + n : "" + n);



  return {



    day: G.day,



    cash: Math.round(G.cash),



    time: (d.getMonth() + 1) + "/" + d.getDate() + " " + p(d.getHours()) + ":" + p(d.getMinutes()),



  };



}







function slotInfo(i) {



  const raw = safeGet("aicompany_slot_" + i);



  if (!raw) return null;



  try {



    const o = JSON.parse(raw);



    return o && o.meta ? o.meta : null;



  } catch (e) { return null; }



}







/* 点一下就存（给不熟悉存档位的朋友用） */



function quickSave() {



  save();                                   // 写进自动存档



  const ok = safeSet("aicompany_quick", JSON.stringify({ meta: saveMeta(), g: G }));



  const b = $("btnQuickSave");



  if (b) {



    b.classList.add("saved");



    b.textContent = "✓ 已保存";



    clearTimeout(b._t);



    b._t = setTimeout(() => { b.classList.remove("saved"); b.textContent = "💾 保存"; }, 1500);



  }



  toast(ok ? `已保存 · 第 ${G.day} 天，下次打开接着玩` : "保存失败：浏览器存储不可用", ok ? "" : "bad");



}







function openSavePanel() {



  const rows = [1, 2, 3].map(i => {



    const m = slotInfo(i);



    const desc = m ? `${m.diffName || "标准"} · 第 ${m.day} 天 · ¥${m.cash} · ${m.time}` : "空";



    return `<div class="slot">



      <div class="si"><b>存档位 ${i}</b><span>${desc}</span></div>



      <div class="sa">



        <button onclick="saveSlot(${i})">保存</button>



        <button onclick="loadSlot(${i})" ${m ? "" : "disabled"}>读取</button>



        <button onclick="delSlot(${i})" ${m ? "" : "disabled"}>删除</button>



      </div>



    </div>`;



  }).join("");







  const auto = safeGet(SAVE_KEY) ? "有" : "无";



  showModal("存档", `



    <div class="slots">${rows}</div>



    <div class="io">



      <button onclick="exportSave()">⬇ 导出存档文件</button>



      <button onclick="importSave()">⬆ 导入存档文件</button>



    </div>



    <p style="font-size:11.5px;color:#8ea3c9;margin-top:12px;line-height:1.7">



      当前进度也会<b>自动存档</b>（${auto}）：关掉浏览器再打开会从上次的位置继续。<br>



      手动存档位可以留三个不同的进度；导出文件能换电脑或备份到别的地方。



    </p>`);



}







function saveSlot(i) {



  const ok = safeSet("aicompany_slot_" + i, JSON.stringify({ meta: saveMeta(), g: G }));



  toast(ok ? `已保存到存档位 ${i}` : "保存失败：浏览器存储不可用", ok ? "" : "bad");



  if (ok) openSavePanel();



}







function loadSlot(i) {



  const raw = safeGet("aicompany_slot_" + i);



  if (!raw) return;



  try {



    const o = JSON.parse(raw);



    if (!o.g || !Array.isArray(o.g.workers)) throw new Error("bad");



    G = o.g;
    // 恢复这一档的难度，绝不能拿别的难度的数据套本级评级
    const _did = G.diffId || (o.meta && o.meta.diffId) || "normal";
    const _d = CFG.difficulties.find((x) => x.id === _did);
    if (_d) CFG.diff = _d;



    save();



    renderAll();



    const el = $("modal");



    if (el) el.classList.remove("on");



    toast(`已读取存档位 ${i}（第 ${G.day} 天）`, "");



  } catch (e) {



    toast("读取失败：存档损坏", "bad");



  }



}







function delSlot(i) {



  showConfirm("删除存档位 " + i + "？", "删了就找不回来了。", () => {



    try { localStorage.removeItem("aicompany_slot_" + i); } catch (e) {}



    openSavePanel();



  }, "删除");



}







function exportSave() {



  try {



    const data = JSON.stringify({ meta: saveMeta(), g: G }, null, 1);



    const blob = new Blob([data], { type: "application/json" });



    const a = document.createElement("a");



    a.href = URL.createObjectURL(blob);



    a.download = "AI公司大作战_第" + G.day + "天.json";



    document.body.appendChild(a);



    a.click();



    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1200);



    toast("已导出存档文件", "");



  } catch (e) {



    toast("导出失败：" + e.message, "bad");



  }



}







function importSave() {



  const el = $("importFile");



  if (!el) return;



  el.value = "";



  el.click();



}







function onImportFile(el) {



  const f = el.files && el.files[0];



  if (!f) return;



  const r = new FileReader();



  r.onload = () => {



    try {



      const d = JSON.parse(r.result);



      const g = d.g || d;



      if (!g || !Array.isArray(g.staff) || !Array.isArray(g.workers)) throw new Error("格式不对");



      G = g;



      save();



      renderAll();



      const m = $("modal");



      if (m) m.classList.remove("on");



      toast(`已导入存档（第 ${G.day} 天）`, "");



    } catch (e) {



      toast("导入失败：不是这个游戏的存档文件", "bad");



    }



  };



  r.readAsText(f);



}







/* =========================================================



   新手引导



   ========================================================= */



const INTRO_STEPS = [



  {



    t: "欢迎，CEO",



    b: `



      <div class="li"><span class="ic">🏢</span><span>你接手一家 AI 公司：<b>5 个 AI 主管</b> + <b>11 名下属</b>。<span class="sub">Claude / DeepSeek / Gemini / Grok / ChatGPT，各自擅长不同领域</span></span></div>



      <div class="li"><span class="ic">🎯</span><span>目标：<b>撑过 100 天</b>，看你把公司带成什么样。</span></div>



      <div class="li"><span class="ic">💀</span><span>失败条件：<em>资金变负</em> · <em>全员心情崩盘</em> · <em>口碑跌穿</em></span></div>`,



  },



  {



    t: "核心循环只有三步",



    b: `



      <div class="li"><span class="ic">1️⃣</span><span><b>点左边的一张订单</b>，把它选中。<span class="sub">卡片上写着：需要多少人、多久交、给多少钱</span></span></div>



      <div class="li"><span class="ic">2️⃣</span><span><b>选人派活</b>：点 AI 卡让主管自动挑人，或展开员工列表自己点。<span class="sub">一个项目可以多人一起做，人越多干得越快</span></span></div>



      <div class="li"><span class="ic">3️⃣</span><span><b>点右下角「结束今天」</b>，结算 → 进入下一天。<span class="sub">天天都要点，不点就不会推进</span></span></div>



      <div class="li"><span class="ic">↩️</span><span>派错了？订单卡上点「撤回」，算力全额退回。</span></div>`,



  },



  {



    t: "人比钱难养",



    b: `



      <div class="li"><span class="ic">💚</span><span>AI 主管有三条：<b>心情 / 疲劳 / 信任</b>。<span class="sub">点 AI 卡就能看到，右侧还能咖啡、休息、谈话、加薪</span></span></div>



      <div class="li"><span class="ic">🔋</span><span>下属有<b>体力</b>。干活 -14，空闲 +18，低于 20 会 <em>强制休息一天</em>。<span class="sub">别把人当永动机，轮着上</span></span></div>



      <div class="li"><span class="ic">🎯</span><span><b>对口的人干对口的活</b>：产出更高，主管心情还会涨；错配会掉心情。</span></div>



      <div class="li"><span class="ic">😤</span><span>同一个主管连续上阵，疲劳代价会<b>越来越高</b>（最高 +36/天）。</span></div>`,



  },



  {



    t: "五个资源，一个坑",



    b: `



      <div class="li"><span class="ic">💰</span><span><b>资金</b> — 每天固定扣工资和房租，不接单就是在烧钱。</span></div>



      <div class="li"><span class="ic">⚡</span><span><b>算力</b> — 派一个人花 2 点。<em>每天只有 6 点免费</em>，超了要花钱，越超越贵。</span></div>



      <div class="li"><span class="ic">🌟</span><span><b>口碑</b> — 按时交付涨，超时赔钱掉。口碑低会少订单。</span></div>



      <div class="li"><span class="ic">🔥</span><span><b>士气 / 投资人信心</b> — 低了会连锁崩盘，每 7 天考核一次。</span></div>`,



  },



  {







    t: "算力超载怎么算",



    b: `



      <div class="li"><span class="ic">⚡</span><span>每天有 <b>${CFG.freeCompute} 点免费算力</b>（派一人花 ${CFG.workerCompute} 点），超出部分要花钱。</span></div>



      <div class="li"><span class="ic">📈</span><span>超载费 = <b>${CFG.overFeeBase} × 超出点数<sup>${CFG.overFeeExp}</sup></b>，越超越贵。</span></div>



      <div class="li"><span class="ic">🚀</span><span>但超载会进入<b>超频状态</b>：全队产出 +${Math.round(CFG.overBonusPerPt * 100)}%/点（上限 +${Math.round(CFG.overBonusMax * 100)}%）。</span></div>



      <div class="li"><span class="ic">📖</span><span><button style="padding:2px 12px;border-radius:6px;font-size:11.5px" onclick="showOverloadHelp(null)">查看完整对照表</button></span></div>`,



  },



  {



    t: "怎么变强",



    b: `



      <div class="li"><span class="ic">🏢</span><span>右侧 <b>「管理中心」</b>：招聘新人 · 管理人员 · 买道具。</span></div>



      <div class="li"><span class="ic">🎒</span><span>右侧 <b>「背包」</b>：用培训券给员工升技能，用进阶券给主管升技能。</span></div>



      <div class="li"><span class="ic">💎</span><span>某个主管手下凑齐 <b>3 名顶尖员工</b>，就能自主研发「突破券」，突破属性上限。</span></div>



      <div class="li"><span class="ic">🧠</span><span>钱紧的时候让 <b>主管亲自上</b>——产出约 1.6 倍，但烧疲劳。</span></div>`,



  },



  {



    t: "开始吧",



    b: `



      <div class="li"><span class="ic">🆘</span><span>忘了怎么玩？右上角 <em>「? 玩法」</em> 随时重看。</span></div>



      <div class="li"><span class="ic">📋</span><span>前 3 天右侧会有 <b>「今天要做的」清单</b>，照着做就行。</span></div>



      <div class="li"><span class="ic">💡</span><span>小建议：先让每个人做擅长的事，钱够就升技能，别急着招一堆人——工资是每天扣的。</span></div>



      <div class="li"><span class="ic">🎨</span><span style="font-size:11.5px;color:#7f93b8">办公室家具素材来自 OpenGameArt 的 Isometric Office Furniture（CC-BY 授权）。</span></div>`,



  },



];







let introIdx = 0;



let firstRunPickDiff = false;   // 首次进入：引导结束后先选难度







function renderIntro() {



  const s = INTRO_STEPS[introIdx];



  const t = $("introTitle"), b = $("introBody"), d = $("introDots");



  const prev = $("introPrev"), next = $("introNext");



  if (t) t.textContent = s.t;



  if (b) b.innerHTML = s.b;



  if (d) d.innerHTML = INTRO_STEPS.map((_, i) => '<i class="' + (i === introIdx ? "on" : "") + '"></i>').join("");



  if (prev) prev.style.visibility = introIdx === 0 ? "hidden" : "visible";



  if (next) next.textContent = introIdx === INTRO_STEPS.length - 1 ? "开始游戏" : "下一步";



}







function openIntro() {



  introIdx = 0;



  renderIntro();



  const el = $("intro");



  if (el) el.classList.add("on");



}







function closeIntro() {



  const el = $("intro");



  if (el) el.classList.remove("on");



  try { localStorage.setItem("aicompany_intro_v1", "1"); } catch (e) {}



  if (firstRunPickDiff) { firstRunPickDiff = false; setTimeout(pickDifficulty, 260); return; }



  maybeStartGuide();



}







function introNext() {



  if (introIdx >= INTRO_STEPS.length - 1) { closeIntro(); return; }



  introIdx++;



  renderIntro();



}







function introPrev() {



  if (introIdx > 0) { introIdx--; renderIntro(); }



}







/* =========================================================



   资源悬停说明



   ========================================================= */



/* =========================================================



   交互式新手指引（高亮界面，跟着做）



   ========================================================= */



const GUIDE_STEPS = [
  {
    sel: "#orders",
    t: "① 先点一张订单",
    d: "左边是订单大厅。点任意一张卡片把它选中——选中的卡片会亮起来。",
    wait: "orderSelected",
  },
  {
    sel: ".sceneWrap",
    t: "② 点房间里主管的头像",
    d: "3D 办公室里每个玻璃房上飘着一个头像。点它会弹出这位主管的状态卡：心情、疲劳、信任、技能，组员名单也在里面。",
    wait: "orderAssigned",
  },
  {
    sel: "#btnEnd",
    t: "③ 点这里结束今天",
    d: "右下角按钮。会结算交付、发工资、扣房租，然后进入第 2 天。",
    wait: "dayEnded",
  },
  {
    sel: ".res",
    t: "④ 这排是公司的命脉",
    d: "资金 / 算力 / 口碑 / 士气 / 投资人信心。算力每天只有 6 点免费额度，昨天没干完的活会占掉今天的额度（后面会标红色 -N）。",
    wait: "next",
  },
  {
    sel: "#panel",
    t: "⑤ 主管的四个管理手段",
    d: "点主管后右侧能看到：咖啡（回心情）/ 休息一天（清疲劳）/ 谈话（涨信任）/ 加薪（涨日薪）。组员也能单独加薪和喝咖啡，价格按档次走。",
    wait: "next",
  },
  {
    sel: ".hrEntry",
    t: "⑥ 这里是成长的地方",
    d: "管理中心：招聘、管人、买道具。普通 / 资深 / 顶尖三档，招募价越高日薪越高，技能也越强，但要的算力也更多（2 / 3 / 4 点）。",
    wait: "next",
  },
  {
    sel: ".chip.cash",
    t: "⑦ 顶栏这根小条别忽略",
    d: "现金旁边那排小鲸鱼娘会随着钱变多一格格亮起来——颜色越亮说明离下一个评级越近。点它们能看大图。",
    wait: "next",
  },
  {
    sel: ".chip",
    t: "⑧ 第 5 天起会有意外",
    d: "结算之后可能突然弹出随机事件：停电、猫跑进来、客户投诉，也可能是免费算力、老客户回头。时间和频率完全不固定，猜不到。",
    wait: "next",
  },
  {
    sel: "#panel",
    t: "⑨ 第 9 天开始商店上货",
    d: "下午茶、体能补给、订单加速器、逾期免罚券……每隔几天解锁一个新道具，出现时顶部会弹「商店上新」提示。",
    wait: "next",
  },
  {
    sel: ".chip",
    t: "⑩ 目标：活满 100 天",
    d: "结束后按现金评级 S / A / B / C，低于保底线算破产。顶栏「📖 图鉴」能看全部 15 个结局和达成条件。",
    wait: "next",
  },
];







let guideIdx = -1;







function guideTarget(sel) {



  if (typeof document.querySelector !== "function") return null;



  try { return document.querySelector(sel); } catch (e) { return null; }



}







function guideLayout() {



  const step = GUIDE_STEPS[guideIdx];



  if (!step) return;



  const el = guideTarget(step.sel);



  const spot = $("gSpot"), tip = $("gTip");



  if (!el || !spot || !tip) return;







  const r = el.getBoundingClientRect();



  const pad = 6;



  spot.style.left = (r.left - pad) + "px";



  spot.style.top = (r.top - pad) + "px";



  spot.style.width = (r.width + pad * 2) + "px";



  spot.style.height = (r.height + pad * 2) + "px";







  const vw = window.innerWidth, vh = window.innerHeight;



  const tw = 300, th = tip.offsetHeight || 150;



  let left = r.left + r.width / 2 - tw / 2;



  left = Math.max(12, Math.min(left, vw - tw - 12));



  let top = r.bottom + pad + 12;



  if (top + th > vh - 12) top = r.top - pad - th - 12;



  if (top < 12) top = 12;



  tip.style.left = left + "px";



  tip.style.top = top + "px";



}







function showGuideStep(i) {



  guideIdx = i;



  const step = GUIDE_STEPS[i];



  const wrap = $("guide"), tip = $("gTip");



  if (!step || !wrap || !tip) return;



  wrap.classList.add("on");



  tip.innerHTML =



    '<div class="step">第 ' + (i + 1) + ' / ' + GUIDE_STEPS.length + ' 步</div>' +



    "<h4>" + step.t + "</h4>" +



    "<p>" + step.d + "</p>" +



    '<div class="acts">' +



      '<button onclick="endGuide()">跳过指引</button>' +



      (step.wait === "next"



        ? '<button class="primary" onclick="endGuide()">知道了</button>'



        : '<button class="primary" onclick="skipGuideStep()">我自己来</button>') +



    "</div>";



  guideLayout();



}







function startGuide() {



  if (typeof document.querySelector !== "function") return;



  guideIdx = 0;



  showGuideStep(0);



}







function skipGuideStep() {



  if (guideIdx >= GUIDE_STEPS.length - 1) { endGuide(); return; }



  showGuideStep(guideIdx + 1);



}







function guideAdvance(reason) {



  if (guideIdx < 0) return;



  const step = GUIDE_STEPS[guideIdx];



  if (!step || step.wait !== reason) return;



  if (guideIdx >= GUIDE_STEPS.length - 1) { endGuide(); return; }



  showGuideStep(guideIdx + 1);



}







function endGuide() {



  guideIdx = -1;



  const wrap = $("guide");



  if (wrap) wrap.classList.remove("on");



  try { localStorage.setItem("aicompany_guide_v1", "1"); } catch (e) {}



}







function maybeStartGuide() {



  try {



    if (localStorage.getItem("aicompany_guide_v1")) return;



  } catch (e) { return; }



  setTimeout(startGuide, 500);



}







const RES_TIPS = {



  day: {



    t: "第 N 天",



    d: "当前进度。撑到第 <b>100 天</b> 结束，按最终成绩给出结局。",



    g: "",



  },



  cash: {



    t: "资金 💰",



    d: "公司账上的现金。发工资、交房租、买咖啡都从这里扣，<b>一旦变负就破产</b>。",



    g: "完成订单收尾款（星级越高越多）· 偶尔有客户预付定金",



  },



  compute: {



    t: "算力 ⚡",



    d: "派单的燃料，订单星级越高消耗越多。没有算力就派不了新单。",



    g: "每天自动恢复 · 模型宕机事件会扣 15",



  },



  rep: {



    t: "口碑 📈",



    d: "客户对你的评价。影响订单数量和质量，<b>掉到 15 以下口碑崩盘，直接结束</b>。",



    g: "成功交付 +3 · 订单超时 -6 · 上热搜事件 +12",



  },



  morale: {



    t: "士气 🔥",



    d: "整个团队的平均心情。太低会让核心员工离职，也会影响最终结局走向。",



    g: "员工心情上涨就会跟着涨 · 长期压榨加班会掉",



  },



  investor: {



    t: "投资人信心 🏦",



    d: "每 <b>7 天</b> 考核一次，决定最后的结局是「行业龙头」还是「黑心公司」。",



    g: "钱多（>¥8000）且口碑好（>60）时 +8 · 钱少于 ¥1500 时 -10",



  },



};







function showResTip(key, el) {



  const info = RES_TIPS[key];



  const tip = $("tip");



  if (!info || !tip) return;



  tip.innerHTML =



    '<div class="t">' + info.t + "</div>" +



    "<div>" + info.d + "</div>" +



    (info.g ? '<div class="row">如何获得：<span class="k">' + info.g + "</span></div>" : "");



  tip.classList.add("on");



  const r = el.getBoundingClientRect();



  const vw = window.innerWidth, vh = window.innerHeight;



  let left = r.right - tip.offsetWidth;



  if (left < 8) left = 8;



  let top = r.bottom + 9;



  if (top + tip.offsetHeight > vh - 8) top = r.top - tip.offsetHeight - 9;



  tip.style.left = left + "px";



  tip.style.top = top + "px";



}







function hideResTip() {



  const tip = $("tip");



  if (tip) tip.classList.remove("on");



}







function bindResTips() {



  if (typeof document.querySelectorAll !== "function") return;



  document.querySelectorAll("[data-tip]").forEach(el => {



    el.addEventListener("mouseenter", () => showResTip(el.getAttribute("data-tip"), el));



    el.addEventListener("mousemove", () => showResTip(el.getAttribute("data-tip"), el));



    el.addEventListener("mouseleave", hideResTip);



  });



}



document.getElementById("btnEnd").onclick = endDay;



document.getElementById("btnHelp").onclick = openIntro;



document.getElementById("btnQuickSave").onclick = quickSave;



document.getElementById("btnSave").onclick = openSavePanel;



// 人事中心入口在右栏（内联 onclick="goHR()"）



bindResTips();



document.getElementById("introNext").onclick = introNext;



document.getElementById("introPrev").onclick = introPrev;



document.getElementById("introSkip").onclick = closeIntro;



const skinBtn = document.getElementById("btnSkin");



if (skinBtn) skinBtn.onclick = toggleSkin;







document.getElementById("btnRestart").onclick = () => {



  showConfirm("重开新局？", "当前进度会被清空，先选一个难度。", () => {



    pickDifficulty(true);



  }, "选难度");



};



if (document.addEventListener) {



  document.addEventListener("keydown", e => {



    if (e.key !== "Escape") return;



    if (document.body.classList.contains("hr-mode")) { goBack(); return; }



  if (document.body.classList.contains("bag-mode")) { goBackBag(); return; }



  if (document.body.classList.contains("hist-mode")) { goBackHistory(); return; }



  if (roomFocus) { closeRoom(); return; }



    var iv = document.getElementById("intro");



    if (iv && iv.classList.contains("on")) { closeIntro(); return; }



    if (selOrder) { selOrder = null; renderAll(); }



  });



}



document.getElementById("dayfx").onclick = () => {



  const b = document.getElementById("dayfx");



  b.classList.remove("on");



  clearTimeout(dayFxTimer);



};







/* 画风切换 */



/* 云朵转场：遮住 → 干活 → 散开 */
let _cloudBusy = false;
function cloudTransition(work, tipText, done) {
  const veil = document.getElementById("cloudVeil");
  const tip = document.getElementById("cloudTip");
  if (!veil) { try { work && work(); } catch (e) {} done && done(); return; }
  if (_cloudBusy) return;
  _cloudBusy = true;
  if (tip && tipText) tip.textContent = tipText;
  try { if (typeof buildClouds === "function") buildClouds(); } catch (e) {}
  // 关键：先让浏览器把「云在屏幕外」这个初始状态真正绘制出来，
  // 下一帧再加 .on，过渡动画才会生效（同一帧内改会直接被合并掉）
  void veil.offsetWidth;                       // 强制回流
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      veil.classList.add("on");                // 云朵从两侧涌入
    });
  });
  setTimeout(function () {
    try { work && work(); } catch (e) { console.warn(e); }   // 后台干活
    setTimeout(function () {
      veil.classList.remove("on");             // 云朵散开
      setTimeout(function () { _cloudBusy = false; done && done(); }, 700);
    }, 950);                                   // 给布局留足稳定时间
  }, 1050);                                    // 等云全部飞到位、停稳
}

function applySkin(mode) {
  // 切皮肤时把 3D 的房间条和选中状态清掉，避免 2D 里还挂着「返回全景」
  try {
    const _rb = document.querySelector(".roomBar3d");
    if (_rb) _rb.remove();
    document.body.classList.remove("room-zoom");
    if (window.OFFICE3D && window.OFFICE3D.clearRoom) window.OFFICE3D.clearRoom();
  } catch (e) {}



  roomFocus = null;



  const scene = (mode === "scene");



  const cl = document.body && document.body.classList;



  if (cl) { if (scene) cl.add("scene"); else cl.remove("scene"); }



  const b = $("btnSkin");



  if (b) b.textContent = scene ? "🗂 卡片" : "🏢 场景";



  try { localStorage.setItem("aicompany_skin", scene ? "scene" : "cards"); } catch (e) {}



  try { renderOffice(); } catch (e) {}



}



function toggleSkin() {



  (function () {
    var _target = document.body.classList.contains("scene") ? "cards" : "scene";
    cloudTransition(function () {
      applySkin(_target);
    }, _target === "scene" ? "正在进入 3D 办公室…" : "正在切回卡片…");
  })();



}







if (!load()) {



  newGame();



  firstRunPickDiff = true;



}



else { renderAll(); log("读取上次存档。"); }







initSheetDrag();   // 手机端底部面板拖拽



try {



  if (typeof location !== "undefined" && location.hash.indexOf("#room=") === 0) {



    const rid = location.hash.slice(6);



    setTimeout(() => { if (G.staff.find(s => s.id === rid)) openRoom(rid); }, 400);



  }



} catch (e) {}







// 启动时使用最初的卡片版（想用 3D 场景点右上角按钮切换）



try { applySkin("scene"); } catch (e) {}



















try {



  var forceIntro = (typeof location !== "undefined") && location.hash === "#intro";



  var skipIntro = (typeof location !== "undefined") && (location.hash === "#go" || location.hash.indexOf("#room=") === 0);



  if (!skipIntro && (forceIntro || !localStorage.getItem("aicompany_intro_v1"))) openIntro();



} catch (e) {}







