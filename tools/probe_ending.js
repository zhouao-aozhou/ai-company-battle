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
function rankOf(diff, cash) {
  const r = { easy: {S:3300000,A:2000000,B:1200000,C:450000}, normal: {S:2700000,A:1700000,B:900000,C:350000}, hard: {S:1400000,A:800000,B:400000,C:120000} }[diff];
  return cash >= r.S ? "S" : cash >= r.A ? "A" : cash >= r.B ? "B" : cash >= r.C ? "C" : "D";
}
const E = {
  easy: { S:["传说级老板"], A:["人生赢家"], B:["小有所成"], C:["差不多得了"], D:["玩脱了"] },
  normal: { S:["商业神话"], A:["行业龙头"], B:["小有成就"], C:["站稳脚跟"], D:["勉强糊口"] },
  hard: { S:["血战到底"], A:["险中求胜"], B:["九死一生"], C:["苟延残喘"], D:["尸骨无存"] },
};
console.log("难度     现金        评级   结局标题");
const samples = [
  ["easy", 3400000], ["easy", 2100000], ["easy", 1300000], ["easy", 500000], ["easy", 100000],
  ["normal", 2800000], ["normal", 1750000], ["normal", 950000], ["normal", 400000], ["normal", 100000],
  ["hard", 1500000], ["hard", 850000], ["hard", 420000], ["hard", 130000], ["hard", 50000],
];
for (const [diff, cash] of samples) {
  const r = rankOf(diff, cash);
  console.log(diff.padEnd(7), String(cash).padStart(9), r.padStart(5), "  " + E[diff][r][0]);
}
