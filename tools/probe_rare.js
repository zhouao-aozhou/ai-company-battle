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
api.newGame("easy");
let G = api.get();
const claude = G.staff.find(s => s.id === "claude");
G.cash = 999999;
let gods = 0, greeds = 0, normal = 0;
for (let i = 0; i < 300; i++) {
  try { api.recruit("junior", "claude"); } catch (e) {}
}
G = api.get();
G.workers.forEach(w => {
  if (w.rare === "god") gods++;
  else if (w.rare === "greedy") greeds++;
  else normal++;
});
console.log("招募 300 人：");
console.log("  超神", gods, "人  (" + (gods / 3).toFixed(1) + "%)");
console.log("  老馋", greeds, "人  (" + (greeds / 3).toFixed(1) + "%)");
console.log("  普通", normal, "人");
const g = G.workers.find(w => w.rare === "god");
if (g) console.log("  超神样例:", g.name, JSON.stringify(g.skills), "体力" + g.stamina, "日薪" + g.wage);
const gr = G.workers.find(w => w.rare === "greedy");
if (gr) console.log("  老馋样例:", gr.name, JSON.stringify(gr.skills), "体力" + gr.stamina, "日薪" + gr.wage);
