// 逻辑测试：stub 掉 DOM，验证「AI + 小组 + 主管下场」的规则
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(process.argv[2], 'utf8');
const htmlPath2 = process.argv[2] || 'index.html';
const pathMod = require('path');
const htmlDir = pathMod.dirname(pathMod.resolve(htmlPath2));
const htmlRaw = fs.readFileSync(htmlPath2, 'utf8');
let code = '';
const srcs = [...htmlRaw.matchAll(/<script src="\.\/([^"]+)"[^>]*><\/script>/g)].map(x => x[1]);
if (srcs.length) {
  for (const rel of srcs) {
    const fp = pathMod.resolve(htmlDir, rel.split("?")[0]);
    if (rel.indexOf("sound.js") >= 0) continue;   // 音效模块依赖真实 DOM，测试时跳过
    if (fs.existsSync(fp)) code += '\n/* ==== ' + rel + ' ==== */\n' + fs.readFileSync(fp, 'utf8');
  }
}
if (!code.trim()) {
  const m2 = htmlRaw.match(/<script>([\s\S]*?)<\/script>/);
  if (!m2) { console.error('找不到 <script>'); process.exit(1); }
  code = m2[1];
}

code += `\n;globalThis.__api = {
  get: () => G,
  newGame, endDay, assign, pickWorker, pickLead, undoOrder, undoAssign,
  doCoffee, doRest, cancelRest, doTalk, doRaise, clearSelection,
  moodMult, energyMult, spawnOrder, toast, showDayTransition,
  unlockedTypes, starCap, ordersPerDay, recruit, sellWorker, peakCash,
  setSel: (id) => { selOrder = id; },
  panelTitle: () => ($('pTitle') || {}).textContent
};`;

function fakeEl() {
  return {
    innerHTML: '', textContent: '', style: {}, children: [], onclick: null,
    classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); }, toggle() {} },
    appendChild(c) { this.children.push(c); },
    remove() {},
    querySelector() { return fakeEl(); },
  };
}
const store = {};
const sandbox = {
  document: {
    addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; }, visibilityState: 'visible',
    body: { classList: { add() {}, remove() {}, contains() { return false; } } },
    getElementById(id) { return store[id] || (store[id] = fakeEl()); },
    createElement() { return fakeEl(); },
    querySelectorAll() { return []; },
  },
  localStorage: {
    _d: {},
    getItem(k) { return this._d[k] || null; },
    setItem(k, v) { this._d[k] = v; },
    removeItem(k) { delete this._d[k]; },
  },
  setTimeout() {}, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
  requestAnimationFrame() { return 0; }, cancelAnimationFrame() {},
  window: null,   // 下面指回 sandbox 自己
  navigator: { userAgent: "node" },
  AudioContext: null,
  performance: { now: () => Date.now() },
  console, Math, JSON, Date, Number, Object, Array, String,
};
sandbox.window = sandbox;
sandbox.addEventListener = function () {};
sandbox.removeEventListener = function () {};
sandbox.dispatchEvent = function () { return true; };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);


const api = sandbox.__api;

/* 模拟一个普通玩家：不打满、手点派单、偶尔犯懒 */
api.newGame("normal");
let G = api.get();

console.log("=========== 玩家视角：标准难度 ===========");
console.log(`开局：资金 ¥${Math.round(G.cash)} · 算力 ${G.compute} · 免费额度 6 · 员工 ${G.workers.length} 人`);
console.log(`5 个主管日薪合计 ¥${G.staff.reduce((a,s)=>a+s.wage,0)} + 房租 ¥120 = 每天固定支出 ¥${G.staff.reduce((a,s)=>a+s.wage,0)+120}`);
console.log("");

for (let day = 1; day <= 12; day++) {
  G = api.get();
  if (G.finished) { console.log("游戏结束"); break; }
  const cashBefore = Math.round(G.cash);
  const orders = G.orders.filter(o => !o.assignedTo && (o.progress||0) < 100);
  console.log(`— 第 ${day} 天 —  资金 ¥${cashBefore} · 算力 ${G.compute} · 免费额度 ${6 - (G.quotaPenalty||0)} · 在库订单 ${G.orders.length}`);

  // 只接 2 单（普通玩家不会接满）
  let assigned = 0;
  for (const o of orders.slice(0, 2)) {
    const boss = G.staff.filter(s => !s.working && !s.resting)
      .sort((a,b) => (b.skills[o.type]||0) - (a.skills[o.type]||0))[0];
    if (!boss) { console.log("    （没空闲主管了）"); break; }
    if (G.compute < 2) { console.log("    （算力不够了）"); break; }
    const reward = o.reward;
    const need = Math.max(1, o.stars, o.minCrew || 1);
    try {
      api.assign(o.id, boss.id);
      assigned++;
      console.log(`    接「${o.title}」(${o.stars}★ 需${need}人 ¥${reward}) → ${boss.name}`);
    } catch (e) { console.log("    接单失败:", e.message); }
  }
  if (!assigned) console.log("    （今天没接单）");

  api.endDay();
  G = api.get();
  const delta = Math.round(G.cash) - cashBefore;
  console.log(`    → 结束：资金 ¥${Math.round(G.cash)} (${delta >= 0 ? "+" : ""}${delta})`);
  if (G.finished) { console.log("    → 游戏结束"); break; }
  console.log("");
}
