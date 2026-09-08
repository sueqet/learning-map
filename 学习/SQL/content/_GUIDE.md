# SQL 学习包 · 详解页撰写规范（_GUIDE.md）

> 本文件是**唯一权威规范**。所有 `content/NN-*.html` 必须严格遵守。
> 动手前请先读：`content/_skeleton.html`（可直接复制的骨架，含全部必需结构）与 `content/_patterns.md`（交互面板可复制模式）。
> 各模块的 id / 文件名 / prev / next 见 `content/_modules.md`。

---

## 0. 一句话目标

写出一份**能照着学、能动手试、能自测**的中文详解页：目标清晰、讲解到位、**至少 1 个可交互演示面板**、8–12 道带解析的考核题。

---

## 1. 文件与命名（硬性）

- 路径：`D:\DSH\Project\User\学习\SQL\content\<NN>-<slug>.html`（两位数字前缀，与 `index.html` 的 `MODULES[].file` 一致）。
- 编码 **UTF-8 无 BOM**，`<html lang="zh-CN">`。
- **不要**新建任何文件；**不要**改动 `assets/`、`_skeleton.html`、其它页面。
- 页面必须能被**双击直接打开**（相对路径，无构建工具）。

### 1.1 样式占位符（重要）

**不要手写 `<style>` 内容**。`<head>` 里必须原样写这一行：

```html
<style>/*__SHARED_STYLE__*/</style>
```

提交后由维护脚本把共享设计系统（`assets/learn.css`）注入这个占位符，最终产物与 `04-joins.html`、DSA 等学习包完全一致。校验脚本会检查该占位符是否存在。

---

## 2. 页面结构（照抄 `_skeleton.html`，只改内容）

```
<head>
  <title>{模块标题} · SQL / 数据库</title>
  <meta name="description" content="SQL / 数据库学习网页 —— {模块标题}：学习目标、知识点讲解、交互演示面板、考核与答题。">
  <style>/*__SHARED_STYLE__*/</style>        ← 原样保留
</head>
<body>
  <nav class="topnav">  ← 照抄
  <div class="hero">    ← 照抄（标题/引言由 JS 用 CONFIG 填）
  <div class="wrap">
    <section class="goals card" id="goals">      ← 3–6 条学习目标
    <section class="prereq">                     ← 前置知识
    <section class="chap">…</section>             ← 可选：分组小标题（知识点多时用，每 2–3 个一组）
    <section class="topic" id="{知识点id}"> × N   ← 每个知识点一个，顺序 = index.html 中 pts 顺序
    <section class="quiz" id="quiz">              ← 照抄
    <section class="challenge">                   ← 2–4 条进阶挑战
    <div class="master">                          ← 照抄
  </div>
  <footer class="footer">  ← 照抄
  <script src="assets/sql-sandbox.js"></script>          ← 必须
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>  ← 必须
  <script> CONFIG + QUZ + 照抄的三段引擎 JS + 本页演示面板挂载 </script>
</body>
```

### 2.1 每个知识点块的固定写法

```html
<section class="topic" id="{知识点id}">
  <div class="topic-head">
    <h3><span class="kno">知识点</span>{知识点标题}<span class="pt">英文/slug · 一句话定位</span></h3>
    <label class="ptmark"><input type="checkbox" data-key="{moduleId}::{知识点id}"><span>已学会</span></label>
  </div>
  <p>定义 + 核心思想 + 为什么重要（2–4 句，把「是什么/为什么/怎么用」讲清）。</p>
  <ul><li>关键结论 1</li><li>关键结论 2</li></ul>

  <div class="codewrap">
    <div class="cl"><span class="d" style="background:#e0654b"></span><span class="d" style="background:#e8b34b"></span><span class="d" style="background:#57b05b"></span>example.sql</div>
    <pre><code>-- 可运行的 MySQL 8.0 示例
SELECT ...</code></pre>
  </div>

  <table class="tbl">…</table>                 <!-- 对照表/参数表/示例表，至少一处 -->
  <div class="callout key"><span class="i">★</span><p><b>核心要点：</b>…</p></div>
  <div class="callout danger"><span class="i">!</span><p><b>易错：</b>…</p></div>

  <div id="demo-{slug}"></div>                 <!-- 交互演示面板容器（见 §4） -->
</section>
```

**硬性要求（每页）**
- `<section class="topic" id="...">` 的 **id 与数量必须与 `index.html` 里该模块的 `pts[].id` 完全一致**（顺序也一样）。
- `data-key` 一律为 `"{moduleId}::{知识点id}"`，`moduleId` 必须等于 `index.html` 的 `MODULES[].id`。
- 每个知识点：≥1 段正文 + ≥1 个 SQL 代码块 + ≥1 张 `table.tbl`（或 `table.dt`）+ ≥1 个 callout。
- 每页合计：**≥1 个交互演示面板**（建议 2–3 个），**8–12 道考核题**（至少 1 道 `interview`）。
- 术语首次出现给出英文（如「窗口函数 window function」）。
- 语法以 **MySQL 8.0** 为准；与其他数据库（PostgreSQL / SQL Server / Oracle）有差异时用 callout 注明。

---

## 3. CONFIG 与 QUZ

```js
const CONFIG = {
  moduleId: "{moduleId}",                 // 与 index.html 的模块 id 一致
  title: "{模块标题}",
  eyebrow: "MODULE {NN} · SQL / 数据库",
  lead: "一句话说明本模块学什么、为什么重要（40–90 字）。",
  points: ["{id1}","{id2}", …],           // 本页全部知识点 id，顺序与正文一致
  prev: "{上一个文件名}.html",              // 第一页 ""
  next: "{下一个文件名}.html",              // 最后一页 ""
};

const QUZ = [
  { type:"quiz", q:"题干？", sql:"SELECT …;",   // sql 可选
    opts:["A","B","C","D"], ans:1, exp:"解析：为什么对、其它为什么错。" },
];
```

**QUZ 硬性要求**
- 8–12 题；覆盖本模块**每个**知识点（同一知识点可多题）。
- 至少 1 题 `type:"interview"`（面试延伸）。
- `exp` 必须**解释干扰项**，不能只写「因为 A 是对的」。
- 选项长度相近、有迷惑性；`ans` 分散在 0–3，不要全是同一个下标。
- 涉及 SQL 的题目请用 `sql` 字段把 SQL 单独展示，避免题干过长。

---

## 4. 交互演示面板（本学习包的灵魂）

### 4.1 通用 SQL 练习台（首选，页面里最省事、体验最好）

```html
<div id="demo-xxx"></div>
```
```js
SQLSandbox.mount(document.getElementById("demo-xxx"), {
  query: "SELECT c.name, COUNT(*) n FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY c.name;",
  presets: [
    {label:"示例", sql:"SELECT …;"},
    {label:"对比写法", sql:"SELECT …;"}
  ],
  tables: null   // 需要额外表时传 {表名:{columns:[...], rows:[[...]]}}，会自动与内置示例数据合并
});
```
- 引擎能力（已自测通过）：`SELECT [DISTINCT]`、`FROM` 多表 `INNER/LEFT/RIGHT/FULL/CROSS JOIN … ON/USING`、派生表、`WHERE`、`GROUP BY`、`HAVING`、`ORDER BY`、`LIMIT n [OFFSET m] / LIMIT m,n`、`IN/EXISTS/ANY/ALL`、`LIKE`、`BETWEEN`、`IS [NOT] NULL`、`CASE WHEN`、聚合（含 `COUNT(DISTINCT …)`）、常用字符串/日期/数值函数。
- **不支持**：`UNION`、`INSERT/UPDATE/DELETE`、窗口函数（`OVER`）、`WITH`。这些内容请用**手写表格演示**（见 4.2），代码块里正常写语法即可，并在页内说明「练习台不支持，请到真实数据库验证」。
- `presets` 里一定要有**能对比出差异**的两三条（如 LEFT JOIN vs INNER JOIN）。

### 4.2 自定义演示面板（窗口函数 / 索引 / 事务 / 范式等）

统一用 `.demo` 这套 class，保证视觉一致：

```html
<div class="demo">
  <div class="dh"><span class="t">🖥 演示：RANK vs DENSE_RANK</span><span class="hint">点按钮看结果变化</span></div>
  <div class="db">
    <div class="ctl">
      <label>函数</label>
      <select id="fnSel"><option value="row_number">ROW_NUMBER()</option>…</select>
      <button class="b" id="stepBtn">▶ 逐行计算</button>
    </div>
    <div id="demoTable"></div>
    <div class="log" id="demoLog">点「逐行计算」开始…</div>
    <div class="foot">提示：…</div>
  </div>
</div>
```
```js
// 用 table.dt 渲染数据表：行高亮用 tr.hl / tr.match，弱化用 tr.dim，NULL 用 td.null
host.innerHTML = `<table class="dt"><thead><tr><th>name</th><th>amount</th></tr></thead><tbody>` +
  rows.map((r,i)=>`<tr class="${i===k?'hl':''}"><td>${r.name}</td><td>${r.amount}</td></tr>`).join("") + `</tbody></table>`;
```
可用工具类：`.demo / .dh / .db / .ctl / button.b / select / .log / .foot`、`table.dt`（含 `tr.hl`、`tr.match`、`tr.dim`、`td.null`、`td.key`）、`.bars/.bar/.track`、`.venn`（内联 SVG）。

**演示面板设计原则**
- 必须有**明确的交互**：切换 select / 点按钮 / 拖滑块 / 点表格行。
- 必须有**即时反馈**：结果表变化、日志文字、行高亮。
- 默认状态就是「可看的」，不要让人先点才有内容。
- 纯原生 JS，**不引第三方库**（Mermaid 除外）；不使用 `alert`；不写 `eval`。
- 所有动态文本用 `textContent` 或转义，避免把用户输入直接拼进 HTML。

### 4.3 每页建议的演示主题（与模块强相关）

| 模块 | 建议演示 |
| --- | --- |
| 01 | 关系模型点选（点表名看字段/主外键）+ SQL 语句分类器 |
| 02 | SQL 练习台 + 逻辑执行顺序分步器 + NULL 三值逻辑真值表 |
| 03 | 分组桶演示（点分组列看分桶）+ WHERE/HAVING 分步 |
| 04 | JOIN 可视化（切换 JOIN 类型，高亮匹配行 + 结果集 + Venn） |
| 05 | 子查询执行分步（IN vs EXISTS 逐步展开） |
| 06 | 窗口函数逐行计算器（切换函数/分区/排序） |
| 07 | 隔离级别并发时间线（两个会话，脏读/不可重复读/幻读） |
| 08 | 范式规范化检查器（选表 → 看 1NF/2NF/3NF 分解） |
| 09 | 索引 vs 全表扫描对比（显示扫描行数、回表次数） |
| 10 | 两条 SQL 的 EXPLAIN 对比面板 |
| 11 | 锁等待 / 死锁时间线模拟器 |
| 12 | 星型 vs 雪花模型切换 + 事实表/维度表点选 |
| 13 | 函数实验室（选函数 → 看输入输出） |
| 14 | SQL 注入演示（拼接 vs 参数化） |
| 15 | 题目演算器（显示数据 → 逐步解法） |
| 16 | 漏斗 / 留存计算器（改数字 → 看指标） |
| 17 | 项目 ER 图交互 + 查询清单勾选 |

---

## 5. 统一示例数据集（全站一致，务必引用同一套）

已内置在 `assets/sql-sandbox.js`，页面里可直接用：

| 表 | 字段 | 行数 |
| --- | --- | --- |
| `customers` | id, name, city, gender, signup_date, level | 8（id=8 的 city/gender 为 NULL） |
| `orders` | id, customer_id, order_date, amount, status | 12（status: paid/refunded/cancelled；customer_id=8 无订单） |
| `products` | id, name, category, price, stock | 6 |
| `order_items` | id, order_id, product_id, qty, unit_price | 15 |
| `employees` | id, name, dept, manager_id, salary, hire_date | 9（manager_id 为 NULL 表示顶层） |

- 页面正文的**手写示例表**请与这套数据保持一致（不要另造一套客户/订单）。
- 需要额外表（如 `events`、`payments`）时，在 `SQLSandbox.mount(..., {tables:{...}})` 里补充，并在正文说明。

---

## 6. 内容质量要求

- **讲透而不是列清单**：每个知识点先给「一句话定义」，再给「为什么/什么时候用」，再给例子，再给易错点。
- **表格化对照**：易混概念（WHERE vs HAVING、DELETE vs TRUNCATE、INNER vs LEFT…）一律用 `table.tbl` 对照。
- **结果也要给**：写 SQL 后，用 `table.tbl`/`table.dt` 给出**预期结果**（几行、关键值），便于自检。
- **性能要提**：涉及查询的地方说明「是否走索引 / 大概什么代价」。
- **Mermaid** 用于 ER 图、执行顺序流程图、事务时间线；用 `<div class="mermaid">` 包裹，语法要合法。
- 中文标点，代码/字段名用英文；不要出现「TODO」「占位」「示例块」等未替换字样。
- 不要复制粘贴其它学习包的内容（主题不同）。

---

## 7. 各模块规格

> 见 _modules.md（moduleId、文件名、每个知识点的 id 与标题、prev/next）。

## 8. 交付前自检清单

- [ ] 文件在 `content/`，文件名与 `index.html` 的 `MODULES[].file` 一致。
- [ ] `<section class="topic" id="...">` 的 id/数量/顺序与 `index.html` 的 `pts` **完全一致**。
- [ ] 每个 `data-key` 都是 `"{moduleId}::{知识点id}"`。
- [ ] `<style>` 块与 `_template.html` 一字不差；进度/答题/翻页 JS 未被改动。
- [ ] `CONFIG.points` 覆盖本页所有知识点 id；`prev`/`next` 文件名正确。
- [ ] ≥1 个交互演示面板，且**默认可看、点击有反馈**、无 `alert`、无 `eval`。
- [ ] 8–12 道题，含 ≥1 道 `interview`，每题有解析，`ans` 不集中。
- [ ] 无「TODO / 占位 / 示例块 / 请替换」残留；无 `undefined` / `NaN`。
- [ ] 用 Node 快速验证：`node -e "..."` 或人工检查标签闭合（`</section>` 数量 = `section` 数量）。
- [ ] 示例 SQL 与 §5 数据集一致，且结果行数正确。

---

## 9. 常见错误（务必避免）

1. **锚点写错**：`id="join-basic"` 写成 `id="joins-basic"` → 大纲跳转失效。
2. **`data-key` 少了 moduleId 前缀** → 进度不同步。
3. **改了共享 JS**（进度逻辑/答题引擎）→ 全站不一致。
4. **演示面板需要点击才出现内容** → 学生看不到东西。
5. **SQL 语法写成 PostgreSQL 专有**（如 `ILIKE`）却没注明。
6. **题目只覆盖前半页知识点**。
7. **`<pre><code>` 里的 `<` `>` `&` 未转义**（写 SQL 时几乎必然遇到）→ 页面错乱。SQL 里用 `<` `>` 比较时务必写 `&lt;` `&gt;`。
