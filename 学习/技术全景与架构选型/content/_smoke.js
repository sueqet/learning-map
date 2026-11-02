/* _smoke.js —— 浏览器冒烟测试：真实打开每个页面，执行脚本、点演示按钮、答题、勾进度
   依赖 Playwright（需本机已安装：npm i -D playwright && npx playwright install chromium）
   用法：node content/_smoke.js            （大纲 + 全部详解页）
        node content/_smoke.js 03-lang     （只测文件名包含该字符串的页面）
*/
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

const CONTENT = __dirname, ROOT = path.dirname(CONTENT);
const filter = process.argv[2] || "";
const TOOLS = ["atlas.html", "sandbox.html", "review.html"].map(f => path.join(ROOT, f));
const pages = [path.join(ROOT, "index.html")].concat(TOOLS).concat(
  fs.readdirSync(CONTENT).filter(f => /^\d\d-.*\.html$/.test(f)).sort().map(f => path.join(CONTENT, f))
).filter(p => p.includes(filter));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  // 离线跑：拦掉字体等外部请求，避免网络影响结果
  await ctx.route(/^https?:\/\//, r => r.abort());
  let fail = 0;
  for (const file of pages) {
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", e => errs.push("pageerror: " + e.message));
    page.on("console", m => { if (m.type() === "error" && !/net::ERR_FAILED|Failed to load resource/.test(m.text())) errs.push("console: " + m.text()); });
    await page.goto(pathToFileURL(file).href);
    const name = path.basename(file);
    const info = {};
    if (["atlas.html", "sandbox.html", "review.html"].includes(name)) {
      // 工具页：能渲染、无报错、窄屏不溢出（深度交互见各自的手工测试）
      info.text = (await page.evaluate(() => document.body.innerText.length)) > 500;
      if (name === "atlas.html") { info.techs = await page.locator("#map .tech").count(); await page.locator("#map .tech").first().click(); info.drawer = await page.locator("#drawer.on").count(); }
      if (name === "sandbox.html") { await page.click("#ref"); await page.click("#go"); await page.waitForTimeout(300); await page.click("#skip"); info.grade = await page.textContent("#grade .L"); }
      if (name === "review.html") { await page.click("#go0"); await page.keyboard.press(" "); await page.keyboard.press("3"); info.next = await page.textContent(".prog span"); }
      await page.setViewportSize({ width: 375, height: 800 });
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (ov > 2) errs.push(`375px 宽度下横向溢出 ${ov}px`);
    } else if (name === "index.html") {
      info.modules = await page.locator(".mod").count();
      info.points = await page.locator(".mod .pts li").count();
      await page.locator(".mod .pts input").first().check();
      info.done = await page.locator("#navDone").textContent();
      await page.fill("#searchTop", "幂等");
      info.searchHits = await page.locator(".mod .pts li:visible").count();
      await page.fill("#searchTop", "");
    } else {
      const quizN = await page.evaluate(() => QUZ.length);
      info.quiz = await page.locator(".qcard").count();
      if (info.quiz !== quizN) errs.push(`考核题渲染 ${info.quiz} ≠ QUZ ${quizN}`);
      // 演示面板：每个按钮 / 下拉 / 滑块都动一下
      const btns = page.locator(".demo button");
      info.demoButtons = await btns.count();
      for (let i = 0; i < info.demoButtons; i++) { const b = btns.nth(i); if (await b.isVisible()) await b.click(); }
      const sels = page.locator(".demo select");
      for (let i = 0; i < await sels.count(); i++) {
        const opts = await sels.nth(i).locator("option").evaluateAll(os => os.map(o => o.value));
        for (const v of opts) await sels.nth(i).selectOption(v);
      }
      const ranges = page.locator('.demo input[type=range]');
      for (let i = 0; i < await ranges.count(); i++) {
        await ranges.nth(i).evaluate(r => { r.value = r.max; r.dispatchEvent(new Event("input", { bubbles: true })); r.value = r.min; r.dispatchEvent(new Event("input", { bubbles: true })); });
      }
      const checks = page.locator('.demo input[type=checkbox]');
      for (let i = 0; i < await checks.count(); i++) { if (await checks.nth(i).isVisible()) await checks.nth(i).click(); }
      // 演示面板不能是空的
      const emptyDemo = await page.evaluate(() => [...document.querySelectorAll('[id^="demo-"]')].filter(d => d.textContent.trim().length < 20).map(d => d.id));
      if (emptyDemo.length) errs.push("空演示面板: " + emptyDemo);
      // 答题：每题选正确答案并提交
      for (let i = 0; i < info.quiz; i++) {
        const ans = await page.evaluate(k => QUZ[k].ans, i);
        const card = page.locator(".qcard").nth(i);
        await card.locator(".opt input").nth(ans).check();
        await card.locator("[data-submit]").click();
      }
      info.score = await page.locator("#ringPct").textContent();
      if (info.score !== "100%") errs.push("全选正确答案后得分不是 100%: " + info.score);
      await page.click("#masterBtn");
      info.master = await page.locator("#masterBtn").textContent();
      if (!/已掌握/.test(info.master)) errs.push("「我已掌握本节」未生效");
      // 渲染出的 undefined 不能比源码里多（正文里讲「读到 undefined」是合法内容）；NaN / [object Object] 一律不允许
      const srcUndef = (fs.readFileSync(file, "utf8").match(/undefined/g) || []).length;
      const txt = await page.evaluate(() => document.body.innerText);
      if ((txt.match(/undefined/g) || []).length > srcUndef || /NaN|\[object Object\]/.test(txt)) errs.push("页面文本里出现了渲染错误（undefined / NaN / [object Object]）");
      // 窄屏不应出现横向滚动
      await page.setViewportSize({ width: 375, height: 800 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 2) errs.push(`375px 宽度下页面横向溢出 ${overflow}px`);
    }
    console.log((errs.length ? "✗ " : "✓ ") + name + " " + JSON.stringify(info));
    errs.forEach(e => console.log("    " + e));
    if (errs.length) fail++;
    await page.close();
  }
  await browser.close();
  console.log(fail ? `\n${fail} 个页面有问题` : "\n✓ 冒烟测试全部通过");
  process.exit(fail ? 1 : 0);
})();
