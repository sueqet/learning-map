/* _summary.js —— 学习包总览统计 */
const fs = require("fs");
const rows = [];
let totQ = 0, totIv = 0, totDemo = 0, totBytes = 0, totPts = 0;
for (const f of fs.readdirSync(".").filter(f => /^\d\d-.*\.html$/.test(f)).sort()) {
  const h = fs.readFileSync(f, "utf8");
  const q = (h.match(/const QUZ = \[([\s\S]*?)\n\];/) || [])[1];
  let n = 0, iv = 0;
  if (q) { const arr = new Function("return [" + q + "]")(); n = arr.length; iv = arr.filter(x => x.type === "interview").length; }
  const demos = (h.match(/class="demo"/g) || []).length + (h.match(/SQLSandbox\.mount\(/g) || []).length;
  const pts = (h.match(/<section class="topic"/g) || []).length;
  const kb = (fs.statSync(f).size / 1024).toFixed(0);
  totQ += n; totIv += iv; totDemo += demos; totPts += pts; totBytes += fs.statSync(f).size;
  rows.push([f.padEnd(28), String(pts).padStart(2), String(demos).padStart(2), String(n).padStart(2), String(iv).padStart(2), (kb + " KB").padStart(8)].join("  "));
}
console.log("页面".padEnd(28) + "  知识点  面板  题数  面试题    大小");
console.log("-".repeat(74));
console.log(rows.join("\n"));
console.log("-".repeat(74));
console.log(`合计：${rows.length} 个页面 · ${totPts} 个知识点 · ${totDemo} 处交互演示 · ${totQ} 道考核题（含 ${totIv} 道面试延伸）· ${(totBytes / 1048576).toFixed(1)} MB`);
