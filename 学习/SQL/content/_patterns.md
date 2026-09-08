# 交互演示面板 · 可复制模式（_patterns.md）

> 每个页面至少 1 个交互面板。下面 4 种模式直接复制改写即可，全部纯原生 JS、无第三方库。
> 所有面板都必须：**默认就有内容**、**点击有可见反馈**、**不用 alert / eval**。

---

## 模式 A：SQL 练习台（能真跑查询，最省事）

适合：单表查询、聚合分组、连接、子查询、函数等「SELECT 能表达」的知识点。

```html
<div id="demo-x"></div>
```
```js
SQLSandbox.mount(document.getElementById("demo-x"), {
  query: "SELECT city, COUNT(*) AS 订单数, SUM(amount) AS 金额\nFROM customers c JOIN orders o ON c.id = o.customer_id\nGROUP BY city ORDER BY 金额 DESC;",
  presets: [
    {label:"分组统计", sql:"SELECT city, COUNT(*) AS n FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY city;"},
    {label:"对比写法", sql:"SELECT city, COUNT(*) AS n FROM customers GROUP BY city;"}
  ]
});
```
- 引擎支持范围见 `assets/sql-sandbox.js` 顶部注释。**不支持** `UNION` / 窗口函数 `OVER()` / `WITH` / DML，这些主题请用模式 B–D。
- `presets` 至少 2 条，且要能**对比出差异**。
- 结果表、行数、执行步骤（FROM→WHERE→…→LIMIT）由引擎自动渲染。

---

## 模式 B：下拉/按钮 + 表格高亮（最通用）

适合：JOIN 类型切换、隔离级别、范式分解、锁类型、算法对比等「换选项 → 换结果」的知识点。

```html
<div class="demo">
  <div class="dh"><span class="t">🖥 演示：标题</span><span class="hint">点按钮切换</span></div>
  <div class="db">
    <div class="ctl">
      <label>选择</label>
      <button class="b" data-k="A">方案 A</button>
      <button class="b" data-k="B">方案 B</button>
    </div>
    <div id="xOut"></div>
    <div class="log" id="xLog"></div>
    <div class="foot">提示：…</div>
  </div>
</div>
```
```js
(function(){
  const out = document.getElementById("xOut"), log = document.getElementById("xLog");
  const DATA = { A: {...}, B: {...} };
  const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  function render(k){
    document.querySelectorAll('[data-k]').forEach(b=>b.classList.toggle("on", b.dataset.k===k));
    const d = DATA[k];
    out.innerHTML = `<table class="dt"><thead><tr><th>列1</th><th>列2</th></tr></thead><tbody>` +
      d.rows.map((r,i)=>`<tr class="${i===d.hl?'hl':''}"><td>${esc(r[0])}</td><td>${r[1]===null?'<td class="null">NULL</td>':'<td>'+esc(r[1])+'</td>'}</tr>`).join("") +
      `</tbody></table>`;
    log.innerHTML = `<b>${k}</b>：${d.note}`;
  }
  document.querySelectorAll('[data-k]').forEach(b=>b.addEventListener("click", ()=>render(b.dataset.k)));
  render("A");   // ← 默认就渲染，别等用户点
})();
```
可用 class：`table.dt`（`tr.hl` 高亮行 / `tr.match` 绿色 / `tr.dim` 弱化 / `td.null` 红斜体 / `td.key`）、`.bars .bar .track .val`、`.log`、`.foot`。

---

## 模式 C：分步器（点「下一步」逐步揭示）

适合：执行顺序、事务时间线、死锁、MVCC、子查询执行、递归 CTE、规范化分解。

```html
<div class="demo">
  <div class="dh"><span class="t">🖥 演示：分步过程</span><span class="hint">点「下一步」</span></div>
  <div class="db">
    <div class="ctl">
      <button class="b" id="xStep">▶ 下一步</button>
      <button class="b" id="xReset">↺ 重来</button>
    </div>
    <div id="xOut"></div>
    <div class="log" id="xLog">点「下一步」开始…</div>
  </div>
</div>
```
```js
(function(){
  const out = document.getElementById("xOut"), log = document.getElementById("xLog");
  const STEPS = [
    {t:"步骤 1", html:"<p>…</p>", note:"发生了什么"},
    {t:"步骤 2", html:"<p>…</p>", note:"发生了什么"}
  ];
  let i = -1;
  function render(){
    if(i < 0){ out.innerHTML = "<p style='color:#857c6b;font-size:13.5px'>准备就绪，点「下一步」开始。</p>"; log.textContent="点「下一步」开始…"; return; }
    const s = STEPS[i];
    out.innerHTML = `<div style="font-weight:700;color:#1e5b4f;margin-bottom:6px">${s.t}</div>${s.html}`;
    log.innerHTML = `<b>${s.t}</b>：${s.note}`;
  }
  document.getElementById("xStep").addEventListener("click", ()=>{ i = Math.min(i+1, STEPS.length-1); render(); });
  document.getElementById("xReset").addEventListener("click", ()=>{ i = -1; render(); });
  render();
})();
```

---

## 模式 D：输入/滑块 → 实时计算

适合：漏斗/留存/RFM 计算、深分页代价曲线、索引扫描行数、函数实验室。

```html
<div class="demo">
  <div class="dh"><span class="t">🖥 演示：实时计算</span><span class="hint">拖动或输入</span></div>
  <div class="db">
    <div class="ctl">
      <label>参数</label>
      <input type="range" id="xRange" min="1" max="100" value="10" style="width:200px">
      <span class="log" id="xVal" style="margin:0;padding:4px 10px"></span>
    </div>
    <div id="xOut"></div>
    <div class="log" id="xLog"></div>
  </div>
</div>
```
```js
(function(){
  const r = document.getElementById("xRange"), val = document.getElementById("xVal"),
        out = document.getElementById("xOut"), log = document.getElementById("xLog");
  function calc(n){ return { rows: n * 12, note: `扫描 ${n*12} 行` }; }
  function render(){
    const n = +r.value, res = calc(n);
    val.textContent = n;
    out.innerHTML = `<div class="bars"><div class="bar"><span class="nm">代价</span><span class="track"><span style="width:${Math.min(100,n)}%"></span></span><span class="val">${res.rows}</span></div></div>`;
    log.textContent = res.note;
  }
  r.addEventListener("input", render);
  render();
})();
```

---

## 通用注意

1. **默认渲染一次**（`render()` 放最后），不要留空面板。
2. 动态内容用 `esc()` 转义，或全部用 `textContent` 赋值。
3. 每页 2–3 个面板为宜，分别对应不同知识点；不要 3 个面板讲同一件事。
4. 面板上方要有 `.dh .t` 标题说明「演示什么」，下面 `.foot` 给一句提示。
5. 需要 SVG（Venn 图、B+ 树、模型图）时直接内联 `<svg viewBox="…">`，用 `fill` 切换高亮，别引库。
6. 沙箱不支持的语法（窗口函数/事务/DDL/索引/EXPLAIN/UNION/递归 CTE/JSON）→ 用模式 B/C/D **手算演示**，代码块里正常写 SQL 语法并加一句「练习台不支持，请到真实数据库验证」。
