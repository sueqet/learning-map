/* _inject-style.js —— 把 assets/learn.css 同步进所有详解页
   处理两种情况：
     a) 占位符 <style>/*__SHARED_STYLE__*\/</style>  → 注入
     b) 已有 <style>…</style>（内容不一致）        → 覆盖为规范版本
   用法：node _inject-style.js
*/
const fs = require("fs");
const path = require("path");
const DIR = "D:/DSH/Project/User/学习/SQL/content";
const css = fs.readFileSync(path.join(DIR, "assets", "learn.css"), "utf8").trim();
const PLACEHOLDER = /<style>\s*\/\*__SHARED_STYLE__\*\/\s*<\/style>/;
const ANYSTYLE = /<style>[\s\S]*?<\/style>/;

let injected = 0, synced = 0, ok = 0;
for (const f of fs.readdirSync(DIR).sort()) {
  if (!/^\d\d-.*\.html$/.test(f)) continue;
  const p = path.join(DIR, f);
  let h = fs.readFileSync(p, "utf8");
  const replacement = "<style>\n" + css + "\n</style>";
  if (PLACEHOLDER.test(h)) {
    fs.writeFileSync(p, h.replace(PLACEHOLDER, replacement), "utf8");
    injected++; console.log("注入占位符:", f);
  } else {
    const cur = h.match(ANYSTYLE);
    if (!cur) { console.log("⚠ 无 <style>，跳过:", f); continue; }
    if (cur[0] !== replacement) {
      fs.writeFileSync(p, h.replace(ANYSTYLE, replacement), "utf8");
      synced++; console.log("同步样式:", f);
    } else ok++;
  }
}
console.log(`\n完成：注入 ${injected}，同步 ${synced}，已一致 ${ok}`);
