/* _validate.js —— 校验 SQL 学习包：大纲数据 ↔ 详解页一致性 + SQL 正确性
   用法: node _validate.js            （校验已存在的页面）
        node _validate.js 04 05 ...   （只校验指定编号）
*/
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = "D:/DSH/Project/User/学习/SQL";
const CONTENT = path.join(ROOT, "content");
require(path.join(CONTENT, "assets/sql-sandbox.js"));
const SB = globalThis.SQLSandbox;

/* ---------- 1. 读取 index.html 的 MODULES ---------- */
const idxHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const modScript = idxHtml.match(/const STAGES = \{[\s\S]*?const MODULES = \[[\s\S]*?\n\];/);
if (!modScript) { console.error("✗ 无法从 index.html 提取 MODULES"); process.exit(1); }
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(modScript[0] + "\n;__out = {STAGES, MODULES};", sandbox);
const { STAGES, MODULES } = sandbox.__out;

const problems = [];
const warn = [];
const pendingStyle = [];
const P = (m) => problems.push(m);
const W = (m) => warn.push(m);

/* ---------- 2. 大纲自身检查 ---------- */
const seenIds = new Set();
let totalPts = 0;
for (const m of MODULES) {
  if (seenIds.has(m.id)) P(`index.html: 模块 id 重复: ${m.id}`);
  seenIds.add(m.id);
  if (!STAGES[m.stage]) P(`index.html: 模块 ${m.id} 的 stage 非法: ${m.stage}`);
  const file = path.join(CONTENT, m.file);
  if (!fs.existsSync(file)) W(`index.html: 模块 ${m.id} 的详解页尚未生成: ${m.file}`);
  const ptIds = new Set();
  for (const p of m.pts) {
    totalPts++;
    if (ptIds.has(p.id)) P(`index.html: 模块 ${m.id} 内知识点 id 重复: ${p.id}`);
    ptIds.add(p.id);
    if (![1,2,3].includes(p.diff)) P(`index.html: ${m.id}::${p.id} diff 非法`);
  }
}
console.log(`index.html: ${MODULES.length} 模块 / ${totalPts} 知识点`);

/* ---------- 3. 详解页检查 ---------- */
const only = process.argv.slice(2);
let checked = 0;

for (const m of MODULES) {
  if (only.length && !only.includes(m.no)) continue;
  const file = path.join(CONTENT, m.file);
  if (!fs.existsSync(file)) { P(`缺少文件: ${m.file}`); continue; }
  checked++;
  const html = fs.readFileSync(file, "utf8");
  const tag = m.file;

  // 3.1 知识点锚点
  const topicIds = [...html.matchAll(/<section class="topic"\s+id="([^"]+)"/g)].map(x => x[1]);
  const want = m.pts.map(p => p.id);
  if (topicIds.length !== want.length) P(`${tag}: 知识点块数量 ${topicIds.length} ≠ 大纲 ${want.length}`);
  want.forEach((id, i) => {
    if (topicIds[i] !== id) P(`${tag}: 第 ${i+1} 个知识点 id 应为 "${id}"，实际 "${topicIds[i]}"`);
  });
  topicIds.forEach(id => { if (!want.includes(id)) P(`${tag}: 多出未在大纲中的知识点 id "${id}"`); });

  // 3.2 data-key
  const keys = [...html.matchAll(/data-key="([^"]+)"/g)].map(x => x[1]);
  if (keys.length !== want.length) P(`${tag}: data-key 数量 ${keys.length} ≠ 知识点数 ${want.length}`);
  want.forEach(id => { if (!keys.includes(`${m.id}::${id}`)) P(`${tag}: 缺少 data-key "${m.id}::${id}"`); });
  keys.forEach(k => { if (!k.startsWith(m.id + "::")) P(`${tag}: data-key 前缀错误 "${k}"`); });

  // 3.3 CONFIG
  const cfgM = html.match(/const CONFIG = \{[\s\S]*?\n\};/);
  if (!cfgM) P(`${tag}: 找不到 CONFIG`);
  else {
    const c = new Function(cfgM[0] + "; return CONFIG;")();
    if (c.moduleId !== m.id) P(`${tag}: CONFIG.moduleId="${c.moduleId}" 应为 "${m.id}"`);
    if (c.title !== m.title) P(`${tag}: CONFIG.title="${c.title}" 应为 "${m.title}"`);
    if (!Array.isArray(c.points) || c.points.join() !== want.join()) P(`${tag}: CONFIG.points 与大纲不一致`);
    if (!/^MODULE \d{2} · SQL \/ 数据库$/.test(c.eyebrow || "")) P(`${tag}: CONFIG.eyebrow 格式应为 "MODULE NN · SQL / 数据库"`);
    if (!c.lead || c.lead.length < 20) P(`${tag}: CONFIG.lead 太短或缺失`);
  }

  // 3.4 QUZ
  const quzM = html.match(/const QUZ = \[[\s\S]*?\n\];/);
  if (!quzM) P(`${tag}: 找不到 QUZ`);
  else {
    const quz = new Function(quzM[0] + "; return QUZ;")();
    if (quz.length < 8 || quz.length > 12) P(`${tag}: 题目数量 ${quz.length}，应为 8–12`);
    if (!quz.some(q => q.type === "interview")) P(`${tag}: 缺少 type:"interview" 的题`);
    const ansCount = {};
    quz.forEach((q, i) => {
      if (!Array.isArray(q.opts) || q.opts.length < 2) P(`${tag}: 第 ${i+1} 题选项不足`);
      if (!(q.ans >= 0 && q.ans < q.opts.length)) P(`${tag}: 第 ${i+1} 题 ans 越界`);
      if (!q.exp || q.exp.length < 10) P(`${tag}: 第 ${i+1} 题缺少解析`);
      if (!q.q) P(`${tag}: 第 ${i+1} 题缺少题干`);
      ansCount[q.ans] = (ansCount[q.ans] || 0) + 1;
    });
    const maxAns = Math.max(...Object.values(ansCount));
    if (maxAns / quz.length > 0.6) W(`${tag}: 正确答案过于集中（${JSON.stringify(ansCount)}）`);
  }

  // 3.5 结构完整性
  ["assets/sql-sandbox.js", "mermaid@10", 'class="goals card"', 'class="prereq"', 'class="quiz"', 'class="challenge"', 'id="masterBtn"', 'class="footer"'].forEach(sig => {
    if (!html.includes(sig)) P(`${tag}: 缺少必需结构 ${sig}`);
  });
  if (!/class="demo"|<div id="demo-/.test(html)) P(`${tag}: 没有任何交互演示面板`);
  if (/TODO\(|占位[:：]|请替换|请按此结构|目标占位|挑战占位|正文占位/.test(html)) P(`${tag}: 含未替换的模板占位文字`);

  // 3.5a 样式：占位符（待注入）或与共享样式一致
  const canonical = fs.readFileSync(path.join(CONTENT, "assets", "learn.css"), "utf8").trim();
  const st = html.match(/<style>([\s\S]*?)<\/style>/);
  if (!st) P(`${tag}: 缺少 <style> 块`);
  else if (st[1].trim() === "/*__SHARED_STYLE__*/") pendingStyle.push(m.file);
  else if (st[1].trim() !== canonical) W(`${tag}: <style> 与 assets/learn.css 不一致（共 ${st[1].trim().length} vs ${canonical.length} 字节）`);
  const openSec = (html.match(/<section/g) || []).length, closeSec = (html.match(/<\/section>/g) || []).length;
  if (openSec !== closeSec) P(`${tag}: <section> 标签不闭合 (${openSec} vs ${closeSec})`);
  const openDiv = (html.match(/<div/g) || []).length, closeDiv = (html.match(/<\/div>/g) || []).length;
  if (openDiv !== closeDiv) P(`${tag}: <div> 标签不闭合 (${openDiv} vs ${closeDiv})`);
  if (!html.startsWith("<!DOCTYPE html>")) P(`${tag}: 缺少 DOCTYPE`);
  if (!html.trim().endsWith("</html>")) P(`${tag}: 结尾不是 </html>`);

  // 3.5b 内联 JS 语法检查（只解析不执行）
  [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].forEach((m, si) => {
    try { new Function(m[1]); }
    catch (e) { P(`${tag}: 第 ${si + 1} 个内联 <script> 语法错误 → ${e.message}`); }
  });

  // 3.5c 元素 id 引用检查（getElementById / querySelector('#x') 必须在文档里存在）
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]));
  const refs = new Set([
    ...[...html.matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)].map(x => x[1]),
    ...[...html.matchAll(/querySelector\(\s*["']#([A-Za-z0-9_-]+)["']\s*\)/g)].map(x => x[1])
  ]);
  refs.forEach(r => { if (!ids.has(r)) P(`${tag}: 引用了不存在的元素 id "${r}"`); });
  const idCount = [...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]);
  const dup = idCount.filter((x, i) => idCount.indexOf(x) !== i);
  if (dup.length) P(`${tag}: 重复的元素 id → ${[...new Set(dup)].join(", ")}`);
  // 演示容器（id 以 demo 开头）必须被 JS 挂载
  idCount.filter(x => /^demo/i.test(x)).forEach(x => {
    if (!refs.has(x)) P(`${tag}: 演示容器 id="${x}" 没有被 JS 挂载（找不到 getElementById("${x}")）`);
  });

  // 3.5d 代码块里的 < > 是否已转义（未转义会把页面结构搞乱）
  const OKTAG = /^(b|i|em|strong|span|code|br|a|sub|sup|u|small)\b/i;
  [...html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g)].forEach((m, bi) => {
    const body = m[1];
    [...body.matchAll(/<([a-zA-Z/][^>]*)?>/g)].forEach(t => {
      const name = (t[1] || "").replace(/^\//, "");
      if (!OKTAG.test(name)) P(`${tag}: 第 ${bi + 1} 个 <pre> 代码块里有未转义的标签 "<${name.slice(0, 24)}…"（应写成 &lt;…&gt;）`);
    });
  });
  // 3.6a 页内锚点链接与相对资源路径
  [...html.matchAll(/href="#([^"]+)"/g)].forEach(m => {
    if (!ids.has(m[1])) P(`${tag}: 页内链接 #${m[1]} 没有对应的元素 id`);
  });
  [...html.matchAll(/(?:href|src)="((?!https?:|#|mailto:)[^"]+)"/g)].forEach(m => {
    if (!fs.existsSync(path.resolve(CONTENT, m[1]))) P(`${tag}: 相对路径 "${m[1]}" 指向的文件不存在`);
  });

  const navM = html.match(/prev:\s*"([^"]*)"[\s\S]*?next:\s*"([^"]*)"/);
  if (navM) {
    if (navM[1] && !fs.existsSync(path.join(CONTENT, navM[1]))) W(`${tag}: prev 指向不存在的文件 ${navM[1]}`);
    if (navM[2] && !fs.existsSync(path.join(CONTENT, navM[2]))) W(`${tag}: next 指向不存在的文件 ${navM[2]}`);
  }

  // 3.7 演示面板里的 SQL 是否可执行（只取 SQLSandbox 的 query / presets，不含题目里的对比片段）
  const demoBlocks = [];
  let cursor = 0;
  while ((cursor = html.indexOf("SQLSandbox.mount(", cursor)) >= 0) {
    let i = cursor + "SQLSandbox.mount(".length, depth = 1;
    while (i < html.length && depth > 0) {
      const c = html[i];
      if (c === "(") depth++;
      else if (c === ")") depth--;
      i++;
    }
    demoBlocks.push(html.slice(cursor, i));
    cursor = i;
  }
  const demos = demoBlocks.map(b => {
    let tables = null;
    const ti = b.indexOf("tables:");
    if (ti >= 0) {
      const start = b.indexOf("{", ti);
      let depth = 0, i = start;
      for (; i < b.length; i++) {
        if (b[i] === "{") depth++;
        else if (b[i] === "}") { depth--; if (depth === 0) { i++; break; } }
      }
      try { tables = new Function("return " + b.slice(start, i))(); } catch (e) { }
    }
    const list = [];
    const q = b.match(/query:\s*"((?:[^"\\]|\\.)*)"/);
    if (q) list.push(JSON.parse('"' + q[1] + '"'));
    [...b.matchAll(/sql:\s*"((?:[^"\\]|\\.)*)"/g)].forEach(x => list.push(JSON.parse('"' + x[1] + '"')));
    return { tables: tables, list: list };
  });
  const sqls = demos.flatMap(d => d.list.map(s => ({ sql: s, tables: d.tables })));
  let sqlBad = 0;
  sqls.forEach(({ sql, tables }) => {
    const r = SB.run(sql, tables);
    if (r.error) { sqlBad++; P(`${tag}: 演示 SQL 执行失败 → ${r.error}\n      ${sql.replace(/\n/g, " ")}`); }
  });
  console.log(`  ${m.no} ${m.file}: ${topicIds.length} 知识点, ${sqls.length} 条演示 SQL${sqlBad ? " (" + sqlBad + " 条失败)" : " 全部可执行"}`);
}

/* ---------- 4. 进度键一致性 ---------- */
const keyIdx = "sql_outline_progress_v1";
if (!idxHtml.includes(keyIdx)) P(`index.html: 进度键应为 ${keyIdx}`);
for (const m of MODULES) {
  const f = path.join(CONTENT, m.file);
  if (fs.existsSync(f) && !fs.readFileSync(f, "utf8").includes(keyIdx)) P(`${m.file}: 未使用共享进度键 ${keyIdx}`);
}

/* ---------- 5. 汇总 ---------- */
console.log("\n" + "─".repeat(60));
if (pendingStyle.length) console.log(`ℹ 待注入共享样式（占位符）: ${pendingStyle.length} 个 → ${pendingStyle.join(", ")}\n  运行 node _inject-style.js 完成注入`);
if (warn.length) { console.log("⚠ 警告:"); warn.forEach(w => console.log("  " + w)); }
if (problems.length) { console.log("\n✗ 问题 (" + problems.length + "):"); problems.forEach(p => console.log("  " + p)); }
else console.log("✓ 无问题");
console.log(`校验页面数: ${checked}`);
