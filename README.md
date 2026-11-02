# AI 公司大作战

横版 2D 经营 × AI 拟人角色 × 心情驱动的办公室养成游戏。

## 玩法

- 5 个 AI 部门（Claude / DeepSeek / Gemini / Grok / ChatGPT），每个部门有主管和组员
- 接订单 → 派单 → 组员干活 → 交付收钱
- 管理主管的心情、体力、信任，用咖啡 / 休息 / 谈话 / 加薪维持状态
- 每天扣工资和房租，成本逐日上涨，撑满 100 天按现金评级（S / A / B / C / 破产）

## 运行

直接用浏览器打开 index.html，或者起个本地服务器：

``bash
python -m http.server 8899
``

然后访问 http://127.0.0.1:8899/

## 结构

``
index.html            游戏本体（HTML + CSS + JS 单文件）
tools/office3d.js     3D 办公室场景（three.js）
tools/three.module.js three.js 库
assets/               头像、场景图
``
