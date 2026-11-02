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
function playAggressive(G) {
  for (const s of G.staff) if (s.mood < 55 && G.cash > 800) { try { api.doCoffee(s.id); } catch (e) {} }
  for (const s of G.staff) {
    const cnt = G.workers.filter(w => w.aiId === s.id).length;
    if (cnt < 8 && G.cash > 4000) {
      try { api.recruit(G.cash > 40000 ? "elite" : (G.cash > 15000 ? "senior" : "junior"), s.id); } catch (e) {}
    }
  }
  const open = (G.orders || []).filter(o => !o.assignedTo && (o.progress || 0) < 100)
    .sort((a, b) => (b.reward || 0) - (a.reward || 0));
  for (const o of open) {
    const cands = G.staff.filter(s => !s.working && !s.resting)
      .sort((a, b) => ((b.skills[o.type] || 0) - (a.skills[o.type] || 0)) || (b.mood - a.mood));
    if (!cands.length || G.compute < 3) break;
    try { api.assign(o.id, cands[0].id); } catch (e) {}
  }
}
function rank(diffId, cash) {
  const cfgs = {
    easy:   { S: 4600000, A: 2600000, B: 1300000, C: 500000 },
    normal: { S: 4100000, A: 2400000, B: 1000000, C: 420000 },
    hard:   { S: 2000000, A: 1100000, B: 450000,  C: 150000 },
  };
  const r = cfgs[diffId];
  return cash >= r.S ? "S" : cash >= r.A ? "A" : cash >= r.B ? "B" : cash >= r.C ? "C" : "D";
}
console.log("=== 激进玩法 × 各难度评级 ===");
console.log("难度     结束现金      评级    门槛(S/A/B/C)");
for (const diff of ["easy", "normal", "hard"]) {
  const runs = [];
  for (let i = 0; i < 5; i++) {
    api.newGame(diff);
    let G = api.get();
    for (let d = 1; d <= 100; d++) {
      G = api.get();
      if (G.finished) break;
      playAggressive(G);
      try { api.endDay(); } catch (e) { break; }
      if (G.finished) break;
    }
    runs.push(Math.round(api.get().cash));
  }
  runs.sort((a, b) => a - b);
  const mid = runs[Math.floor(runs.length / 2)];
  const cfgs = { easy: "460/260/130/50万", normal: "410/240/100/42万", hard: "200/110/45/15万" };
  console.log(diff.padEnd(7), String(mid).padStart(11), rank(diff, mid).padStart(6), "  ", cfgs[diff]);
}
