



/* =========================================================



   配置区：想改名/换头像/调数值，只改这里



   ========================================================= */



const CFG = {



  days: 100,



  rentPerDay: 120,







  // 难度（新开一局时选择，只影响金钱与订单难度）



  difficulties: [



    { id: "easy",   name: "轻松", color: "#59d98c", rewardMul: 1.55, costMul: 0.75, needMul: 0.80, startCash: 20000, costRamp: 0.020,



      desc: "钱比较宽裕，适合随便玩玩" },



    { id: "normal", name: "标准", color: "#7de3ff", rewardMul: 1.45, costMul: 0.85, needMul: 0.90, startCash: 15000, costRamp: 0.026,



      desc: "每一单都要算账，容易翻车" },



    { id: "hard",   name: "硬核", color: "#ff9b9b", rewardMul: 1.00, costMul: 1.28, needMul: 1.10, startCash: 12000, costRamp: 0.032,



      desc: "乱点必死，得认真配人" },



  ],



  orderPerDay: 3,



  startCash: 6000,



  startCompute: 60,



  computePerDay: 10,         // 每天回的算力：够 5 个人干活



  maxCompute: 999,          // 内部上限，不在界面展示







  // 订单类型



  types: {



    copy:   { name: "文案",   color: "#9fc2ff" },



    dev:    { name: "研发",   color: "#7de3ff" },



    data:   { name: "数据",   color: "#b48cff" },



    idea:   { name: "创意",   color: "#ffc861" },



    cs:     { name: "客服",   color: "#59d98c" },



  },







  // 6 个 AI 员工



  // portrait: null = 形象未确认，留空（避免张冠李戴）



  staff: [



    { id: "claude",   name: "Claude",   role: "合规总监",   portrait: "assets/portraits/claude.png",



      skills: { copy: 5, dev: 3, data: 4, idea: 3, cs: 5 }, wage: 190,



      like: "别返工，一次做对", hate: "需求反复改", start: { mood: 82, fatigue: 12, trust: 70 },



      lines: ["这个方案合规吗？","我建议再核一遍。","返工三次了。"] },







    { id: "deepseek", name: "DeepSeek", role: "技术极客",   portrait: "assets/portraits/deepseek.png",



      skills: { copy: 2, dev: 5, data: 5, idea: 3, cs: 2 }, wage: 210,



      like: "有难度的问题", hate: "无脑重复劳动", start: { mood: 56, fatigue: 6, trust: 44 },



      lines: ["……","给我点难的。","这个实现有问题。"] },







    { id: "gemini",   name: "Gemini",   role: "长文担当",   portrait: "assets/portraits/gemini.png",



      skills: { copy: 4, dev: 3, data: 5, idea: 4, cs: 4 }, wage: 185,



      like: "被认真对待", hate: "被忽略", start: { mood: 68, fatigue: 24, trust: 58 },



      lines: ["我把整本书读完了。","这个我整理好了。","……没人问我吗。"] },







    { id: "grok",     name: "Grok",     role: "创意吐槽",   portrait: "assets/portraits/grok.png",



      skills: { copy: 3, dev: 2, data: 2, idea: 5, cs: 3 }, wage: 180,



      like: "被夸、玩梗", hate: "无聊的活", start: { mood: 88, fatigue: 34, trust: 48 },



      lines: ["这需求是谁写的？","灵感来了。","夸我一句我就干。"] },







    { id: "chatgpt",  name: "ChatGPT",  role: "全能老员工", portrait: "assets/portraits/chatgpt.png",



      skills: { copy: 4, dev: 4, data: 4, idea: 4, cs: 4 }, wage: 230,



      like: "被照顾、休息", hate: "被榨干", start: { mood: 62, fatigue: 52, trust: 64 },



      lines: ["我还能撑。","今天能早点下班吗？","什么活都给我啊。"] },



  ],







  // 每个 AI 旗下的小组（人数不同，名字先占位，随时可改）



  teams: {



    claude:   { size: 2 },



    deepseek: { size: 1 },



    gemini:   { size: 2 },



    grok:     { size: 3 },



    chatgpt:  { size: 3 },



  },



  workerWage: 25,          // 每个下属的日薪



  idleRecover: 18,         // 空闲一天恢复的体力



  workRecover: 4,          // 干活的人也会回一点（睡眠/通勤）



  coffeeCost: 80,          // 一杯咖啡



  coffeeRecover: 15,       // 咖啡回的体力



  coffeeBacklash: 18,      // 主管咖啡的后遗症：次日疲劳 +18



  exhaustLine: 20,         // 体力低于这个数 → 第二天强制休息



  forceRestRecover: 45,    // 强制休息一天恢复多少







  // 主管连轴转惩罚：连续上阵，疲劳代价递增（有上限）



  leadFatigueBase: 12,     // 第 1 天上阵的疲劳代价



  leadFatigueStep: 6,      // 每多连一天，多付这么多



  leadFatigueMax: 36,      // 单日疲劳代价的上限







  // 算力经济：超出每日免费额度的部分要花钱，且越超越贵



  freeCompute: 6,         // 每天免费可用的算力点数



  overFeeBase: 50,         // 超载费 = base × 超出点数^exp



  overFeeExp: 1.8,



  overBonusPerPt: 0.02,    // 每超 1 点，全队产出 +



  overBonusMax: 0.40,      // 超频加成上限







  // 招聘档次：按"历史最高资金"解锁（曾经达到过就永久解锁）



  // 每档难度的结局文案（同一评级在不同难度叫法不同）
  rankEndings: {
    easy: {
      S: ["✨ 神仙老板 ✨", "钱多到你都不想数了，员工还在问下次团建去哪玩 ₍ᐢ.ˬ.ᐢ₎"],
      A: ["(๑˃̵ᴗ˂̵)و 人生赢家", "赚得盆满钵满，员工也开开心心，朋友都在偷偷问你是怎么搞的～"],
      B: ["还不错嘛～", "没暴富也没翻车，日子过得挺滋润，摸摸鱼就到了第 100 天。"],
      C: ["勉勉强强啦", "钱没少花业绩一般，但好歹还活着 (｡•́︿•̀｡)"],
      D: ["玩脱了呢…", "本来只想随便玩玩，结果账上只剩灰尘，连猫粮都买不起了。"],
    },
    normal: {
      S: ["商业天才！", "行业里没人做到过，你把五个 AI 变成了一台会下金蛋的印钞机 ✧₊⁺"],
      A: ["超厉害的说", "做到了行业第一，虽然大家都累得只会发出喵喵叫了。"],
      B: ["小小成就", "账上过了百万，够在同行面前挺直腰板啦！"],
      C: ["马马虎虎", "活下来了，也攒了一点点家底，就是钱包还是有点瘪。"],
      D: ["qwq 破产了", "刚够发工资，再撑一百天也不会更好，摸着空钱包叹气。"],
    },
    hard: {
      S: ["奇迹 survivor！", "同行一个个倒下，只有你还站着，账上还压着一座小金山 ✧◝(⁰▿⁰)◜✧"],
      A: ["险胜 ✦", "每一步都踩在破产线上，最后居然赢了，心跳都要停了！"],
      B: ["活下来啦", "活得狼狈但活着，在这行能活着就算本事 (๑•̀ㅂ•́)و✧"],
      C: ["苟住了…", "所有人都累垮了，账上刚好够发下个月工资，风一吹就散。"],
      D: ["无了 (哭)", "资金链断在最后一刻，连办公室的椅子都被人搬走了呜呜呜…"],
    },
  },

  // 每档难度自己的评级门槛（同样的钱，难度不同评价不同）
  rankTiers: {
    easy:   { S: 2600000, A: 1700000, B: 1050000, C: 420000 },
    normal: { S: 2400000, A: 1550000, B: 950000,  C: 380000 },
    hard:   { S: 1150000, A: 750000,  B: 380000,  C: 110000 },
  },

  recruitTiers: [



    { id: "junior", name: "普通", needPeak: 3000,  cost: 600,  lo: 2, hi: 3, color: "#9fc2ff" },



    { id: "senior", name: "资深", needPeak: 15000, cost: 2500, lo: 3, hi: 4, color: "#ffc861" },



    { id: "elite",  name: "顶尖", needPeak: 40000, cost: 8000, lo: 4, hi: 5, color: "#b48cff" },



  ],



  sellBase: 300,           // 卖掉一个人：300 + 技能总和 × 50



  workerCompute: 2,        // 派 1 个人消耗的算力







  // 订单修饰（每次随机挂一个，玩法才不单调）



  mods: [



    { id: "rush",  name: "加急",  color: "#ff9b9b", ddl: -2, mulReward: 1.55 },



    { id: "big",   name: "大客户", color: "#ffc861", starAdd: 1, mulReward: 1.6, mulNeed: 1.25, minDay: 5 },



    { id: "tight", name: "预算紧", color: "#8ea3c9", mulReward: 0.62 },



    { id: "inner", name: "内部单", color: "#59d98c", mulNeed: 0.7, mulReward: 0.72 },



    { id: "team",  name: "需协作", color: "#b48cff", mulNeed: 1.2, mulReward: 1.35, minCrew: 2 },



  ],



  clients: ["某互联网大厂", "创业公司", "政务项目", "高校实验室", "电商平台", "游戏公司", "银行风控部", "本地商家"],







  // 随机事件



  events: [



    { id: "hot",   name: "上热搜了",   desc: "客户把你的交付发到了社交平台，好评刷屏。", fx: g => { g.reputation = clamp(g.reputation + 12); g.morale = clamp(g.morale + 6); } },



    { id: "bad",   name: "需求变更",   desc: "甲方临时改需求，全员心情下降。",         fx: g => { g.staff.forEach(s => s.mood = clamp(s.mood - 8)); } },



    { id: "crash", name: "模型宕机",   desc: "推理集群挂了 3 小时，算力损失。",         fx: g => { g.compute = clamp(g.compute - 15); } },



    { id: "poach", name: "竞对挖人",   desc: "对手给低心情员工发了私信。",             fx: g => { const w = g.staff.slice().sort((a,b)=>a.trust-b.trust)[0]; w.trust = clamp(w.trust - 12); w.mood = clamp(w.mood - 6); return w.name + " 有点动摇了"; } },



    { id: "viral", name: "爆款订单",   desc: "一个大客户找上门，账上多了笔预付款。",     fx: g => { g.cash += 1500; } },



  ],



};







/* =========================================================



   工具



   ========================================================= */



const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));



const pick = a => a[(Math.random() * a.length) | 0];



const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));



const $ = id => document.getElementById(id);







/* =========================================================



   游戏状态



   ========================================================= */



let G = null;



let selOrder = null;



let selStaff = null;



let selWorker = null;







/* 让玩家选难度，然后开新局 */



function pickDifficulty(onDone, onCancel) {
  const list = CFG.difficulties.map(d =>
    `<button class="pickrow" style="margin-bottom:6px" onclick="startWithDifficulty('${d.id}', ${!!onDone})">
       <span style="color:${d.color};font-weight:600">${d.name}</span>
     </button>`).join("");
  // 必须选一个：取消 = 退回上一步，不允许空着手进游戏
  showModal("选个难度", `<div class="picklist">${list}</div><div style="font-size:12px;color:#8ea3c9;margin-top:10px;text-align:center">难度决定收入、成本和评级门槛，选定后不能改</div>`,
    [{ label: "返回", fn: () => { if (typeof onCancel === "function") onCancel(); } }]);
}







function startWithDifficulty(id, thenSave) {



  const box = $("modalBox");



  if (box) box.parentElement.classList.remove("on");



  newGame(id);



  renderAll();



  const d = CFG.diff;



  toast(`新的一局（${d.name}）`, "");



  log(`新开一局：${d.name}`);



}







function newGame(diffId) {



  const diff = CFG.difficulties.find(x => x.id === diffId) || CFG.difficulties[0];



  CFG.diff = diff;







  G = {



    day: 1,



    diffId: diff.id,



    cash: diff.startCash,



    compute: CFG.startCompute,



    reputation: 50,



    morale: 60,



    investor: 50,



    orders: [],



    logs: [],



    finished: false,



    lastAssign: null,



    peakCash: diff.startCash,



    staff: CFG.staff.map(s => ({



      ...s,
      skills: Object.assign({}, s.skills),



      mood: (s.start ? s.start.mood : 70) + rnd(-6, 6),



      fatigue: (s.start ? s.start.fatigue : 15) + rnd(-4, 6),



      trust: (s.start ? s.start.trust : 55) + rnd(-5, 5),



      level: 1,



      working: null,



      resting: false,



      talkCd: 0, raiseCd: 0,



      streak: 0,



      bubble: "", bubbleT: 0,



    })),



    workers: [],



    bag: [],



    bought: {},



    usedToday: 0,
    quotaPenalty: 0,   // 昨天遗留占用，今天的免费额度要减掉



    history: [],



  };



  // 按配置生成各 AI 旗下的员工



  for (const ai of CFG.staff) {



    const size = (CFG.teams[ai.id] || {}).size || 1;



    for (let i = 1; i <= size; i++) {



      const sk = {};



      const best = Object.keys(ai.skills).sort((a, b) => ai.skills[b] - ai.skills[a])[0];



      Object.keys(ai.skills).forEach(k => {



        let v = rnd(0, 3);                      // 0~3，拉开差距



        if (k === best) v = Math.max(v, 2);     // 专精项至少 2



        sk[k] = Math.min(3, v);



      });



      G.workers.push({



        id: ai.id + "-" + i,



        aiId: ai.id,



        name: ai.name + "·" + i,



        skills: sk,



        stamina: rnd(30, 49),   // 开局体力都在 50 以下



        busy: null,



        wage: CFG.workerWage,



      });



    }



  }



  selOrder = null; selStaff = null;



  for (let i = 0; i < ordersPerDay(G.day); i++) spawnOrder();



  log("公司开张，第 1 天。");



  save();



  renderAll();



}







/* =========================================================



   订单



   ========================================================= */



let oid = 0;



/* 按天数解锁订单类型：循序渐进，别一上来就 5 种类型糊脸 */



function unlockedTypes(day) {



  const t = ["copy", "cs"];



  if (day >= 4) t.push("dev");



  if (day >= 7) t.push("data");



  if (day >= 10) t.push("idea");



  return t;



}







function starCap(day) {



  if (day >= 11) return 3;



  if (day >= 5) return 2;



  return 1;



}







/* 今天实际可用的免费算力（扣掉昨天遗留占用） */
/* 不同档次的人消耗不同算力 */
function computeCostOf(w) {
  if (!w) return CFG.workerCompute;
  if (w.tier === "elite") return 4;
  if (w.tier === "senior") return 3;
  return CFG.workerCompute;   // 普通 2
}

/* 一组人总共要多少算力 */
function crewCompute(list) {
  return (list || []).reduce((a, w) => a + computeCostOf(w), 0);
}

/* 道具是否已解锁（按天数） */
function isItemUnlocked(it) {
  if (!it) return false;
  if (!it.unlockDay) return true;
  return (G.day || 1) >= it.unlockDay;
}


/* ================= 随机事件（第 5 天后，纯随机，无预告） ================= */
const RANDOM_EVENTS = [
  // —— 负面 ——
  { id: "blackout", icon: "🔌", name: "突然停电", w: 3,
    text: "整层电压不稳，显示器一片黑，所有人对着黑屏干瞪眼。",
    run: (G) => { G.compute = Math.max(0, G.compute - 4); return "算力 -4"; } },
  { id: "netdown", icon: "📡", name: "网络断了", w: 3,
    text: "运营商那边出问题，云服务全连不上，一整个下午白干。",
    run: (G) => { G.orders.forEach(o => { if ((o.progress||0) > 0) o.progress = Math.max(0, o.progress - 8); }); return "在手订单进度 -8%"; } },
  { id: "complaint", icon: "😤", name: "客户投诉", w: 3,
    text: "一个客户在群里连续发了三十条语音，说交付的东西「感觉不对」。",
    run: (G) => { G.reputation = clamp(G.reputation - 4); return "口碑 -4"; } },
  { id: "late", icon: "⏰", name: "集体迟到", w: 3,
    text: "早高峰地铁故障，一半人迟到，办公室稀稀拉拉。",
    run: (G) => { G.morale = clamp(G.morale - 5); return "士气 -5"; } },
  { id: "ac", icon: "❄️", name: "空调坏了", w: 2,
    text: "下午三点，室内温度 34 度，所有人都开始用文件夹扇风。",
    run: (G) => { G.staff.forEach(s => { s.mood = clamp(s.mood - 5); }); return "全员心情 -5"; } },
  { id: "server", icon: "💥", name: "服务器宕机", w: 2,
    text: "机房的机器发出一声哀鸣，然后彻底安静了。",
    run: (G) => { G.compute = 0; return "算力清零"; } },
  { id: "cat", icon: "🐈", name: "猫又来了", w: 3,
    text: "楼下那只橘猫溜进来，把桌上的咖啡精准推倒，键盘遭殃。",
    run: (G) => { G.cash -= 300; return "损失 ¥300"; } },
  { id: "printer", icon: "🖨️", name: "打印机卡纸", w: 2,
    text: "合同卡在机器里，三个人围着一台打印机研究半小时。",
    run: (G) => { G.cash -= 120; return "维修 ¥120"; } },
  { id: "steal", icon: "🕵️", name: "有人来挖角", w: 2,
    text: "前台说有个陌生人在楼下咖啡厅找你的员工聊了很久。",
    run: (G) => { const w = G.workers[Math.floor(Math.random()*G.workers.length)]; if (w) { w.stamina = Math.max(0, w.stamina - 15); return `${w.name} 心不在焉，体力 -15`; } return "无事发生"; } },
  { id: "inspect", icon: "📋", name: "上级抽查", w: 2,
    text: "总部突然要一份本周工作汇报，所有人连夜补材料。",
    run: (G) => { G.morale = clamp(G.morale - 8); G.reputation = clamp(G.reputation + 3); return "士气 -8，口碑 +3"; } },

  // —— 正面 ——
  { id: "bonus_order", icon: "📦", name: "客户追加订单", w: 3,
    text: "老客户说上次做得不错，直接又追加了一单。",
    run: (G) => { spawnOrder(); return "订单 +1"; } },
  { id: "returning", icon: "💝", name: "老客户回头", w: 3,
    text: "三个月没联系的老客户突然转账，说「还是你们靠谱」。",
    run: (G) => { G.cash += 2200; return "资金 +¥2200"; } },
  { id: "lottery", icon: "🎁", name: "意外奖金", w: 2,
    text: "参加行业活动抽中三等奖，一台咖啡机加现金红包。",
    run: (G) => { G.cash += 3000; return "资金 +¥3000"; } },
  { id: "freecompute", icon: "⚡", name: "免费算力", w: 3,
    text: "云厂商做活动，临时赠送了一批算力额度。",
    run: (G) => { G.compute = Math.min(CFG.maxCompute, G.compute + 12); return "算力 +12"; } },
  { id: "viral", icon: "🔥", name: "网上火了", w: 2,
    text: "有人把你们办公室的照片发到网上，评论区都在问在哪投简历。",
    run: (G) => { G.reputation = clamp(G.reputation + 6); return "口碑 +6"; } },
  { id: "skillup", icon: "📚", name: "有人偷偷变强", w: 2,
    text: "有人下班后自己报了网课，第二天明显顺手了很多。",
    run: (G) => { const w = G.workers[Math.floor(Math.random()*G.workers.length)]; if (w) { const ks = Object.keys(w.skills); const k = ks[Math.floor(Math.random()*ks.length)]; w.skills[k] = Math.min(8, (w.skills[k]||1) + 1); return `${w.name} 的${CFG.types[k].name} +1`; } return "没人涨技能"; } },
  { id: "nap", icon: "😴", name: "午休睡得很香", w: 3,
    text: "天气正好，所有人午休睡了一觉，下午精神好得离谱。",
    run: (G) => { G.workers.forEach(w => { w.stamina = Math.min(100, w.stamina + 12); }); return "全员体力 +12"; } },
  { id: "cafe", icon: "☕", name: "楼下开了家咖啡店", w: 2,
    text: "新店开业买一送一，全公司都去薅羊毛，回来脸上都带笑。",
    run: (G) => { G.staff.forEach(s => { s.mood = clamp(s.mood + 6); }); return "全员心情 +6"; } },
  { id: "praise", icon: "🌟", name: "被点名表扬", w: 2,
    text: "一个客户在行业群里夸了你们一句，当天就来了两个咨询。",
    run: (G) => { G.reputation = clamp(G.reputation + 4); G.morale = clamp(G.morale + 4); return "口碑 +4，士气 +4"; } },
  { id: "refund", icon: "💰", name: "退税到账", w: 2,
    text: "财务说之前多缴的一笔钱退回来了。",
    run: (G) => { G.cash += 1500; return "资金 +¥1500"; } },

  // —— 中性 / 有选择 ——
  { id: "leave", icon: "🙋", name: "有人要请假", w: 2,
    text: "一个组员说家里有事，想请一天假，眼神有点忐忑。",
    options: [
      { label: "准了", run: (G) => { G.morale = clamp(G.morale + 8); return "士气 +8（大家觉得你通人情）"; } },
      { label: "不批", run: (G) => { G.morale = clamp(G.morale - 10); return "士气 -10（有人在小群里抱怨）"; } },
    ] },
  { id: "headhunt", icon: "🎯", name: "猎头找上门", w: 2,
    text: "有猎头直接打电话到公司，想挖你一个主管，开的价比你高。",
    options: [
      { label: "花钱挽留 ¥3000", run: (G) => { if (G.cash >= 3000) { G.cash -= 3000; G.morale = clamp(G.morale + 10); return "士气 +10（人心稳了）"; } G.morale = clamp(G.morale - 8); return "钱不够，士气 -8"; } },
      { label: "让他去", run: (G) => { G.reputation = clamp(G.reputation - 5); G.morale = clamp(G.morale - 6); return "口碑 -5，士气 -6"; } },
    ] },
  { id: "rush", icon: "🚨", name: "客户要加急", w: 2,
    text: "客户说赶不上这周就换供应商，但加急要全员加班。",
    options: [
      { label: "接", run: (G) => { G.cash += 4000; G.workers.forEach(w => { w.stamina = Math.max(0, w.stamina - 18); }); return "资金 +¥4000，全员体力 -18"; } },
      { label: "拒绝", run: (G) => { G.reputation = clamp(G.reputation - 3); return "口碑 -3"; } },
    ] },
  { id: "team", icon: "🍻", name: "有人提议团建", w: 2,
    text: "群里有人@你：「老板，今晚聚餐吗？」后面跟了二十个 +1。",
    options: [
      { label: "请客 ¥2000", run: (G) => { if (G.cash >= 2000) { G.cash -= 2000; G.morale = clamp(G.morale + 14); G.staff.forEach(s => s.mood = clamp(s.mood + 8)); return "士气 +14，全员心情 +8"; } return "钱不够，气氛尴尬"; } },
      { label: "改天吧", run: (G) => { G.morale = clamp(G.morale - 6); return "士气 -6"; } },
    ] },
  { id: "mystery", icon: "📦", name: "神秘快递", w: 2,
    text: "前台收到一个没有寄件人的箱子，摇了摇，里面会响。",
    options: [
      { label: "拆开", run: (G) => { const r = Math.random(); if (r < 0.5) { G.cash += 2500; return "是合作方寄的样品 +¥2500"; } G.compute = Math.max(0, G.compute - 6); return "是个会响的闹钟，白折腾，算力 -6"; } },
      { label: "放着", run: () => "你决定不管它，箱子在角落放了一整天。" },
    ] },
  { id: "neighbor", icon: "🏢", name: "隔壁来借东西", w: 2,
    text: "隔壁公司的人来借咖啡豆，说「就一点点」。",
    options: [
      { label: "给他", run: (G) => { G.reputation = clamp(G.reputation + 3); return "口碑 +3（结了个善缘）"; } },
      { label: "说没有", run: () => "你指了指空罐子，对方尴尬地走了。" },
    ] },
];

/* 按权重抽一个事件 */
function pickRandomEvent() {
  const pool = RANDOM_EVENTS;
  const total = pool.reduce((a, e) => a + (e.w || 1), 0);
  let r = Math.random() * total;
  for (const e of pool) {
    r -= (e.w || 1);
    if (r <= 0) return e;
  }
  return pool[0];
}

/* 每天结算后：第 5 天后，随机概率触发，无任何预告 */
function maybeRandomEvent() {
  if (!G || G.finished) return;
  if ((G.day || 1) <= 5) return;
  // 概率完全随机：33% ~ 50% 之间浮动，平均约每 2~3 天来一次
  const chance = 0.28 + Math.random() * 0.14;
  if (Math.random() > chance) return;

  const ev = pickRandomEvent();
  const runOne = (opt) => {
    let res = "";
    try { res = opt ? opt.run(G) : ev.run(G); } catch (e) { res = ""; }
    save(); renderAll();
    return res;
  };

  if (ev.options) {
    showModal(`${ev.icon} ${ev.name}`, `<div style="margin-bottom:12px">${ev.text}</div>`,
      ev.options.map((opt) => ({
        label: opt.label,
        fn: () => {
          const res = runOne(opt);
          setTimeout(() => showModal(`${ev.icon} ${ev.name}`, `<div style="color:#7de38f;font-weight:600">${res}</div>`, [{ label: "知道了", fn: null }]), 120);
        },
      })));
  } else {
    const res = runOne(null);
    showModal(`${ev.icon} ${ev.name}`, `<div style="margin-bottom:12px">${ev.text}</div><div style="color:#7de38f;font-weight:600">${res}</div>`,
      [{ label: "知道了", fn: null }]);
  }
}

function effFreeCompute() {
  return Math.max(0, CFG.freeCompute + (G.quotaBoost || 0) - (G.quotaPenalty || 0));
}

function ordersPerDay(day) {
  // 后期订单越来越多，不扩张就做不完（逾期会罚款）
  if (day <= 2) return 1;
  if (day <= 4) return 2;
  if (day <= 15) return 3;
  if (day <= 35) return 4;
  if (day <= 60) return 5;
  return 6;
}







function spawnOrder() {



  const types = unlockedTypes(G.day);



  const t = pick(types);



  const stars = rnd(1, starCap(G.day));



  const names = {



    copy: ["品牌文案重写", "公众号长文", "产品说明书"],



    dev:  ["API 接入", "推荐算法调优", "后端重构"],



    data: ["用户画像分析", "月度数据报表", "AB 测试复盘"],



    idea: ["新品创意提案", "广告脚本", "活动策划"],



    cs:   ["大客户陪跑", "工单批量回复", "售后回访"],



  };



  let need = Math.round(stars * 21 * CFG.diff.needMul);   // 工作量：配合更高的人数需求



  G.orders.push({



    id: ++oid,



    type: t,



    stars,



    title: pick(names[t]),



    need,



    progress: 0,



    daysLeft: rnd(2, 4) + stars,



    reward: Math.round((stars * 1250 + rnd(0, 250)) * CFG.diff.rewardMul * (1 + ((G.day || 1) - 1) * 0.06)),



    penalty: stars * 320,



    computeCost: stars * 6,



    crew: [],



    client: pick(CFG.clients),



    mod: null,



    modName: "",



    modColor: "",



    minCrew: 1,



    assignedTo: null,



  });







  // 挂一个随机修饰



  const o = G.orders[G.orders.length - 1];



  const pool = CFG.mods.filter(m => !m.minDay || G.day >= m.minDay);



  if (pool.length && Math.random() < 0.8) {



    const mod = pick(pool);



    o.mod = mod.id;



    o.modName = mod.name;



    o.modColor = mod.color;



    if (mod.starAdd) {



      o.stars = Math.min(starCap(G.day) + 1, o.stars + mod.starAdd);



      o.need = Math.round(o.stars * 21 * CFG.diff.needMul);



      o.reward = Math.round((o.stars * 1250 + rnd(0, 250)) * CFG.diff.rewardMul * (1 + ((G.day || 1) - 1) * 0.06));



    }



    if (mod.ddl) o.daysLeft = Math.max(2, o.daysLeft + mod.ddl);



    if (mod.mulReward) o.reward = Math.round(o.reward * mod.mulReward);



    if (mod.mulNeed) o.need = Math.round(o.need * mod.mulNeed);



    if (mod.minCrew) o.minCrew = mod.minCrew;



    o.penalty = Math.round(o.reward * 0.35);



  }



}







/* =========================================================



   渲染



   ========================================================= */



function renderAll() { renderTop(); renderOrders(); renderOffice(); renderPanel(); renderSelbar(); mountScene3D(); }







/* ---------- 顶部提示条：当前选中的订单 ---------- */



function renderSelbar() {



  const b = $("selbar");



  if (!b) return;







  if (selOrder) {



    const o = G.orders.find(x => x.id === selOrder);



    if (o) {



      b.className = "selbar on";



      b.innerHTML =



        `<span class="txt">已选中「<b>${o.title}</b>」（${CFG.types[o.type].name} · ${o.stars}★ 需 ${o.stars} 人）— 点 AI 卡展开员工 → 点名字自己挑（可多人）；或点卡片里的「🚀 主管挑人」</span>` +



        `<button class="mini" title="怎么派活？" onclick="showSelHelp()">?</button>` +



        `<button onclick="clearSelection()">取消选择 (Esc)</button>`;



      return;



    }



  }







  b.className = "selbar";



  b.innerHTML = "";



}







/* 超载算法说明（第一次触发时自动弹一次，也可在玩法里看） */



function showOverloadHelp(ov) {



  const base = CFG.overFeeBase, exp = CFG.overFeeExp, free = CFG.freeCompute;



  const pts = [2, 4, 6, 8, 12];



  const rows = pts.map(n =>



    `<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0">



       <span style="color:#8ea3c9">超出 ${n} 点</span>



       <span style="color:#ffc861">-¥${Math.round(base * Math.pow(n, exp)).toLocaleString()}</span>



     </div>`).join("");



  const cur = ov ? `



    <div style="background:#2a1b1b;border:1px solid #6b2f2f;border-radius:8px;padding:9px 12px;margin-bottom:12px">



      <b style="color:#ff9b9b">今天你用了 ${ov.used} 点，超出 ${ov.over} 点</b><br>



      <span style="font-size:12px;color:#bcd0ee">超载费 <b style="color:#ffc861">-¥${ov.fee}</b> · 产出加成 <b style="color:#59d98c">+${Math.round(ov.bonus * 100)}%</b></span>



    </div>` : "";



  showModal("⚡ 算力超载是怎么算的", `



    <div style="text-align:left;font-size:12.5px;line-height:1.9">



      ${cur}



      每天有 <b style="color:#7de3ff">${free} 点算力免费</b>（约 ${Math.floor(free / CFG.workerCompute)} 名下属）。<br>



      当天的分配<b>超出这个数</b>就要花钱，越超越贵：<br>



      <div style="background:#121a2c;border-radius:8px;padding:9px 12px;margin:9px 0">



        <div style="font-size:11.5px;color:#8ea3c9;margin-bottom:5px">超载费 = ${base} × 超出点数<sup>${exp}</sup></div>



        ${rows}



      </div>



      <b style="color:#59d98c">超频补偿</b>：超载时全队产出 +${Math.round(CFG.overBonusPerPt * 100)}%/点（上限 +${Math.round(CFG.overBonusMax * 100)}%），<br>



      所以超载不是纯亏，是<em>花钱买速度</em>。<br><br>



      <span style="color:#8ea3c9;font-size:11.5px">费用在「结束今天」结算时扣除。想省下来：少派人、或者多凑几天不超载。</span>



    </div>`, [{ label: "明白了", fn: null }]);



}







function showSelHelp() {



  showModal("怎么派活？", `



    <div style="text-align:left;line-height:1.9;font-size:12.5px">



      <b style="color:#ffc861">① 选中订单</b><br>



      点左侧任意一张订单卡，它会被高亮，这行提示条就会出现。<br><br>



      <b style="color:#ffc861">② 派人（三种方式）</b><br>



      · 点 <b>AI 卡</b> → 展开员工列表 → 点员工名字，自己挑（可多人同一个单）<br>



      · 点订单卡里的 <b>「🚀 让 X 自己挑人上」</b> → 主管按技能和体力自动配人<br>



      · 点订单卡里的 <b>「🧠 让 X 亲自上」</b> → 主管本人干活，产出更高但更累<br><br>



      <b style="color:#ffc861">③ 撤回</b><br>



      派错了再点一次同一个员工即可撤下，算力全额退回。<br><br>



      <b style="color:#ffc861">④ 快捷键</b><br>



      按 <b>Esc</b> 取消当前选中的订单。



    </div>`, [{ label: "知道了", fn: null }]);



}







function clearSelection() {



  selOrder = null;



  renderAll();



}







function undoAssign() {



  const a = G.lastAssign;



  if (!a) return;



  undoOrder(a.orderId);



}







/* 撤回某一单（点订单卡上的「↩ 撤回」） */



function undoOrder(orderId) {



  const o = G.orders.find(x => x.id === orderId);



  if (!o) return;



  if (!o.crew.length && !o.assignedTo) return;



  const n = o.crew.length;



  o.crew.forEach(wid => {



    if (typeof wid === "string" && wid.indexOf("ai:") === 0) {



      const ai = G.staff.find(s => s.id === wid.slice(3));



      if (ai) ai.working = null;



      G.compute += 3;



      G.usedToday = Math.max(0, (G.usedToday || 0) - 3);



      return;



    }



    const w = G.workers.find(x => x.id === wid);



    if (w) {
      w.busy = null;
      G.compute += computeCostOf(w);
      G.usedToday = Math.max(0, (G.usedToday || 0) - computeCostOf(w));
    }



  });



  const ai = G.staff.find(s => s.id === o.assignedTo);



  if (ai) {



    if (typeof o.moodDelta === "number") ai.mood = clamp(ai.mood - o.moodDelta);



    bubble(ai, "那先撤下来");



  }



  o.crew = [];



  o.assignedTo = null;



  o.moodDelta = 0;



  if (G.lastAssign && G.lastAssign.orderId === orderId) G.lastAssign = null;



  toast(`已撤回派单，${n} 人回到空闲，算力已返还`, "");



  log(`↩ 撤回「${o.title}」的派单`);



  save();



  renderAll();



}







function renderTop() {



  $("rDay").textContent = G.day;



  const hb = $("hrBadge");



  if (hb && G.workers) hb.textContent = G.workers.length + " 人";



  $("rCash").textContent = Math.round(G.cash);
  // 现金旁边：一排小鲸鱼娘，随金额一格格亮起来（不写文字）
  try {
    const _rt = (CFG.rankTiers && CFG.rankTiers[CFG.diff.id]) || { S: 1e7, A: 1e7, B: 1e7, C: 1e7 };
    const _c = G.cash;
    const _marks = [0, _rt.C, _rt.B, _rt.A, _rt.S];
    let _stage = 0;
    for (let i = 1; i < _marks.length; i++) if (_c >= _marks[i]) _stage = i;

    let el = document.getElementById("rankPip");
    if (!el) {
      el = document.createElement("span");
      el.id = "rankPip";
      el.style.cssText = "display:inline-flex;align-items:center;gap:1px;margin-left:7px;vertical-align:middle;user-select:none";
      const host = $("rCash");
      if (host && host.parentElement) host.parentElement.appendChild(el);
    }
    if (el) {
      // 五个阶段各一张不同表情：累→思考→期待→开心→超兴奋
      const _faces = [
        "assets/rankpet5.webp",
        "assets/rankpet1.webp",
        "assets/rankpet3.webp",
        "assets/rankpet2.webp",
        "assets/rankpet4.webp",
      ];
      let html = "";
      for (let i = 0; i < 5; i++) {
        const lit = i <= _stage;
        const cur = i === _stage;
        html += `<img src="${_faces[i]}" alt="" onclick="showPetBig('${_faces[i]}')"
          style="width:18px;height:18px;object-fit:contain;border-radius:50%;cursor:zoom-in;
                 opacity:${lit ? 1 : 0.18};
                 filter:${lit ? "none" : "grayscale(1) brightness(.55)"};
                 ${cur ? "animation:pipBob 1.8s ease-in-out infinite;" : ""}" />`;
      }
      el.innerHTML = html;
    }
  } catch (e) {}



  $("rCompute").textContent = Math.round(G.compute);



  $("rRep").textContent = Math.round(G.reputation);



  $("rMorale").textContent = Math.round(G.morale);



  $("rInvestor").textContent = Math.round(G.investor);



}







function renderOrders() {



  const box = $("orders");



  box.innerHTML = "";



  $("orderCount").textContent = G.orders.length + " 单";



  G.orders.forEach(o => {



    const d = document.createElement("div");



    const busy = !!o.assignedTo;



    d.className = "order" + (selOrder === o.id ? " sel" : "") + (busy ? " busy" : "");



    const t = CFG.types[o.type];



    const groups = [...new Set((o.crew || []).map(id => {



      if (typeof id === "string" && id.indexOf("ai:") === 0) return id.slice(3);



      const w = G.workers.find(x => x.id === id);



      return w ? w.aiId : null;



    }).filter(Boolean))].map(id => (G.staff.find(s => s.id === id) || {}).name).filter(Boolean);



    const groupTxt = groups.length ? " · " + groups.join(" / ") + " 组" : "";



    d.innerHTML = `



      <div class="row1">



        <span class="tag" style="color:${t.color};border-color:${t.color}44">${t.name}</span>



        ${o.modName ? `<span class="tag" style="color:${o.modColor};border-color:${o.modColor}55;background:${o.modColor}18">${o.modName}</span>` : ""}



        <span class="stars">${"★".repeat(o.stars)}</span>



        <span class="dl" style="margin-left:auto">剩 ${o.daysLeft} 天</span>



      </div>



      <div class="title">${o.title}</div>



      <div class="meta"><span>💰 ${o.reward}</span><span>⚡ ${o.computeCost}</span><span>${o.client || ""}</span></div>



      <div class="meta" style="margin-top:3px"><span>进度 ${Math.min(100, Math.round(o.progress / o.need * 100))}%${o.minCrew ? " · 需 " + o.minCrew + " 人" : ""}</span></div>



      <div class="bar"><i style="width:${Math.min(100, o.progress / o.need * 100)}%"></i></div>



      ${(o.crew || []).length



        ? `<div class="task" style="margin-top:6px;text-align:left">👥 ${o.crew.length} 人在做${groupTxt}



             <button class="mini" onclick="event.stopPropagation();undoOrder(${o.id})">↩ 撤回</button></div>`



        : ""}`;



    d.onclick = () => {







      const wasWorker = selWorker;
    selOrder = (selOrder === o.id ? null : o.id);
    selStaff = null;
    selWorker = null;
    renderAll();
    // 如果先前选的是某个组员，点订单就直接进这个组的派单预览
    if (selOrder && wasWorker) {
      const wk = (G.workers || []).find((x) => x.id === wasWorker);
      if (wk && wk.aiId && !wk.busy && !wk.mustRest) {
        selStaff = wk.aiId;
        showAssignPreview(selOrder, wk.aiId);
      } else if (wk && (wk.busy || wk.mustRest)) {
        toast(`${wk.name} 正在忙或需要休息，换个单或先撤回`, "warn");
      }
    }



      guideAdvance("orderSelected");



    };



    box.appendChild(d);



  });



}







/* 渲染兜底：任何异常都不让画面变成全白 */



function safeRender(fn, floorEl, fallbackText) {



  try { fn(); } catch (err) {



    console.error(err);



    if (floorEl) {



      floorEl.innerHTML = `<div style="padding:26px;color:#8ea3c9;font-size:13px;text-align:center">



        ${fallbackText || "场景渲染出错"}<br><span style="font-size:11px;color:#63748f">${String(err && err.message || err)}</span></div>`;



    }



  }



}







function renderOffice() {



  const floor = $("floor");



  if (!floor) return;



  floor.innerHTML = "";



  if (document.body && document.body.classList && document.body.classList.contains("scene")) {



    safeRender(() => renderOfficeScene(floor), floor, '办公室场景加载失败，可点右上角「🗂 卡片」切回列表');



    return;



  }



  G.staff.forEach(s => {



    const d = document.createElement("div");



    d.className = "desk" + (selStaff === s.id ? " sel" : "") + (s.working ? " busy" : "");



    const team = (G.workers || []).filter(w => w.aiId === s.id);



    const busyCount = team.filter(w => w.busy).length;



    const expanded = selStaff === s.id;







    const rows = team.map((w, idx) => {



      const st = Math.round(w.stamina);



      const jo = w.busy ? G.orders.find(x => x.id === w.busy) : null;



      const stateTxt = w.mustRest ? "😵 强制休息中" : (jo ? "在做「" + jo.title + "」" : "空闲");



      const cls = "wrow" + (selWorker === w.id ? " sel" : "") + (w.busy ? " busy" : "") + (st < 30 ? " tired" : "") + (w.mustRest ? " rest" : "");



      const allSkills = Object.keys(w.skills).map(k => CFG.types[k].name + w.skills[k]).join(" ");



      return `<div class="${cls}" title="${w.name}｜体力 ${st}%｜${allSkills}"



        onclick="event.stopPropagation();clickWorker('${w.id}')">



        <span class="widx">${idx + 1}</span>



        <span class="wname">${w.name}</span>



        <span class="wbar"><i style="width:${st}%"></i></span>



        <span class="wstate">${stateTxt}</span>
        <span class="wwage" title="日薪">¥${w.wage}</span>



        <span class="wsell" title="卖掉换钱" onclick="event.stopPropagation();sellWorker('${w.id}')">×</span>



      </div>`;



    }).join("");







    const leadBusy = !!s.working;



    const leadRow = `<div class="wrow lead${leadBusy ? " busy" : ""}"



      onclick="event.stopPropagation();clickLead('${s.id}')"



      title="点一下查看主管详情（要亲自上阵请用右侧按钮）">



      <span class="widx">★</span>



      <span class="wname">${s.name}<em>（主管）</em></span>



      <span class="wbar" title="精力 = 100 − 疲劳（当前疲劳 ${Math.round(s.fatigue)}）"><i style="width:${100 - s.fatigue}%"></i></span>



      <span class="wsmark">精力</span>



      <span class="wstate">${leadBusy



        ? "连上 " + ((s.streak || 0) + 1) + " 天 · 疲劳 +" + Math.min(CFG.leadFatigueMax, CFG.leadFatigueBase + (s.streak || 0) * CFG.leadFatigueStep)



        : "可以亲自上"}</span>



    </div>`;



    const autoBtn = (expanded && selOrder)



      ? `<button class="autoPickBtn" onclick="event.stopPropagation();assign(${selOrder}, '${s.id}')">



           🚀 让 ${s.name} 自己挑人上



         </button>`



      : "";



    const teamHTML = expanded



      ? `<div class="teamlist">${autoBtn}${leadRow}${rows}</div>`



      : `<div class="teamline"><span>手下 ${team.length} 人</span><span>${busyCount ? busyCount + " 人在忙" : "全部空闲"} · 点我展开</span></div>`;







    d.innerHTML = `



      <div class="bubble ${s.bubble && s.bubbleT > 0 ? "on" : ""}">${s.bubble || ""}</div>



      ${s.portrait



        ? `<img class="avatar" src="${s.portrait}" alt="${s.name}">`



        : `<div class="avatar ph" title="形象未确认，待补充">?</div>`}



      <div class="nm">${s.name}</div>



      <div class="role">${s.role} · Lv.${s.level}</div>



      <div class="mrow"><span>心情</span><span class="b mood"><i style="width:${s.mood}%"></i></span></div>



      <div class="mrow"><span>疲劳</span><span class="b fatigue"><i style="width:${s.fatigue}%"></i></span></div>



      <div class="mrow"><span>信任</span><span class="b trust"><i style="width:${s.trust}%"></i></span></div>



      ${teamHTML}`;







    d.onclick = () => {



      // 正在看这组的员工 → 点一下切回主管；已经在看主管 → 再点一下收起



      const lookingAtWorker = !!selWorker;



      if (selStaff === s.id && !lookingAtWorker) {



        selStaff = null;



      } else {



        selStaff = s.id;



        selWorker = null;



      }



      renderAll();



    };



    floor.appendChild(d);



  });



}







function renderPanel() {



  const box = $("panel");







  // 前 3 天：动手清单（两个分支都显示）



  const doneAssign = G.orders.some(o => o.crew.length > 0);



  const doneSelect = !!selOrder || doneAssign;



  const doneEnd = G.day >= 2;



  const todoCard = (G.day <= 3 && !G.finished) ? `



      <div class="pcard todo">



        <h3>今天要做的</h3>



        <div class="todoline ${doneSelect ? "ok" : ""}"><span>${doneSelect ? "✅" : "①"}</span>点左边一张订单</div>



        <div class="todoline ${doneAssign ? "ok" : ""}"><span>${doneAssign ? "✅" : "②"}</span>点 AI 卡或员工把人派出去</div>



        <div class="todoline ${doneEnd ? "ok" : ""}"><span>${doneEnd ? "✅" : "③"}</span>点右下角「结束今天」</div>



        <div class="todofoot">每天重复这三步就行</div>



      </div>` : "";







  // ① 选中了某个下属 → 显示他的详情



  const wSel = G.workers.find(w => w.id === selWorker);



  if (wSel) {



    const ai = G.staff.find(x => x.id === wSel.aiId);



    const st = Math.round(wSel.stamina);



    const jo = wSel.busy ? G.orders.find(o => o.id === wSel.busy) : null;



    const price = sellPrice(wSel);



    const skRows = Object.keys(wSel.skills).map(k =>



      `<div class="skill"><span>${CFG.types[k].name}</span><span class="b"><i style="width:${wSel.skills[k] * 20}%"></i></span><span>${wSel.skills[k]}</span></div>`



    ).join("");



    $("pTitle").textContent = wSel.name;



    $("pDay").textContent = (ai ? ai.name + " 组" : "");



    box.innerHTML = `



      <div class="pcard">



        <h3>${wSel.name} <span style="font-weight:400;color:#8ea3c9;font-size:11px">${ai ? ai.name + " 组" : ""}</span></h3>



        <div class="skill" style="margin-bottom:8px"><span>状态</span><span style="color:${jo ? "#ffc861" : "#59d98c"};font-size:11.5px">${jo ? "在做「" + jo.title + "」" : "空闲"}</span></div>



        <div class="skill" style="margin-bottom:8px"><span>体力</span><span style="color:${st < 30 ? "#ff6b6b" : "#b6ff8a"};font-size:11.5px">${st}%</span></div>



        ${skRows}



      </div>



      <div class="pcard">



        <h3>操作</h3>



        ${selOrder ? `<button class="pickbtn" onclick="pickWorker('${wSel.id}')">👤 让 TA 做当前订单</button>` : ""}



        <div class="btnrow">



          <button onclick="stepWorker('${wSel.id}', -1)">◀ 上一个</button>



          <button onclick="stepWorker('${wSel.id}', 1)">下一个 ▶</button>



        </div>



        <div class="btnrow" style="margin-top:7px">



          <button onclick="coffeeWorker('${wSel.id}')" ${wSel.stamina >= 100 ? "disabled" : ""} onmouseenter="showActionTip('wcoffee')" onmouseleave="hideActionTip()">☕ 咖啡 ¥${CFG.coffeeCost}</button>



          <button onclick="raiseWorker('${wSel.id}')" ${(wSel.raiseCd || 0) > 0 ? "disabled" : ""} onmouseenter="showActionTip('wraise')" onmouseleave="hideActionTip()">${(wSel.raiseCd || 0) > 0 ? `加薪冷却 ${wSel.raiseCd} 天` : `💵 加薪 ¥${wSel.tier === "elite" ? 800 : (wSel.tier === "senior" ? 400 : 200)}`}</button>
          <button onclick="sellWorker('${wSel.id}')" ${wSel.busy ? "disabled" : ""} onmouseenter="showActionTip('sell')" onmouseleave="hideActionTip()">💸 卖掉 ¥${price}</button>



        </div>



        <div class="btnrow" style="margin-top:7px">



          <button onclick="selWorker=null;renderAll()">返回</button>



        </div>



        <p style="font-size:11px;color:#7f93b8;margin:8px 0 0">



          日薪 ¥${wSel.wage} · 卖掉后不再发工资



        </p>



      </div>`;



    return;



  }







  const s = G.staff.find(x => x.id === selStaff);



  $("pTitle").textContent = s ? s.name : "员工详情";



  $("pDay").textContent = G.finished ? "已结束" : `目标 ${CFG.days} 天`;







  if (!s) {



    const busy = G.workers.filter(w => w.busy).length;



    const avgMood = Math.round(G.staff.reduce((a, x) => a + x.mood, 0) / G.staff.length);



    const bar = (label, val, color) => `<div class="ovrow"><span>${label}</span>



      <span class="ovbar"><i style="width:${Math.max(0, Math.min(100, val))}%;background:${color}"></i></span>



      <b>${Math.round(val)}</b></div>`;



    box.innerHTML = `



      <button class="hrEntry" onclick="goHR()">



        <svg class="hi-svg" viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="9.5" width="20" height="19" rx="6" fill="#7fb3ff"/><path d="M16 3.6 L28.5 10.8 H3.5 Z" fill="#5a8cf0" stroke="#5a8cf0" stroke-width="1" stroke-linejoin="round"/><circle cx="12.4" cy="17.4" r="2.5" fill="#16233d"/><circle cx="19.6" cy="17.4" r="2.5" fill="#16233d"/><circle cx="13.3" cy="16.5" r="1" fill="#fff"/><circle cx="20.5" cy="16.5" r="1" fill="#fff"/><ellipse cx="9.2" cy="20.8" rx="2" ry="1.2" fill="#ff9bb3" opacity=".8"/><ellipse cx="22.8" cy="20.8" rx="2" ry="1.2" fill="#ff9bb3" opacity=".8"/><path d="M13.6 21.6 Q16 24.2 18.4 21.6" stroke="#16233d" stroke-width="1.6" fill="none" stroke-linecap="round"/><rect x="14.2" y="24.2" width="3.6" height="4.3" rx="1.6" fill="#3f6fbf" opacity=".8"/></svg>



        <span class="hi-tx"><b>管理中心</b></span>



      </button>



    <button class="hrEntry bag-entry" onclick="goHistory()">



      <span class="hi-svg" style="font-size:20px">📜</span>



      <span class="hi-tx"><b>历史</b></span>



    </button>



    <button class="hrEntry bag-entry" onclick="goBag()">



      <span class="hi-svg" style="font-size:20px">🎒</span>



      <span class="hi-tx"><b>背包</b></span>



    </button>



    ${todoCard}



      <div class="pcard">



        <h3>公司概况</h3>



        ${bar("资金", Math.min(100, G.cash / 300), "#ffc861")}



        ${bar("口碑", G.reputation, "#59d98c")}



        ${bar("士气", G.morale, "#6aa9ff")}



        ${bar("投资人", G.investor, "#b48cff")}



        <div class="ovrow"><span>算力</span><span class="ovbar"><i style="width:${Math.min(100, G.compute)}%;background:#7de3ff"></i></span><b>${Math.round(G.compute)}</b></div>







      <div class="ovnote">



        今日算力 <b style="color:${(G.usedToday || 0) > effFreeCompute() ? "#ff9b9b" : "#7de3ff"}">${G.usedToday || 0} / ${effFreeCompute()}</b>${(G.quotaPenalty || 0) > 0 ? ` <span style="font-size:10px;color:#ff9b9b">(-${G.quotaPenalty})</span>` : ""}



        ${(() => { const o = overloadInfo(); return o.over > 0



          ? `<span style="color:#ff9b9b">· 超载 ${o.over} 点 · 产出 +${Math.round(o.bonus * 100)}% · 日结 -¥${o.fee}</span>`



          : `<span style="color:#7f93b8">· 免费额度内</span>`; })()}



      </div>



        <p style="font-size:11px;color:#7f93b8;margin:9px 0 0;line-height:1.7">



          员工 <b>${G.workers.length}</b> 人，<b>${busy}</b> 人在忙 · 平均心情 <b>${avgMood}</b><br>



          历史最高资金 ¥${Math.round(peakCash())}



        </p>



      </div>



      <div class="pcard"><h3>怎么玩</h3>



        <p style="font-size:11.5px;line-height:1.8;color:#a9bcdd;margin:0">



        1. 左边点一张<b>订单</b><br>



        2. 点 AI 卡让主管挑人，或展开列表自己挑<br>



        3. 点右下「结束今天」推进一天<br>



        4. 撑到第 ${CFG.days} 天看结局



        </p>
        <ol class="tips">
          <li>算力每天有免费额度，昨天没干完的活会占用今天的额度。</li>
          <li>打完一局会记进「📖 图鉴」，三种难度共 15 个结局等你收集。</li>
        </ol>
        <ol class="tips">
          <li><b>第 5 天起</b>结算后会随机触发办公室事件：停电、猫跑进来、客户投诉，也可能是免费算力或老客户回头。频率随机，猜不到。</li>
          <li><b>第 9 天起</b>商店陆续上货：下午茶、体能补给、订单加速器、逾期免罚券……上新时顶部会弹提示。</li>
          <li>顶栏现金旁的小鲸鱼娘会随金额一格格亮起，越亮离下一评级越近。</li>
        </ol>
</div>`;



    return;



  }







  const skills = Object.entries(s.skills).map(([k, v]) =>



    `<div class="skill"><span>${CFG.types[k].name}</span><span class="b"><i style="width:${v * 20}%"></i></span><span>${v}</span></div>`



  ).join("");







  box.innerHTML = `



    <button class="hrEntry" onclick="goHR()">



      <svg class="hi-svg" viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="9.5" width="20" height="19" rx="6" fill="#7fb3ff"/><path d="M16 3.6 L28.5 10.8 H3.5 Z" fill="#5a8cf0" stroke="#5a8cf0" stroke-width="1" stroke-linejoin="round"/><circle cx="12.4" cy="17.4" r="2.5" fill="#16233d"/><circle cx="19.6" cy="17.4" r="2.5" fill="#16233d"/><circle cx="13.3" cy="16.5" r="1" fill="#fff"/><circle cx="20.5" cy="16.5" r="1" fill="#fff"/><ellipse cx="9.2" cy="20.8" rx="2" ry="1.2" fill="#ff9bb3" opacity=".8"/><ellipse cx="22.8" cy="20.8" rx="2" ry="1.2" fill="#ff9bb3" opacity=".8"/><path d="M13.6 21.6 Q16 24.2 18.4 21.6" stroke="#16233d" stroke-width="1.6" fill="none" stroke-linecap="round"/><rect x="14.2" y="24.2" width="3.6" height="4.3" rx="1.6" fill="#3f6fbf" opacity=".8"/></svg>



      <span class="hi-tx"><b>管理中心</b></span>



    </button>



    ${todoCard}



    <div class="pcard">







      <h3>${s.name} <span style="font-weight:400;color:#8ea3c9;font-size:11px">${s.role}</span></h3>



      <div class="skill" style="margin-bottom:8px"><span>喜欢</span><span style="color:#b6ff8a;font-size:11.5px">${s.like}</span></div>



      <div class="skill" style="margin-bottom:8px"><span>讨厌</span><span style="color:#ff9b9b;font-size:11.5px">${s.hate}</span></div>



      ${skills}



    </div>



    <div class="pcard">



      <h3>管理手段 <span style="font-weight:400;color:#7f93b8;font-size:10.5px">精力 = 100 − 疲劳</span></h3>



      ${s.resting ? `<div class="task" style="margin:0 0 8px;border-color:#3f6f9f;color:#9fc2ff">😴 正在休息中，明天结算时恢复</div>` : ""}



      ${selOrder ? `<button class="pickbtn" onclick="showWorkerPicker(${selOrder}, '${s.id}')" onmouseenter="showActionTip('pickTeam')" onmouseleave="hideActionTip()">👥 让 ${s.name} 挑人做当前订单</button>` : ""}



      ${selOrder ? `<button class="pickbtn leadbtn" onclick="pickLead('${s.id}')" onmouseenter="showActionTip('pickLead')" onmouseleave="hideActionTip()">🧠 让 ${s.name} 亲自上</button>` : ""}



      ${(s.streak || 0) > 0 ? `<div class="task" style="margin:6px 0 0;border-color:#6b2f2f;color:#ff9b9b">🔥 已连上 ${s.streak} 天，下次上阵疲劳 +${Math.min(CFG.leadFatigueMax, CFG.leadFatigueBase + s.streak * CFG.leadFatigueStep)}（上限 ${CFG.leadFatigueMax}）</div>` : ""}



      <div class="btnrow">



        <button onclick="doCoffee('${s.id}')" onmouseenter="showActionTip('coffee')" onmouseleave="hideActionTip()">☕ 咖啡 ¥80</button>



        ${s.resting



          ? `<button class="gold" onclick="cancelRest('${s.id}')" onmouseenter="showActionTip('cancelRest')" onmouseleave="hideActionTip()">↩ 取消休息</button>`



          : `<button onclick="doRest('${s.id}')" onmouseenter="showActionTip('rest')" onmouseleave="hideActionTip()">😴 休息一天</button>`}



        <button onclick="doTalk('${s.id}')" onmouseenter="showActionTip('talk')" onmouseleave="hideActionTip()">💬 谈话 ¥200</button>



        <button onclick="doRaise('${s.id}')" onmouseenter="showActionTip('raise')" onmouseleave="hideActionTip()">💵 加薪 ¥600</button>



      </div>



      <p style="font-size:11px;color:#7f93b8;margin:8px 0 0">



        工资 ¥${s.wage}/天 · 谈话冷却 ${s.talkCd} 天 · 加薪冷却 ${s.raiseCd} 天



      </p>



    </div>`;



}







/* =========================================================



   派单 / 管理



   ========================================================= */



function pickWorker(workerId) {



  const w = G.workers.find(x => x.id === workerId);



  if (!w) return;



  if (w.mustRest) { toast(`${w.name} 体力见底，明天得休息`, "warn"); return; }



  if (!selOrder) {



    toast(`先点一张订单，再点 ${w.name} 派活`, "warn");



    selStaff = w.aiId;



    renderAll();



    return;



  }



  const o = G.orders.find(x => x.id === selOrder);



  if (!o) return;







  // 已在别的单上



  if (w.busy && w.busy !== o.id) {



    toast(`${w.name} 正在做别的单，先撤回那张`, "warn");



    return;



  }



  // 从这单撤下



  if (w.busy === o.id) {



    w.busy = null;



    o.crew = o.crew.filter(id => id !== workerId);



    G.compute += CFG.workerCompute;



    G.usedToday = Math.max(0, (G.usedToday || 0) - CFG.workerCompute);



    if (!o.crew.length) o.assignedTo = null;



    log(`${w.name} 从「${o.title}」撤下`);



    selWorker = w.id;   // 右侧同步显示这名员工



    renderAll();



    return;



  }



  // 加入这单



  if (G.compute < CFG.workerCompute) {



    toast(`算力不足：派一人要 ${CFG.workerCompute}，当前只有 ${G.compute}`, "bad");



    return;



  }



  G.compute -= CFG.workerCompute;



  G.usedToday = (G.usedToday || 0) + CFG.workerCompute;



  w.busy = o.id;



  o.crew.push(workerId);



  o.assignedTo = w.aiId;



  selStaff = w.aiId;



  selWorker = w.id;   // 右侧同步显示这名员工



  log(`${w.name} 加入「${o.title}」（共 ${o.crew.length} 人）`);



  renderAll();



}



/* 点 AI 卡 = 让这位主管自己挑人上阵 */



/* 给某个下属买咖啡回体力 */



function coffeeWorker(wid) {
  selWorker = wid;



  const w = G.workers.find(x => x.id === wid);



  if (!w) return;



  if (w.stamina >= 100) { toast(`${w.name} 体力已经满了`, "warn"); return; }



  if (G.cash < CFG.coffeeCost) {



    toast(`资金不足：咖啡要 ¥${CFG.coffeeCost}，当前 ¥${Math.round(G.cash)}，还差 ¥${Math.round(CFG.coffeeCost - G.cash)}`, "bad");



    return;



  }



  G.cash -= CFG.coffeeCost;



  w.stamina = clamp(w.stamina + CFG.coffeeRecover);



  toast(`${w.name} 喝了咖啡，体力 +${CFG.coffeeRecover}`, "");



  save();



  renderAll();



  renderHR();



}







/* 在同一部门里切换到上一个/下一个员工 */



function stepWorker(wid, dir) {



  const w = G.workers.find(x => x.id === wid);



  if (!w) return;



  const team = G.workers.filter(x => x.aiId === w.aiId);



  let i = team.findIndex(x => x.id === wid);



  i = (i + dir + team.length) % team.length;



  selWorker = team[i].id;



  selStaff = w.aiId;



  renderAll();



}







/* 点员工：有订单就派活，没订单就看详情 */



function clickWorker(wid) {
  const _w = (G.workers || []).find((x) => x.id === wid);
  if (!_w) return;

  // 先同步选中的主管，右侧面板才不会还挂着上一个人的数据
  selStaff = _w.aiId;

  // 有选中订单 → 直接派活
  if (selOrder) {
    selWorker = wid;
    pickWorker(wid);
    return;
  }

  // 没订单 → 正常选中 / 再点一次取消
  selWorker = (selWorker === wid) ? null : wid;
  renderAll();
}







/* =========================================================



   2D 斜视办公室场景



   ========================================================= */



/* =========================================================



   2D 斜视办公室（SVG 程序化绘制）



   ========================================================= */



/* =========================================================



   2D 等距办公室（背景是预渲染的 3D 图，上面叠交互层）



   ========================================================= */



const OFFICE_BG = "assets/iso/office_bg.jpg";



const OFFICE_W = 3840, OFFICE_H = 2160;







/* 每个部门自己的 3D 房间（独立渲染，1200×820） */



const ROOM_W = 1240, ROOM_H = 848;



const ROOM_BG = {



  claude:   "assets/iso/room_claude.jpg",



  deepseek: "assets/iso/room_deepseek.jpg",



  gemini:   "assets/iso/room_gemini.jpg",



  grok:     "assets/iso/room_grok.jpg",



  chatgpt:  "assets/iso/room_chatgpt.jpg",



};



const ROOM_ANCHOR = {



  boss: { x: 620, y: 398 },



  seats: [{ x: 505, y: 508 }, { x: 690, y: 523 }, { x: 600, y: 668 }],



};



/* 5 个工位在背景图上的像素坐标（由 3D 场景投影得到） */



const OFFICE_SPOTS = [



  { x: 1388, y: 372 }, { x: 1206, y: 940 }, { x: 2220, y: 838 },



  { x: 2036, y: 1406 }, { x: 3050, y: 1304 },



];







/* 部门铭牌放在空白处，箭头指向各自工位 */



const OFFICE_LABELS = [



  { x: 1120, y: 236, a: 0 }, { x: 860, y: 1140, a: 1 }, { x: 2490, y: 1040, a: 2 },



  { x: 1720, y: 1600, a: 3 }, { x: 2720, y: 1490, a: 4 },



];







function arrowLayer() {



  if (roomFocus) return "";



  return G.staff.map((s, i) => {



    const sp = OFFICE_SPOTS[i] || OFFICE_SPOTS[0];



    const p = OFFICE_LABELS[i] || OFFICE_LABELS[0];



    const role = (s.role || "").replace(/·.*/, "");



    const label = `${s.name} 工作室`;



    const w = Math.max(108, label.length * 14 + 24);



    const h = 38;



    // 小箭头：从铭牌边缘出发，短、实线、带箭头，落点靠近房间



    const dx = sp.x - p.x, dy = sp.y - p.y;



    const len = Math.hypot(dx, dy) || 1;



    const ux = dx / len, uy = dy / len;



    const sx = p.x + ux * (w / 2 + 3), sy = p.y + uy * (h / 2 + 3);



    const gap = 108;                                  // 箭头尖端离房间中心的距离



    const ex = sp.x - ux * gap, ey = sp.y - uy * gap;



    const ang = Math.atan2(ey - sy, ex - sx);



    const ah = 11;



    const a1x = ex - ah * Math.cos(ang - 0.5), a1y = ey - ah * Math.sin(ang - 0.5);



    const a2x = ex - ah * Math.cos(ang + 0.5), a2y = ey - ah * Math.sin(ang + 0.5);



    return `<g class="officeLabel" onclick="openRoom('${s.id}')" style="cursor:pointer">



      <line x1="${sx}" y1="${sy}" x2="${ex - ux * ah * 0.7}" y2="${ey - uy * ah * 0.7}" stroke="#6c7788" stroke-width="2.8" stroke-linecap="round"/>



      <polygon points="${ex},${ey} ${a1x},${a1y} ${a2x},${a2y}" fill="#6c7788"/>



      <rect x="${p.x - w / 2}" y="${p.y - h / 2}" width="${w}" height="${h}" rx="9"



            fill="rgba(255,255,255,.94)" stroke="#c8c2b5" stroke-width="1.6"/>



      <text x="${p.x}" y="${p.y - 2}" text-anchor="middle" font-size="15" font-weight="700"



            fill="#3a4459" font-family="system-ui,-apple-system,'PingFang SC',sans-serif">${label}</text>



      <text x="${p.x}" y="${p.y + 15}" text-anchor="middle" font-size="11"



            fill="#8593a8" font-family="system-ui,-apple-system,'PingFang SC',sans-serif">${role}</text>



    </g>`;



  }).join("");



}







function renderOfficeScene(floor) {



  if (roomFocus) { renderRoomView(floor); return; }



  const chars = G.staff.map((s, i) => {



    if (roomFocus && s.id !== roomFocus) return "";



    const sp = OFFICE_SPOTS[i] || OFFICE_SPOTS[0];



    const left = (sp.x / OFFICE_W * 100).toFixed(2);



    const top = (sp.y / OFFICE_H * 100).toFixed(2);



    const sel = selStaff === s.id;



    const team = (G.workers || []).filter(w => w.aiId === s.id);



    const pipsHtml = team.map(w => {



      const col = w.mustRest ? "#ef7a7a" : (w.busy ? "#f0a63c" : "#6fc48b");



      return `<i style="background:${col}"></i>`;



    }).join("");



    return `<div class="sceneChar${sel ? " sel" : ""}" data-ai="${s.id}" style="left:${left}%;top:${top}%" onclick="openRoom('${s.id}')">



      <div class="scTag">${s.name}</div>



      <img class="scHead" src="${s.portrait}" alt="${s.name}">



      <div class="scPips">${pipsHtml}</div>



      ${s.working ? `<div class="scBusy">在做活</div>` : ""}



    </div>`;



  }).join("");







  // 每个部门的组员，站在各自的组员间里
  const MAX_SHOW = 12;
  const staffChars = G.staff.map((s) => {
    const team = (G.workers || []).filter(w => w.aiId === s.id);
    const shown = team.slice(0, MAX_SHOW);
    const more = team.length - shown.length;
    let html = shown.map((w, k) => {
      const col = w.mustRest ? "#ef7a7a" : (w.busy ? "#f0a63c" : "#6fc48b");
      return `<div class="sceneWorker" data-ai="${s.id}" data-k="${k}" data-worker="${w.id}" data-total="${team.length}" onclick="clickWorker('${s.id}', '${w.id}')">
        <div class="swTag">${w.name}</div>
        <div class="swHead" style="border-color:${col}">${s.name.charAt(0)}</div>
      </div>`;
    }).join("");
    if (more > 0) {
      html += `<div class="sceneWorker swMore" data-ai="${s.id}" data-k="${MAX_SHOW}" data-total="${team.length}" onclick="selStaff='${s.id}';renderAll()">
        <div class="swHead swHeadMore">+${more}</div>
      </div>`;
    }
    return html;
  }).join("");

  const focusIdx = roomFocus ? G.staff.findIndex(x => x.id === roomFocus) : -1;



  const focusSpot = focusIdx >= 0 ? (OFFICE_SPOTS[focusIdx] || OFFICE_SPOTS[0]) : null;



  const zoom = focusSpot



    ? `style="transform-origin:${(focusSpot.x / OFFICE_W * 100).toFixed(2)}% ${((focusSpot.y - 150) / OFFICE_H * 100).toFixed(2)}%; transform:scale(1.75)"`



    : "";







  floor.innerHTML = `



    <div class="sceneWrap">



      <div class="sceneStage${focusSpot ? " zoomed" : ""}" ${zoom}>



        <div class="scene3d"></div>



        



        ${chars}
        ${staffChars}



      </div>



      ${zoomBarHtml()}



    </div>`;







  bindSceneInput(floor);



  fitLater(floor);



}







/* 滚轮缩放 / 按住拖动 / 双指捏合 */



let __sceneBound = false;



function bindSceneInput(floor) {



  if (typeof window === "undefined") return;



  const wrap = floor.querySelector(".sceneWrap");



  if (!wrap) return;







  wrap.addEventListener("wheel", (e) => {



    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 0) {



      e.preventDefault();



      const k = e.deltaY > 0 ? 0.92 : 1.08;



      setSceneZoom(sceneZoom * k, true);



    }



  }, { passive: false });







  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0, moved = 0;



  const down = (e) => {



    if (e.target.closest("button") || e.target.closest(".officeLabel") || e.target.closest(".sceneChar")) return;



    dragging = true; moved = 0;



    const p = e.touches ? e.touches[0] : e;



    sx = p.clientX; sy = p.clientY; ox = scenePanX; oy = scenePanY;



  };



  const move = (e) => {



    if (!dragging) return;



    const p = e.touches ? e.touches[0] : e;



    const dx = p.clientX - sx, dy = p.clientY - sy;



    moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));



    if (moved > 4) e.preventDefault();



    scenePanX = ox + dx; scenePanY = oy + dy;



    fitScene(floor);



  };



  const up = () => { dragging = false; };







  wrap.addEventListener("mousedown", down);



  wrap.addEventListener("touchstart", down, { passive: true });



  window.addEventListener("mousemove", move);



  wrap.addEventListener("touchmove", move, { passive: false });



  window.addEventListener("mouseup", up);



  wrap.addEventListener("touchend", up);







  // 双指捏合



  let pinchStart = 0, zoomStart = 1;



  wrap.addEventListener("touchstart", (e) => {



    if (e.touches.length === 2) {



      pinchStart = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,



                              e.touches[0].clientY - e.touches[1].clientY);



      zoomStart = sceneZoom;



    }



  }, { passive: true });



  wrap.addEventListener("touchmove", (e) => {



    if (e.touches.length === 2 && pinchStart > 0) {



      e.preventDefault();



      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,



                           e.touches[0].clientY - e.touches[1].clientY);



      setSceneZoom(zoomStart * (d / pinchStart), true);



    }



  }, { passive: false });



  wrap.addEventListener("touchend", () => { pinchStart = 0; });







  // 恢复上次缩放



  try {



    const z = parseFloat(localStorage.getItem("aicompany_zoom") || "1");



    if (!isNaN(z) && z > 0) sceneZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));



  } catch (e) {}



}







/* 布局稳定后再算尺寸（首次渲染时容器常常还是 0） */


