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
    const fp = path.resolve(htmlDir, rel.split("?")[0]);   // 去掉 ?v= 版本号
    if (rel.indexOf("sound.js") >= 0) continue;   // 音效模块依赖真实 DOM，测试时跳过
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
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${extra ? '  -> ' + extra : ''}`); }
}

console.log('=== 1. 开局结构 ===');
api.newGame();
let G = api.get();
ok('第 1 天', G.day === 1);
ok('5 个 AI', G.staff.length === 5);
ok('共 11 名下属', G.workers.length === 11, 'workers=' + G.workers.length);
const sizeOf = id => G.workers.filter(w => w.aiId === id).length;
ok('Claude 2 / DeepSeek 1 / Gemini 2 / Grok 3 / ChatGPT 3',
  sizeOf('claude') === 2 && sizeOf('deepseek') === 1 && sizeOf('gemini') === 2 && sizeOf('grok') === 3 && sizeOf('chatgpt') === 3,
  [sizeOf('claude'), sizeOf('deepseek'), sizeOf('gemini'), sizeOf('grok'), sizeOf('chatgpt')].join('/'));
ok('五个 AI 开局状态不全相同', new Set(G.staff.map(s => Math.round(s.mood))).size > 2);
ok('下属开局体力都低于 50', G.workers.every(w => w.stamina < 50), JSON.stringify(G.workers.map(w => w.stamina)));
ok('下属都有 5 项技能', G.workers.every(w => w.skills && Object.keys(w.skills).length === 5));

console.log('\n=== 2. 主管自动挑人 ===');
const o1 = G.orders[0];
const c0 = G.compute;
api.assign(o1.id, 'grok');
G = api.get();
const o1b = G.orders.find(o => o.id === o1.id);
ok('按需求挑人（1~need）', o1b.crew.length >= 1 && o1b.crew.length <= Math.max(2, Math.round(o1b.stars * 1.7), o1b.minCrew || 1));
ok('订单归属 Grok', o1b.assignedTo === 'grok');
ok('算力按人头扣', G.compute === c0 - o1b.crew.length * 2, c0 + ' -> ' + G.compute);
ok('被挑中的人忙碌', G.workers.filter(w => w.busy === o1.id).length === o1b.crew.length);
ok('右侧切到该 AI', api.panelTitle() === 'Grok');

console.log('\n=== 3. 手动单点派活 ===');
api.newGame(); G = api.get();
const o3 = G.orders[0];
api.setSel(o3.id);
api.pickWorker('claude-1');
const o3b = api.get().orders.find(o => o.id === o3.id);
ok('手动只派 1 人', o3b.crew.length === 1);
ok('派的是 Claude·1', o3b.crew[0] === 'claude-1');
api.setSel(o3.id);
api.pickWorker('claude-1');
ok('再点一次撤下', api.get().orders.find(o => o.id === o3.id).crew.length === 0);

console.log('\n=== 4. 重复派单拦截 ===');
api.newGame(); G = api.get();
const o4 = G.orders[0];
api.assign(o4.id, 'claude');
const c4 = api.get().compute;
api.assign(o4.id, 'gemini');
ok('同一单不能被两组接', api.get().orders.find(o => o.id === o4.id).assignedTo === 'claude');
ok('算力没二次扣', api.get().compute === c4);

console.log('\n=== 5. 算力不足拦截 ===');
api.newGame(); G = api.get();
G.compute = 1;
const o5 = G.orders[0];
api.assign(o5.id, 'grok');
ok('算力不足不派人', api.get().orders.find(o => o.id === o5.id).crew.length === 0);
ok('算力没被扣', api.get().compute === 1);

console.log('\n=== 6. 结算：推进 + 发薪 ===');
api.newGame(); G = api.get();
const o6 = G.orders[0];
const cash0 = G.cash;
const st0 = api.get().workers.filter(w => w.aiId === 'chatgpt').map(w => w.stamina);
api.assign(o6.id, 'chatgpt');
api.endDay();
G = api.get();
const o6n = G.orders.find(o => o.id === o6.id);
if (o6n) ok('没交付时进度 > 0', o6n.progress > 0);
else ok('3 人一天做完一单', true);
const st1 = G.workers.filter(w => w.aiId === 'chatgpt').map(w => w.stamina);
ok('干活的人掉体力', st1.some((v, i) => v < st0[i]), JSON.stringify(st1));
ok('发了工资和房租', G.logs.some(l => String(l.text).indexOf('发薪') >= 0), '日志里没有发薪记录');

console.log('\n=== 7. 多人比单人快 ===');
// 把工作量调大，保证一天做不完，才能比较进度
api.newGame(); G = api.get();
const oA = G.orders[0];
oA.need = 99999;
api.setSel(oA.id); api.pickWorker('deepseek-1');
api.endDay();
const single = api.get().orders.find(o => o.id === oA.id).progress;
api.newGame(); G = api.get();
const oB = G.orders[0];
oB.need = 99999;
api.setSel(oB.id);
api.pickWorker('grok-1'); api.pickWorker('grok-2'); api.pickWorker('grok-3');
api.endDay();
const multi = api.get().orders.find(o => o.id === oB.id).progress;
ok('3 人产出高于 1 人', multi > single, `1人=${single.toFixed(1)} 3人=${multi.toFixed(1)}`);

console.log('\n=== 8. 撤回派单 ===');
api.newGame(); G = api.get();
const o8 = G.orders[0];
const c8 = G.compute;
api.assign(o8.id, 'grok');
api.undoOrder(o8.id);
G = api.get();
ok('撤回后没人忙', G.workers.every(w => !w.busy));
const o8b = G.orders.find(o => o.id === o8.id);
ok('撤回后订单清空', o8b.crew.length === 0 && o8b.assignedTo === null);
ok('算力全额返还', G.compute === c8);

console.log('\n=== 9. 招募解锁（按历史最高）===');
api.newGame(); G = api.get();
api.recruit('elite', 'claude');
ok('未达标不能招顶尖', api.get().workers.length === 11);
G = api.get();
G.cash = 50000; G.peakCash = 50000;
api.recruit('elite', 'claude');
ok('达标后能招顶尖', api.get().workers.length === 12);
api.get().cash = 1000;
ok('历史最高不会因花钱而回退', api.peakCash() >= 50000);

console.log('\n=== 10. 循序渐进解锁 ===');
ok('第 1 天只有文案和客服', api.unlockedTypes(1).join() === 'copy,cs');
ok('第 4 天解锁研发', api.unlockedTypes(4).indexOf('dev') >= 0);
ok('第 10 天解锁创意', api.unlockedTypes(10).indexOf('idea') >= 0);
ok('前期只有 1 星', api.starCap(1) === 1);
ok('后期才有 3 星', api.starCap(11) === 3);

console.log('\n=== 11. 主管亲自下场 ===');
api.newGame(); G = api.get();
const oL = G.orders[0];
api.setSel(oL.id);
const cL = G.compute;
api.pickLead('claude');
G = api.get();
ok('主管进入 crew', G.orders.find(o => o.id === oL.id).crew.indexOf('ai:claude') >= 0);
ok('主管上阵扣 3 算力', G.compute === cL - 3, cL + ' -> ' + G.compute);
ok('主管标记为在做', !!G.staff.find(s => s.id === 'claude').working);
const fat0 = G.staff.find(s => s.id === 'claude').fatigue;
const prog0 = G.orders.find(o => o.id === oL.id).progress;
api.endDay();
G = api.get();
const oLn = G.orders.find(o => o.id === oL.id);
ok('主管推进了进度或已交付', !oLn || oLn.progress > prog0);
ok('主管上阵会累', G.staff.find(s => s.id === 'claude').fatigue > fat0);

console.log('\n=== 12. 主管比单个下属强 ===');
api.newGame(); G = api.get();
const oS = G.orders[0];
api.setSel(oS.id); api.pickWorker('claude-1');
api.endDay();
const pS = api.get().orders.find(o => o.id === oS.id);
const subProg = pS ? pS.progress : 999;
api.newGame(); G = api.get();
const oT = G.orders[0];
api.setSel(oT.id); api.pickLead('claude');
api.endDay();
const pT = api.get().orders.find(o => o.id === oT.id);
const leadProg = pT ? pT.progress : 999;
ok('主管产出 >= 单个下属', leadProg >= subProg, `下属=${subProg.toFixed(1)} 主管=${leadProg.toFixed(1)}`);

console.log('\n=== 13. 长跑 40 天 ===');
api.newGame();
let ended = false;
for (let i = 0; i < 40; i++) {
  api.endDay();
  if (api.get().finished) { ended = true; break; }
}
G = api.get();
ok('40 天内出现结局', ended, 'day=' + G.day);

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
