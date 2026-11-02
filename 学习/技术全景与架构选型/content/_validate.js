/* _validate.js —— 校验「技术全景与架构选型」学习包：大纲 ↔ 详解页一致性 + 结构完整性
   用法：node content/_validate.js          （校验全部模块）
        node content/_validate.js 03 04    （只校验指定编号）
   路径基于本文件所在目录，Windows / macOS / Linux 都能直接跑。
*/
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const CONTENT = __dirname;
const ROOT = path.dirname(CONTENT);

const problems = [], warns = [];
const P = m => problems.push(m), W = m => warns.push(m);

/* ---------- 1. 读取 index.html 的 STAGES / MODULES ---------- */
const idx = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const block = idx.match(/const STAGES = \{[\s\S]*?\n\];/);
if (!block) { console.error("✗ 无法从 index.html 提取 STAGES / MODULES"); process.exit(1); }
const ctx = {}; vm.createContext(ctx);
vm.runInContext(block[0] + "\n;__out = {STAGES, MODULES};", ctx);
const { STAGES, MODULES } = ctx.__out;

const seen = new Set(); let totalPts = 0;
MODULES.forEach((m, i) => {
  if (seen.has(m.id)) P(`index.html: 模块 id 重复 ${m.id}`); seen.add(m.id);
  if (!STAGES[m.stage]) P(`index.html: 模块 ${m.id} 的 stage 非法 ${m.stage}`);
  if (m.no !== String(i + 1).padStart(2, "0")) P(`index.html: 模块 ${m.id} 编号应为 ${String(i + 1).padStart(2, "0")}`);
  if (m.href !== "content/" + m.file) P(`index.html: 模块 ${m.id} 的 href 与 file 不一致`);
  if (!m.mark) P(`index.html: 模块 ${m.id} 缺少 mark（掌握标志）`);
  const ids = new Set();
  m.pts.forEach(p => {
    totalPts++;
    if (ids.has(p.id)) P(`index.html: ${m.id} 内知识点 id 重复 ${p.id}`); ids.add(p.id);
    if (![1, 2, 3].includes(p.diff)) P(`index.html: ${m.id}::${p.id} diff 非法`);
  });
});
console.log(`index.html: ${MODULES.length} 模块 / ${totalPts} 知识点`);

/* index.html 里的相对链接 */
[...idx.matchAll(/href="((?!https?:|#|mailto:)[^"$]+)"/g)].forEach(m => {
  const target = m[1].split("#")[0];
  if (target && !fs.existsSync(path.resolve(ROOT, target))) P(`index.html: 相对链接 "${m[1]}" 指向的文件不存在`);
});

/* ---------- 2. 逐页检查 ---------- */
const only = process.argv.slice(2);
let checked = 0;
MODULES.forEach((m, mi) => {
  if (only.length && !only.includes(m.no)) return;
  const file = path.join(CONTENT, m.file), tag = m.file;
  if (!fs.existsSync(file)) { P(`缺少文件 ${m.file}`); return; }
  checked++;
  const html = fs.readFileSync(file, "utf8");
  const want = m.pts.map(p => p.id);

  // 2.1 知识点锚点：id / 数量 / 顺序
  const topics = [...html.matchAll(/<section class="topic" id="([^"]+)"/g)].map(x => x[1]);
  if (topics.join() !== want.join()) P(`${tag}: 知识点块 [${topics}] 与大纲 [${want}] 不一致`);

  // 2.2 data-key
  const keys = [...html.matchAll(/data-key="([^"]+)"/g)].map(x => x[1]);
  if (keys.join() !== want.map(id => m.id + "::" + id).join()) P(`${tag}: data-key 与大纲不一致 → ${keys}`);

  // 2.3 每个知识点的最低内容：表格 + callout
  html.split('<section class="topic"').slice(1).forEach((seg, i) => {
    const body = seg.split("</section>")[0];
    if (!/class="tbl"/.test(body)) P(`${tag}: 知识点 ${want[i]} 缺少 table.tbl`);
    if (!/class="callout/.test(body)) P(`${tag}: 知识点 ${want[i]} 缺少 callout`);
  });

  // 2.4 CONFIG
  const cfgM = html.match(/const CONFIG = \{[\s\S]*?\n\};/);
  if (!cfgM) P(`${tag}: 找不到 CONFIG`);
  else {
    const c = new Function(cfgM[0] + "; return CONFIG;")();
    const prev = MODULES[mi - 1], next = MODULES[mi + 1];
    if (c.moduleId !== m.id) P(`${tag}: CONFIG.moduleId 应为 ${m.id}`);
    if (c.title !== m.title) P(`${tag}: CONFIG.title 应为「${m.title}」`);
    if (c.eyebrow !== `MODULE ${m.no} · 技术全景`) P(`${tag}: CONFIG.eyebrow 应为 "MODULE ${m.no} · 技术全景"`);
    if (!c.lead || c.lead.length < 20) P(`${tag}: CONFIG.lead 太短`);
    if ((c.points || []).join() !== want.join()) P(`${tag}: CONFIG.points 与大纲不一致`);
    if (c.prev !== (prev ? prev.file : "")) P(`${tag}: CONFIG.prev 应为 "${prev ? prev.file : ""}"`);
    if (c.next !== (next ? next.file : "")) P(`${tag}: CONFIG.next 应为 "${next ? next.file : ""}"`);
    if (c.prevTitle !== (prev ? prev.title : "")) P(`${tag}: CONFIG.prevTitle 应为「${prev ? prev.title : ""}」`);
    if (c.nextTitle !== (next ? next.title : "")) P(`${tag}: CONFIG.nextTitle 应为「${next ? next.title : ""}」`);
  }
  const t = html.match(/<title>([^<]*)<\/title>/);
  if (!t || t[1] !== `${m.title} · 技术全景与架构选型`) P(`${tag}: <title> 应为「${m.title} · 技术全景与架构选型」`);

  // 2.5 QUZ
  const qM = html.match(/const QUZ = \[[\s\S]*?\n\];/);
  if (!qM) P(`${tag}: 找不到 QUZ`);
  else {
    const quz = new Function(qM[0] + "; return QUZ;")();
    if (quz.length < 8 || quz.length > 12) P(`${tag}: 题目 ${quz.length} 道，应为 8–12`);
    if (!quz.some(q => q.type === "interview")) P(`${tag}: 缺少 type:"interview" 的题`);
    const cnt = {};
    quz.forEach((q, i) => {
      if (!q.q) P(`${tag}: 第 ${i + 1} 题缺题干`);
      if (!Array.isArray(q.opts) || q.opts.length < 3) P(`${tag}: 第 ${i + 1} 题选项不足`);
      else if (!(q.ans >= 0 && q.ans < q.opts.length)) P(`${tag}: 第 ${i + 1} 题 ans 越界`);
      if (!q.exp || q.exp.length < 20) P(`${tag}: 第 ${i + 1} 题解析过短`);
      cnt[q.ans] = (cnt[q.ans] || 0) + 1;
    });
    const max = Math.max(...Object.values(cnt));
    if (max / quz.length > 0.6) W(`${tag}: 正确答案过于集中 ${JSON.stringify(cnt)}`);
  }

  // 2.6 必需结构
  ['class="goals card"', 'class="prereq"', 'class="quiz"', 'id="quizBox"', 'class="challenge"', 'id="masterBtn"',
   'class="footer"', 'id="footPrev"', 'id="footNext"', 'assets/learn.js', 'assets/learn.css'].forEach(sig => {
    if (!html.includes(sig)) P(`${tag}: 缺少必需结构 ${sig}`);
  });
  if (!html.startsWith("<!DOCTYPE html>")) P(`${tag}: 缺少 DOCTYPE`);
  if (!html.trim().endsWith("</html>")) P(`${tag}: 结尾不是 </html>`);
  if (/TODO|占位|请替换|【模块标题】/.test(html)) P(`${tag}: 含未替换的模板文字`);
  if (/\balert\(|\beval\(/.test(html)) P(`${tag}: 不允许使用 alert / eval`);
  const bal = (o, c) => (html.match(o) || []).length - (html.match(c) || []).length;
  if (bal(/<section[\s>]/g, /<\/section>/g)) P(`${tag}: <section> 未闭合`);
  if (bal(/<div[\s>]/g, /<\/div>/g)) P(`${tag}: <div> 未闭合（静态 HTML 部分）`);
  if (bal(/<table[\s>]/g, /<\/table>/g)) P(`${tag}: <table> 未闭合`);

  // 2.7 内联脚本语法（只解析不执行）
  [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].forEach((s, i) => {
    try { new Function(s[1]); } catch (e) { P(`${tag}: 第 ${i + 1} 个内联脚本语法错误 → ${e.message}`); }
  });

  // 2.8 元素 id：唯一、被引用的存在、演示容器被挂载
  const staticIds = [...html.matchAll(/\bid="([^"$]+)"/g)].map(x => x[1]);
  const dup = staticIds.filter((x, i) => staticIds.indexOf(x) !== i);
  if (dup.length) P(`${tag}: 重复的元素 id → ${[...new Set(dup)]}`);
  const demoIds = staticIds.filter(x => /^demo-/.test(x));
  if (!demoIds.length) P(`${tag}: 没有交互演示容器（id 以 demo- 开头）`);
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(x => x[1]).join("\n");
  demoIds.forEach(id => { if (!scripts.includes(`"${id}"`)) P(`${tag}: 演示容器 ${id} 没有被脚本挂载`); });

  // 2.9 页内锚点、相对资源
  const allIds = new Set(staticIds);
  [...html.matchAll(/href="#([^"]+)"/g)].forEach(x => { if (!allIds.has(x[1])) P(`${tag}: 页内链接 #${x[1]} 无对应 id`); });
  [...html.matchAll(/(?:href|src)="((?!https?:|#|mailto:)[^"$]+)"/g)].forEach(x => {
    const target = x[1].split("#")[0];
    if (target && !fs.existsSync(path.resolve(CONTENT, target))) P(`${tag}: 相对路径 "${x[1]}" 不存在`);
  });

  // 2.10 代码块里的尖括号必须转义
  [...html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g)].forEach((x, bi) => {
    [...x[1].matchAll(/<([a-zA-Z/][^>]*)>/g)].forEach(tg => {
      const name = tg[1].replace(/^\//, "");
      if (!/^(b|i|em|strong|span|code|br)\b/i.test(name)) P(`${tag}: 第 ${bi + 1} 个代码块有未转义标签 <${name.slice(0, 20)}>`);
    });
  });
});

/* ---------- 3. 输出 ---------- */
console.log(`已检查 ${checked} 个详解页`);
warns.forEach(w => console.log("⚠ " + w));
if (problems.length) { problems.forEach(p => console.log("✗ " + p)); console.log(`\n共 ${problems.length} 个问题`); process.exit(1); }
console.log("✓ 全部通过");
