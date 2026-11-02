/* ui.js —— 学习包全站交互层（大纲、详解页、图鉴、沙盘、闪卡都加载）
   1. 顶栏按钮：⌘K 搜索、主题切换
   2. 全局搜索面板：模块 / 知识点 / 图鉴名词 / 工具，键盘可操作
   3. 记录「上次学到哪」（总入口和大纲读取）
   4. 详解页正文里的技术名词自动加下划线，悬停 / 点按弹出图鉴卡片
   依赖（可选）：modules.js（ARCH_MODULES）、atlas-data.js（ATLAS）、theme.js（ArchTheme）
*/
(function () {
  "use strict";
  var IN_CONTENT = /\/content\/[^\/]*$/.test(decodeURI(location.pathname));
  var ROOT = IN_CONTENT ? "../" : "", CONTENT = IN_CONTENT ? "" : "content/";
  var MODS = window.ARCH_MODULES || [], ATL = window.ATLAS || [], LAYERS = window.ATLAS_LAYERS || [];
  var LYN = {}; LAYERS.forEach(function (l) { LYN[l.k] = l.n; });
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var TOOLS = [
    { n: "学习大纲", d: "13 个模块、全部知识点与进度", h: ROOT + "index.html", ic: "☰" },
    { n: "技术图鉴", d: "100+ 个技术名词的分层地图", h: ROOT + "atlas.html", ic: "◎" },
    { n: "架构沙盘", d: "当一回技术负责人：选型、上线、迎接事故", h: ROOT + "sandbox.html", ic: "▣" },
    { n: "闪卡复习", d: "间隔重复，把名词真正记住", h: ROOT + "review.html", ic: "⟳" },
    { n: "仓库总入口", d: "全部学习包与路线规划", h: ROOT + "../../index.html", ic: "⌂" }
  ];

  /* ---------- 样式（只注入一次） ---------- */
  var css = [
    ".ui-btns{display:flex;gap:6px;align-items:center;margin-left:8px;flex:none}",
    ".ui-btn{cursor:pointer;border:1px solid var(--line-2);background:var(--paper-2);color:var(--ink-soft);font-size:12.5px;padding:5px 10px;border-radius:999px;font-family:var(--font-mono);display:inline-flex;align-items:center;gap:5px;white-space:nowrap}",
    ".ui-btn:hover{border-color:var(--green);color:var(--green)}",
    ".ui-btn kbd{font-family:inherit;font-size:11px;opacity:.7}",
    "@media (max-width:640px){.ui-btn kbd,.ui-btn .lb{display:none}}",
    ".pal-mask{position:fixed;inset:0;background:rgba(20,18,14,.45);backdrop-filter:blur(3px);z-index:200;display:none;align-items:flex-start;justify-content:center;padding:10vh 14px 14px}",
    ".pal-mask.on{display:flex}",
    ".pal{width:min(640px,100%);background:var(--paper-2);border:1px solid var(--line-2);border-radius:16px;box-shadow:0 30px 80px -20px rgba(0,0,0,.55);overflow:hidden;display:flex;flex-direction:column;max-height:76vh}",
    ".pal input{border:none;border-bottom:1px solid var(--line);background:transparent;color:var(--ink);font-size:16px;padding:16px 18px;outline:none;font-family:inherit}",
    ".pal .res{overflow:auto;padding:6px}",
    ".pal .grp{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em;color:var(--muted);text-transform:uppercase;padding:10px 12px 4px}",
    ".pal a.it{display:flex;gap:10px;align-items:baseline;padding:8px 12px;border-radius:10px;color:var(--ink);text-decoration:none}",
    ".pal a.it .ic{flex:none;width:22px;text-align:center;color:var(--green);font-family:var(--font-mono)}",
    ".pal a.it .t{font-weight:700;font-size:14px}",
    ".pal a.it .d{font-size:12.5px;color:var(--muted);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".pal a.it.on{background:var(--green-soft)}",
    ".pal .ft{border-top:1px solid var(--line);padding:8px 14px;font-size:11.5px;color:var(--muted);font-family:var(--font-mono);display:flex;gap:14px;flex-wrap:wrap}",
    ".pal .empty{padding:24px;text-align:center;color:var(--muted);font-size:14px}",
    ".term{border-bottom:1px dashed var(--green);cursor:help;transition:background .12s}",
    ".term:hover,.term.on{background:var(--green-soft);border-radius:3px}",
    ".term-pop{position:absolute;z-index:150;width:300px;max-width:calc(100vw - 24px);background:var(--paper-2);border:1px solid var(--line-2);border-radius:12px;box-shadow:0 18px 44px -16px rgba(0,0,0,.45);padding:12px 14px;font-size:13px;color:var(--ink-soft);line-height:1.6;display:none}",
    ".term-pop.on{display:block}",
    ".term-pop .h{display:flex;align-items:baseline;gap:8px;margin-bottom:4px}",
    ".term-pop .h b{font-size:15px;color:var(--ink)}",
    ".term-pop .h span{font-family:var(--font-mono);font-size:11px;color:var(--muted)}",
    ".term-pop .r{margin-top:4px}",
    ".term-pop .r i{font-style:normal;color:var(--amber);font-weight:700;margin-right:4px}",
    ".term-pop a{display:inline-block;margin-top:8px;font-weight:700}"
  ].join("\n");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  /* ---------- 1. 顶栏按钮 ---------- */
  var nav = document.querySelector(".topnav .wrap");
  var themeIcon = function () { var p = window.ArchTheme ? window.ArchTheme.pref() : "auto"; return { auto: "◐ <span class=\"lb\">跟随系统</span>", light: "☀ <span class=\"lb\">浅色</span>", dark: "☾ <span class=\"lb\">深色</span>" }[p]; };
  if (nav) {
    var box = document.createElement("div"); box.className = "ui-btns";
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    box.innerHTML = '<button class="ui-btn" id="uiSearch" title="搜索模块、知识点、技术名词">⌕ <span class="lb">搜索</span> <kbd>' + (isMac ? "⌘K" : "Ctrl K") + '</kbd></button>' +
      (window.ArchTheme ? '<button class="ui-btn" id="uiTheme" title="切换主题：跟随系统 / 浅色 / 深色">' + themeIcon() + "</button>" : "");
    nav.appendChild(box);
    document.getElementById("uiSearch").addEventListener("click", function () { openPal(); });
    var tb = document.getElementById("uiTheme");
    if (tb) tb.addEventListener("click", function () { window.ArchTheme.cycle(); tb.innerHTML = themeIcon(); });
  }

  /* ---------- 2. 搜索面板 ---------- */
  var items = [];
  TOOLS.forEach(function (t) { items.push({ g: "工具", ic: t.ic, t: t.n, d: t.d, h: t.h, k: t.n + " " + t.d }); });
  MODS.forEach(function (m) {
    items.push({ g: "模块", ic: m.no, t: m.title, d: m.sub, h: ROOT + m.href, k: m.no + " " + m.title + " " + m.sub + " " + (m.mark || "") });
    m.pts.forEach(function (p) { items.push({ g: "知识点", ic: "·", t: p.title, d: m.no + " " + m.title, h: ROOT + m.href + "#" + p.id, k: p.title + " " + m.title }); });
  });
  ATL.forEach(function (a) { items.push({ g: "技术图鉴", ic: "◎", t: a.n, d: (LYN[a.ly] || "") + " · " + a.cat + " — " + a.one, h: ROOT + "atlas.html#" + a.id, k: a.n + " " + (a.aka || []).join(" ") + " " + a.cat + " " + a.one }); });

  var mask = document.createElement("div"); mask.className = "pal-mask";
  mask.innerHTML = '<div class="pal" role="dialog" aria-label="全局搜索"><input id="palQ" type="text" placeholder="搜索：FastAPI、缓存、幂等、微服务、第 7 模块…" autocomplete="off"><div class="res" id="palRes"></div>' +
    '<div class="ft"><span>↑↓ 选择</span><span>Enter 打开</span><span>Esc 关闭</span><span>← → 详解页翻页</span></div></div>';
  document.body.appendChild(mask);
  var q = mask.querySelector("#palQ"), res = mask.querySelector("#palRes"), cur = 0, shown = [];
  function score(it, s) {
    var k = it.k.toLowerCase(), t = it.t.toLowerCase();
    if (t === s) return 100; if (t.indexOf(s) === 0) return 80; if (t.indexOf(s) >= 0) return 60; if (k.indexOf(s) >= 0) return 30;
    var parts = s.split(/\s+/).filter(Boolean); if (parts.length > 1 && parts.every(function (p) { return k.indexOf(p) >= 0; })) return 20;
    return 0;
  }
  function renderPal() {
    var s = q.value.trim().toLowerCase();
    if (!s) shown = items.filter(function (it) { return it.g === "工具"; }).concat(items.filter(function (it) { return it.g === "模块"; }));
    else shown = items.map(function (it) { return { it: it, sc: score(it, s) }; }).filter(function (x) { return x.sc > 0; })
      .sort(function (a, b) { return b.sc - a.sc; }).slice(0, 40).map(function (x) { return x.it; });
    if (!shown.length) { res.innerHTML = '<div class="empty">没有找到「' + esc(q.value) + '」。试试别的写法，比如 K8s、Redis、单体。</div>'; return; }
    cur = Math.min(cur, shown.length - 1);
    var html = "", last = "";
    shown.forEach(function (it, i) {
      if (it.g !== last) { html += '<div class="grp">' + it.g + "</div>"; last = it.g; }
      html += '<a class="it' + (i === cur ? " on" : "") + '" data-i="' + i + '" href="' + esc(it.h) + '"><span class="ic">' + esc(it.ic) + '</span><span class="t">' + esc(it.t) + '</span><span class="d">' + esc(it.d) + "</span></a>";
    });
    res.innerHTML = html;
    var on = res.querySelector(".it.on"); if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest" });
  }
  function openPal() { mask.classList.add("on"); q.value = ""; cur = 0; renderPal(); setTimeout(function () { q.focus(); }, 10); }
  function closePal() { mask.classList.remove("on"); }
  window.ArchPalette = { open: openPal, close: closePal };
  q.addEventListener("input", function () { cur = 0; renderPal(); });
  mask.addEventListener("click", function (e) { if (e.target === mask) closePal(); });
  res.addEventListener("mousemove", function (e) { var a = e.target.closest(".it"); if (a && +a.dataset.i !== cur) { cur = +a.dataset.i; res.querySelectorAll(".it").forEach(function (x, i) { x.classList.toggle("on", i === cur); }); } });
  res.addEventListener("click", function () { closePal(); });
  q.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { cur = Math.min(cur + 1, shown.length - 1); renderPal(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { cur = Math.max(cur - 1, 0); renderPal(); e.preventDefault(); }
    else if (e.key === "Enter" && shown[cur]) { var h = shown[cur].h; closePal(); location.href = h; }
    else if (e.key === "Escape") closePal();
  });
  document.addEventListener("keydown", function (e) {
    var typing = /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || "")) || e.target.isContentEditable;
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); mask.classList.contains("on") ? closePal() : openPal(); }
    else if (e.key === "/" && !typing && !mask.classList.contains("on")) { e.preventDefault(); openPal(); }
    else if (e.key === "Escape") { closePal(); hidePop(); }
  });

  /* ---------- 3. 记录上次学到哪 ---------- */
  try {
    var here = decodeURI(location.pathname).split("/").pop() || "index.html";
    var title = (window.CONFIG_TITLE || document.title.split(" · ")[0]).trim();
    if (here !== "index.html") localStorage.setItem("arch_last", JSON.stringify({ href: (IN_CONTENT ? "content/" : "") + here, title: title, t: Date.now() }));
  } catch (e) {}

  /* ---------- 4. 正文名词识别 + 悬停卡片 ---------- */
  var pop = document.createElement("div"); pop.className = "term-pop"; document.body.appendChild(pop);
  var popFor = null, hideTimer = null;
  function hidePop() { pop.classList.remove("on"); if (popFor) popFor.classList.remove("on"); popFor = null; }
  function showPop(el) {
    var a = ATL.filter(function (x) { return x.id === el.dataset.term; })[0]; if (!a) return;
    clearTimeout(hideTimer);
    if (popFor) popFor.classList.remove("on");
    popFor = el; el.classList.add("on");
    pop.innerHTML = '<div class="h"><b>' + esc(a.n) + "</b><span>" + esc(LYN[a.ly] || "") + " · " + esc(a.cat) + "</span></div>" + esc(a.one) +
      '<div class="r"><i>解决</i>' + esc(a.s) + '</div><div class="r"><i>代价</i>' + esc(a.c) + "</div>" +
      '<a href="' + ROOT + "atlas.html#" + a.id + '">在技术图鉴中查看 →</a>';
    pop.classList.add("on");
    var r = el.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    var left = Math.max(12, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - w - 12));
    var top = window.scrollY + r.bottom + 8;
    if (r.bottom + h + 16 > window.innerHeight && r.top > h + 16) top = window.scrollY + r.top - h - 8;
    pop.style.left = left + "px"; pop.style.top = top + "px";
  }
  pop.addEventListener("mouseenter", function () { clearTimeout(hideTimer); });
  pop.addEventListener("mouseleave", function () { hideTimer = setTimeout(hidePop, 200); });

  var topics = document.querySelectorAll(".topic");
  if (topics.length && ATL.length) {
    var STOP = { "日志": 1, "指标": 1, "链路追踪": 1, "事务": 1, "重试": 1, "超时": 1, "认证": 1, "授权": 1, "备份": 1, "向量": 1, "网关": 1, "限流": 1, "熔断": 1, "降级": 1, "小程序": 1, "大模型": 1, "智能体": 1, "持续集成": 1, "持续部署": 1, "越权": 1, "强一致": 1, "最终一致": 1 };
    var map = {}, words = [];
    ATL.forEach(function (a) {
      [a.n].concat(a.aka || []).forEach(function (w) {
        var latin = /[A-Za-z]/.test(w);
        if (STOP[w] || map[w]) return;
        if (latin && w.replace(/[^A-Za-z0-9]/g, "").length < 3 && w !== "Go" && w !== "C#") return;
        if (!latin && w.length < 2) return;
        map[w] = a.id; words.push(w);
      });
    });
    words.sort(function (a, b) { return b.length - a.length; });
    var reEsc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };
    var re = new RegExp("(?<![A-Za-z0-9_+#.])(" + words.map(reEsc).join("|") + ")(?![A-Za-z0-9_+#])", "g");
    var SKIP = "pre,code,a,button,label,select,h3,.demo,.callout .i,.term,.kno,.pt,.tg,.st2,.st4,.st5";
    topics.forEach(function (topic) {
      var used = {}, count = 0;
      var walker = document.createTreeWalker(topic, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          var p = n.parentElement;
          if (!p || p.closest(SKIP) || !p.closest("p,li,td")) return NodeFilter.FILTER_REJECT;
          return /[A-Za-z一-鿿]/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      var nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        if (count >= 10) return;
        var text = node.nodeValue, out = [], last = 0, m, changed = false;
        re.lastIndex = 0;
        while ((m = re.exec(text)) && count < 10) {
          var id = map[m[1]];
          if (used[id]) continue;
          used[id] = true; count++; changed = true;
          out.push(document.createTextNode(text.slice(last, m.index)));
          var sp = document.createElement("span"); sp.className = "term"; sp.dataset.term = id; sp.tabIndex = 0; sp.textContent = m[1];
          out.push(sp); last = m.index + m[1].length;
        }
        if (!changed) return;
        out.push(document.createTextNode(text.slice(last)));
        var frag = document.createDocumentFragment(); out.forEach(function (x) { frag.appendChild(x); });
        node.parentNode.replaceChild(frag, node);
      });
    });
    document.addEventListener("mouseover", function (e) { var t = e.target.closest && e.target.closest(".term"); if (t) showPop(t); });
    document.addEventListener("mouseout", function (e) { var t = e.target.closest && e.target.closest(".term"); if (t) hideTimer = setTimeout(hidePop, 250); });
    document.addEventListener("focusin", function (e) { var t = e.target.closest && e.target.closest(".term"); if (t) showPop(t); });
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest(".term");
      if (t) { e.preventDefault(); popFor === t && pop.classList.contains("on") ? hidePop() : showPop(t); }
      else if (!e.target.closest(".term-pop")) hidePop();
    });
    window.addEventListener("resize", hidePop);
  }
})();
