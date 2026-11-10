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

/* 激进 + 会用道具的玩家 */
function playRich(G) {
  for (const s of G.staff) if (s.mood < 55 && G.cash > 800) { try { api.doCoffee(s.id); } catch (e) {} }
  for (const s of G.staff) {
    const cnt = G.workers.filter(w => w.aiId === s.id).length;
    if (cnt < 8 && G.cash > 4000) {
      try { api.recruit(G.cash > 40000 ? "elite" : (G.cash > 15000 ? "senior" : "junior"), s.id); } catch (e) {}
    }
  }
  // 算力不够就买算力包（第 15 天后）
  if (G.day >= 15 && G.compute < 10 && G.cash > 20000) {
    try { api.buyItem("cap"); } catch (e) {}
    try { api.useItem("cap"); } catch (e) {}
  }
  // 当天要打满就用动员令（第 30 天后）
  if (G.day >= 30 && G.cash > 60000 && !G.__mob) {
    try { api.buyItem("mobil"); api.useItem("mobil"); G.__mob = true; } catch (e) {}
  }
  const open = (G.orders || []).filter(o => !o.assignedTo && (o.progress || 0) < 100)
    .sort((a, b) => (b.reward || 0) - (a.reward || 0));
  for (const o of open) {
    const cands = G.staff.filter(s => !s.working && !s.resting)
      .sort((a, b) => ((b.skills[o.type] || 0) - (a.skills[o.type] || 0)) || (b.mood - a.mood));
    if (!cands.length || G.compute < 2) break;
    try { api.assign(o.id, cands[0].id); } catch (e) {}
  }
}

function run(diff, days) {
  api.newGame(diff);
  let G = api.get();
  let peak = G.cash, broke = 0;
  for (let d = 1; d <= days; d++) {
    G = api.get();
    if (G.finished) break;
    playRich(G);
    try { api.endDay(); } catch (e) { break; }
    G = api.get();
    peak = Math.max(peak, G.cash);
    if (G.cash < 0 && !broke) broke = d;
    if (G.finished) break;
  }
  return { end: Math.round(api.get().cash), peak: Math.round(peak), broke };
}

function median(a){const b=a.slice().sort((x,y)=>x-y);return b[Math.floor(b.length/2)];}
console.log("=== 会用道具的玩家（各跑 5 次）===");
console.log("难度     结束现金(中位)   峰值(中位)   破产次数");
for (const diff of ["easy","normal","hard"]) {
  const runs = [];
  for (let i = 0; i < 5; i++) runs.push(run(diff, 100));
  const brokeCount = runs.filter(r => r.broke).length;
  console.log(diff.padEnd(7), String(median(runs.map(r=>r.end))).padStart(12),
              String(median(runs.map(r=>r.peak))).padStart(12), String(brokeCount + "/5").padStart(9));
}
