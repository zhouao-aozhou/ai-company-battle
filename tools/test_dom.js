// 严格 DOM stub：只有真实存在的 id 才返回元素，其它返回 null（复现真实浏览器的 null 行为）
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const ids = new Set();
const bodyHtml = html.slice(html.indexOf("<body>"), html.indexOf("<script>"));
for (const m of bodyHtml.matchAll(/id="([^"]+)"/g)) ids.add(m[1]);
console.log("页面里的 id 共", ids.size, "个");
let code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
code += `\n;globalThis.__api = { get:()=>G, newGame };`;
function fakeEl(){ return { innerHTML:'', textContent:'', style:{}, children:[], onclick:null,
  classList:{_s:new Set(),add(c){this._s.add(c);},remove(c){this._s.delete(c);},contains(c){return this._s.has(c);},toggle(){}},
  appendChild(){}, remove(){}, querySelector(){return fakeEl();} }; }
const store = {};
const sandbox = {
  document:{ body:{ classList:{_s:new Set(),add(c){this._s.add(c);},remove(c){this._s.delete(c);},contains(c){return this._s.has(c);},toggle(c,v){ if(v===undefined){ this._s.has(c)?this._s.delete(c):this._s.add(c);} else if(v){this._s.add(c);} else {this._s.delete(c);} }} },
    getElementById(id){ if (!ids.has(id)) return null; return store[id]||(store[id]=fakeEl()); },
    createElement(){return fakeEl();}, querySelectorAll(){ return []; } },
  localStorage:{ _d:{}, getItem(k){return this._d[k]||null;}, setItem(k,v){this._d[k]=v;} },
  setTimeout(){}, clearTimeout(){}, console, Math, JSON, Date, Number, Object, Array, String
};
vm.createContext(sandbox);
try {
  vm.runInContext(code, sandbox);
  sandbox.__api.newGame();
  console.log("✓ 没有异常，游戏可正常渲染");
} catch (e) {
  console.log("✗ 抛出异常:", e.message);
  console.log("   ", (e.stack||"").split("\n")[1]);
}
