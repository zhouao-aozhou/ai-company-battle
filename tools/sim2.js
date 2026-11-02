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

/* 激进玩家：能接就接 + 有钱就招人 + 状态差就喝咖啡 */
function playAggressive(G) {
  // 状态管理：心情低就咖啡（80 一杯）
  for (const s of G.staff) {
    if (s.mood < 55 && G.cash > 800) {
      try { api.doCoffee(s.id); } catch (e) {}
    }
  }
  // 招募：现金充裕就招，最多每个部门 +1/天
  for (const s of G.staff) {
    const cnt = G.workers.filter(w => w.aiId === s.id).length;
    if (cnt < 8 && G.cash > 4000) {
      try { api.recruit(G.cash > 40000 ? "elite" : (G.cash > 15000 ? "senior" : "junior"), s.id); } catch (e) {}
    }
  }
  // 接单：能接就接
  const open = (G.orders || [])
    .filter(o => !o.assignedTo && (o.progress || 0) < 100)
    .sort((a, b) => (b.reward || 0) - (a.reward || 0));
  let n = 0;
  for (const o of open) {
    const cands = G.staff
      .filter(s => !s.working && !s.resting)
      .sort((a, b) => ((b.skills[o.type] || 0) - (a.skills[o.type] || 0)) || (b.mood - a.mood));
    if (!cands.length) break;
    if (G.compute < 3) break;
    try { api.assign(o.id, cands[0].id); n++; } catch (e) {}
  }
  return n;
}

function simulate(diff, days) {
  api.newGame(diff);
  let G = api.get();
  let peak = G.cash, low = G.cash, broke = 0, endDay = 0;
  for (let d = 1; d <= days; d++) {
    G = api.get();
    if (G.finished) { endDay = d; break; }
    playAggressive(G);
    try { api.endDay(); } catch (e) { break; }
    G = api.get();
    peak = Math.max(peak, G.cash);
    low = Math.min(low, G.cash);
    if (G.cash < 0 && !broke) broke = d;
    if (G.finished) { endDay = d; break; }
  }
  return { peak: Math.round(peak), low: Math.round(low), end: Math.round(api.get().cash),
           broke, endDay, workers: api.get().workers.length };
}

function median(a) { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; }

console.log("=== 激进玩法（疯狂接单 + 招人 + 咖啡）跑 100 天 ===");
console.log("难度     通关率   峰值(中位)    结束(中位)   谷底(中位)   平均人数");
for (const diff of ["easy", "normal", "hard"]) {
  const runs = [];
  for (let i = 0; i < 5; i++) runs.push(simulate(diff, 100));
  const done = runs.filter(r => r.endDay >= 100).length;
  console.log(
    diff.padEnd(7),
    (done + "/5").padStart(6),
    String(median(runs.map(r => r.peak))).padStart(11),
    String(median(runs.map(r => r.end))).padStart(12),
    String(median(runs.map(r => r.low))).padStart(12),
    String(median(runs.map(r => r.workers))).padStart(9)
  );
}
