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
let errors = [];
function guard(name, fn) {
  try { fn(); } catch (e) { errors.push(name + ": " + e.message); }
}

for (const diff of ["easy", "normal", "hard"]) {
  guard("newGame " + diff, () => api.newGame(diff));
  let G = api.get();
  for (let day = 1; day <= 40; day++) {
    G = api.get();
    if (G.finished) break;

    // 1) 接单（自动挑人派）
    guard(`D${day} assign`, () => {
      const open = G.orders.filter(o => !o.assignedTo && (o.progress || 0) < 100);
      for (const o of open) {
        const boss = G.staff.filter(s => !s.working && !s.resting)[0];
        if (!boss || G.compute < 3) break;
        api.assign(o.id, boss.id);
      }
    });

    // 2) 主管上阵
    guard(`D${day} pickLead`, () => {
      const o = G.orders.find(x => !x.assignedTo);
      const boss = G.staff.find(s => !s.working);
      if (o && boss) { api.setSel(o.id); api.pickLead(boss.id); }
    });

    // 3) 咖啡 / 谈话 / 加薪
    guard(`D${day} coffee`, () => api.doCoffee(G.staff[0].id));
    guard(`D${day} talk`, () => api.doTalk(G.staff[1].id));
    guard(`D${day} raise`, () => api.doRaise(G.staff[2].id));

    // 4) 撤回
    guard(`D${day} undo`, () => {
      const o = G.orders.find(x => x.crew && x.crew.length);
      if (o) api.undoOrder(o.id);
    });

    // 5) 招募 / 卖人
    guard(`D${day} recruit`, () => { G.cash = Math.max(G.cash, 50000); api.recruit("junior", "claude"); });
    guard(`D${day} sell`, () => {
      const w = G.workers.filter(x => !x.busy)[0];
      if (w && G.workers.length > 3) api.sellWorker(w.id);
    });

    // 6) 结束天
    guard(`D${day} endDay`, () => api.endDay());
    if (errors.length > 8) break;
  }
  console.log(diff + " 跑完 40 天，累计错误", errors.length);
}

console.log("\n=== 运行时错误 ===");
if (!errors.length) console.log("  无");
else errors.slice(0, 20).forEach(e => console.log("  ✗ " + e));
