// 逻辑测试：stub 掉 DOM，验证「AI + 小组 + 主管下场」的规则
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(process.argv[2], 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('找不到 <script>'); process.exit(1); }
let code = m[1];

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
  setTimeout() {}, clearTimeout() {},
  console, Math, JSON, Date, Number, Object, Array, String,
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);


const api = sandbox.__api;

/* 更像人的策略：每天最多接 2 单（避免自己把自己压死），优先高收益 */
function playDay(G, maxOrders) {
  const open = (G.orders || [])
    .filter(o => !o.assignedTo && (o.progress || 0) < 100)
    .sort((a, b) => (b.reward || 0) - (a.reward || 0));
  let assigned = 0;
  for (const o of open) {
    if (assigned >= maxOrders) break;
    const cands = G.staff
      .filter(s => !s.working && !s.resting)
      .sort((a, b) => ((b.skills[o.type] || 0) - (a.skills[o.type] || 0)) || (b.mood - a.mood));
    if (!cands.length) break;
    if (G.compute < 3) break;
    try { api.assign(o.id, cands[0].id); assigned++; } catch (e) {}
  }
  return assigned;
}

function simulate(diff, days, maxOrders) {
  api.newGame(diff);
  let G = api.get();
  let peak = G.cash, low = G.cash, broke = 0, endDay = 0, minDayCash = G.cash;
  for (let d = 1; d <= days; d++) {
    G = api.get();
    if (G.finished) { endDay = d; break; }
    playDay(G, maxOrders);
    try { api.endDay(); } catch (e) { break; }
    G = api.get();
    peak = Math.max(peak, G.cash);
    low = Math.min(low, G.cash);
    if (G.cash < 0 && !broke) broke = d;
    if (G.finished) { endDay = d; break; }
  }
  return { peak: Math.round(peak), low: Math.round(low), end: Math.round(api.get().cash), broke, endDay };
}

function median(arr) { const a = arr.slice().sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; }

console.log("=== 模拟：每天最多接 2 单，各难度跑 5 次 ===");
console.log("难度     通关率   结束现金(中位)   最低现金(中位)   平均破产日");
for (const diff of ["easy", "normal", "hard"]) {
  const runs = [];
  for (let i = 0; i < 5; i++) runs.push(simulate(diff, 100, 2));
  const done = runs.filter(r => r.endDay >= 100).length;
  const brokeDays = runs.filter(r => r.broke).map(r => r.broke);
  console.log(
    diff.padEnd(7),
    (done + "/5").padStart(6),
    String(median(runs.map(r => r.end))).padStart(14),
    String(median(runs.map(r => r.low))).padStart(15),
    String(brokeDays.length ? Math.round(brokeDays.reduce((a, b) => a + b, 0) / brokeDays.length) : "-").padStart(10)
  );
}
