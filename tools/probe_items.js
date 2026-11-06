// 逻辑测试：stub 掉 DOM，验证「AI + 小组 + 主管下场」的规则
const fs = require('fs');
const vm = require('vm');

const htmlPath = process.argv[2] || 'index.html';
const path = require('path');
const htmlDir = path.dirname(path.resolve(htmlPath));
let code = '';

// 优先读拆开后的 js 文件（按 index.html 里的引用顺序）
const htmlRaw = fs.readFileSync(htmlPath, 'utf8');
const srcs = [...htmlRaw.matchAll(/<script src="\.\/([^"]+)"[^>]*><\/script>/g)].map(m => m[1]);
if (srcs.length) {
  for (const rel of srcs) {
    const fp = path.resolve(htmlDir, rel);
    if (fs.existsSync(fp)) code += '\n/* ==== ' + rel + ' ==== */\n' + fs.readFileSync(fp, 'utf8');
  }
}
// 退回老方式：读内联 <script>
if (!code.trim()) {
  const m = htmlRaw.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) { console.error('找不到 <script>'); process.exit(1); }
  code = m[1];
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
api.newGame("normal");
let G = api.get();
G.cash = 999999;
G.day = 60;   // 解锁所有道具
console.log("=== 测试每个道具 ===");
const ids = ["tea","supply","boost","shield","invite","cap","capmax","mobil"];
// 先给每样加 1 个到背包（通过 addBag）
ids.forEach(id => { try { addBag(id, 1); } catch(e) { console.log("  addBag 失败 " + id + ": " + e.message); } });
console.log("背包:", (G.bag||[]).map(b => b.id + "×" + b.n).join(", "));
ids.forEach(id => {
  const before = { compute: api.get().compute, cash: api.get().cash, bag: (api.get().bag||[]).length };
  try { useItem(id); } catch (e) { console.log(`  ${id}: 报错 ${e.message}`); return; }
  const after = api.get();
  const stillInBag = (after.bag||[]).find(b => b.id === id);
  console.log(`  ${id}: 背包剩 ${stillInBag ? stillInBag.n : 0} | 算力 ${before.compute}→${Math.round(after.compute)} | 免罚 ${after.shield||0}`);
});
