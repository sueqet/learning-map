/* ============================================================
   技术全景与架构选型 · 详解页共享引擎（learn.js）
   ------------------------------------------------------------
   每个详解页先在内联 <script> 里定义全局 CONFIG 与 QUZ，
   再引入本文件。本文件负责：
     1. 标题 / 导航 / 上一节下一节
     2. 知识点「已学会」勾选 + 「我已掌握本节」，与大纲共用同一 localStorage 键
     3. 考核题渲染、判分、解析、得分环
   并对外暴露 window.ArchKit（演示面板用的小工具）。
   一般不需要改动；改了会影响全部详解页。
   ============================================================ */
(function () {
  "use strict";

  var KEY = "arch_outline_progress_v1";   // 与 index.html 一致
  var PACK = "技术全景与架构选型";

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- 1. 标题 / 导航 / 翻页 ---------- */
  (function () {
    $("navTitle").textContent = CONFIG.title;
    $("eyebrow").textContent = CONFIG.eyebrow;
    $("pageTitle").textContent = CONFIG.title;
    $("pageLead").textContent = CONFIG.lead;
    document.title = CONFIG.title + " · " + PACK;

    function setup(el, href, label) {
      if (!el) return;
      if (href) { el.href = href; el.classList.remove("disabled"); }
      else { el.classList.add("disabled"); el.removeAttribute("href"); }
      if (label) { var t = el.querySelector(".t"); if (t) t.textContent = label; }
    }
    setup($("prevLink"), CONFIG.prev);
    setup($("nextLink"), CONFIG.next);
    setup($("footPrev"), CONFIG.prev, CONFIG.prevTitle || (CONFIG.prev ? "上一节" : "已经是第一节"));
    setup($("footNext"), CONFIG.next, CONFIG.nextTitle || (CONFIG.next ? "下一节" : "已经是最后一节"));
  })();

  /* ---------- 2. 进度（与大纲双向同步） ---------- */
  (function () {
    var get = function () { try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch (e) { return new Set(); } };
    var set = function (s) { try { localStorage.setItem(KEY, JSON.stringify(Array.from(s))); } catch (e) {} };
    var btn = $("masterBtn");
    var boxes = function () { return document.querySelectorAll(".ptmark input[data-key]"); };

    function sync() {
      var done = get();
      boxes().forEach(function (inp) {
        inp.checked = done.has(inp.dataset.key);
        inp.closest(".ptmark").classList.toggle("on", inp.checked);
      });
      var total = CONFIG.points.length;
      var n = CONFIG.points.filter(function (id) { return done.has(CONFIG.moduleId + "::" + id); }).length;
      var full = n === total && total > 0;
      btn.classList.toggle("done", full);
      btn.textContent = full ? "✓ 本节已掌握（" + total + "/" + total + "）" : "标记：我已掌握本节（" + n + "/" + total + "）";
    }

    boxes().forEach(function (inp) {
      inp.addEventListener("change", function () {
        var done = get(), k = inp.dataset.key;
        if (inp.checked) done.add(k); else done.delete(k);
        set(done); sync();
      });
    });
    btn.addEventListener("click", function () {
      var done = get();
      var all = CONFIG.points.map(function (id) { return CONFIG.moduleId + "::" + id; });
      var full = all.every(function (k) { return done.has(k); });
      all.forEach(function (k) { if (full) done.delete(k); else done.add(k); });
      set(done); sync();
    });
    window.addEventListener("storage", sync);
    sync();
    window.ArchProgress = { get: get, onChange: function (fn) { window.addEventListener("arch-progress", fn); } };
    var _sync = sync;
    // 之后每次 sync（勾选、一键掌握）都广播 arch-progress，供目录和「下一步」刷新
    sync = function () { _sync(); window.dispatchEvent(new CustomEvent("arch-progress")); };
    window.addEventListener("storage", function () { window.dispatchEvent(new CustomEvent("arch-progress")); });
  })();

  /* ---------- 2b. 阅读进度条、侧边目录、键盘翻页、下一步推荐 ---------- */
  (function () {
    var bar = document.createElement("div"); bar.className = "readbar"; document.body.appendChild(bar);
    function onScroll() {
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? Math.min(100, h.scrollTop / max * 100) : 0) + "%";
    }
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

    var topics = [].slice.call(document.querySelectorAll(".topic"));
    var done = function () { return window.ArchProgress ? window.ArchProgress.get() : new Set(); };
    if (topics.length) {
      var toc = document.createElement("nav"); toc.className = "toc"; toc.setAttribute("aria-label", "本节目录");
      toc.innerHTML = '<div class="toc-h">本节目录</div>' + topics.map(function (t, i) {
        var h = t.querySelector("h3"), title = t.id;
        if (h) title = [].slice.call(h.childNodes).filter(function (n) { return n.nodeType === 3; }).map(function (n) { return n.nodeValue; }).join("").trim();
        return '<a href="#' + t.id + '" data-id="' + t.id + '"><span class="n" data-n="' + (i + 1) + '">' + (i + 1) + '</span><span class="tt">' + esc(title) + "</span></a>";
      }).join("") + '<a href="#quiz" data-id="quiz"><span class="n">✎</span><span class="tt">本节考核</span></a>';
      document.body.appendChild(toc);
      var links = [].slice.call(toc.querySelectorAll("a"));
      var paint = function () {
        var d = done();
        links.forEach(function (a) {
          var n = a.querySelector(".n"); if (!n.dataset.n) return;
          var ok = d.has(CONFIG.moduleId + "::" + a.dataset.id);
          a.classList.toggle("done", ok); n.textContent = ok ? "✓" : n.dataset.n;
        });
      };
      window.addEventListener("arch-progress", paint); paint();
      if ("IntersectionObserver" in window) {
        var targets = topics.concat([document.getElementById("quiz")]);
        var io = new IntersectionObserver(function (ents) {
          ents.forEach(function (en) {
            if (en.isIntersecting) links.forEach(function (a) { a.classList.toggle("on", a.dataset.id === en.target.id); });
          });
        }, { rootMargin: "-30% 0px -60% 0px" });
        targets.forEach(function (t) { if (t) io.observe(t); });
      }
    }

    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || "") || document.querySelector(".pal-mask.on")) return;
      if (e.key === "ArrowLeft" && CONFIG.prev) location.href = CONFIG.prev;
      if (e.key === "ArrowRight" && CONFIG.next) location.href = CONFIG.next;
    });

    var tip = document.querySelector(".master .tip");
    var MODS = window.ARCH_MODULES || [];
    if (tip && MODS.length) {
      var nx = document.createElement("div"); nx.className = "nextup"; tip.parentNode.appendChild(nx);
      var suggest = function () {
        var d = done(), start = Math.max(0, MODS.map(function (m) { return m.id; }).indexOf(CONFIG.moduleId));
        for (var k = 0; k < MODS.length; k++) {
          var m = MODS[(start + k) % MODS.length];
          for (var j = 0; j < m.pts.length; j++) {
            var p = m.pts[j];
            if (!d.has(m.id + "::" + p.id)) {
              var same = m.id === CONFIG.moduleId;
              nx.innerHTML = (same ? "本节还没学会：" : "下一步推荐：") + '<a href="' + m.file + "#" + p.id + '">' + (same ? "" : m.no + " · " + esc(m.title) + " — ") + esc(p.title) + " →</a>";
              return;
            }
          }
        }
        nx.innerHTML = '🎉 全部 ' + MODS.reduce(function (a, m) { return a + m.pts.length; }, 0) + ' 个知识点都已学会！去 <a href="../sandbox.html">架构沙盘</a> 检验一下判断力吧。';
      };
      window.addEventListener("arch-progress", suggest); suggest();
    }
  })();

  /* ---------- 3. 考核渲染与计分 ---------- */
  (function () {
    var box = $("quizBox");
    var letter = "ABCDEFGHIJ";
    box.innerHTML = QUZ.map(function (q, i) {
      return '<div class="qcard" data-i="' + i + '">' +
        '<div class="qt"><span class="qi">' + (i + 1) + "</span><span>" + q.q + "</span></div>" +
        (q.code ? '<div class="qsql">' + esc(q.code) + "</div>" : "") +
        '<div class="tagline">' + (q.type === "interview" ? "⌁ 面试 / 实战延伸" : "✎ 掌握度自测") + "</div>" +
        q.opts.map(function (o, j) {
          return '<label class="opt"><input type="radio" name="q' + i + '" value="' + j + '">' + letter[j] + ". " + o + "</label>";
        }).join("") +
        '<div class="act"><button class="btn" data-submit="1">提交此题</button></div>' +
        '<div class="fb"></div></div>';
    }).join("");

    var results = QUZ.map(function () { return null; });
    box.querySelectorAll("[data-submit]").forEach(function (b) {
      b.addEventListener("click", function () {
        var card = b.closest(".qcard"), i = +card.dataset.i, q = QUZ[i];
        var sel = card.querySelector("input:checked");
        var fb = card.querySelector(".fb");
        if (!sel) { fb.className = "fb show"; fb.textContent = "请先选择一个选项。"; return; }
        var si = +sel.value, ok = si === q.ans;
        results[i] = ok;
        card.querySelectorAll(".opt").forEach(function (o, j) {
          o.classList.add("disabled");
          if (j === q.ans) o.classList.add("correct");
          if (j === si && !ok) o.classList.add("wrong");
        });
        b.disabled = true;
        fb.className = "fb show " + (ok ? "ok" : "bad");
        fb.innerHTML = (ok ? "✅ 回答正确！" : "❌ 回答错误。") + " <b>" + q.opts[q.ans] + "</b><br>" + q.exp;
        score();
      });
    });

    function score() {
      var got = results.filter(function (x) { return x === true; }).length;
      var pct = Math.round(got / results.length * 100);
      var fg = $("ringFg"), len = 2 * Math.PI * 27;
      fg.style.strokeDasharray = len; fg.style.strokeDashoffset = len * (1 - pct / 100);
      $("ringPct").textContent = pct + "%";
      var sc = $("qscore");
      if (results.some(function (x) { return x === null; })) { sc.style.display = "none"; return; }
      sc.style.display = "flex";
      $("scoreText").innerHTML = got === results.length
        ? "🎉 全部答对，共 <b>" + results.length + "</b> 题！你已经能用自己的话讲清本节。<br><span style=\"color:var(--muted);font-size:13px\">建议继续做「进阶挑战」，把答案写进自己的笔记。</span>"
        : "你答对 <b>" + got + " / " + results.length + "</b> 题。" + (pct >= 60 ? "已基本掌握，回看错题对应的知识点即可。" : "建议回看错题对应的知识点，再测一次。");
    }
  })();

  /* ---------- 4. 演示面板小工具 ---------- */
  window.ArchKit = {
    esc: esc,
    /* 一组 [data-v] 按钮做单选：点哪个高亮哪个并回调 fn(value)。默认选中 initial 或第一个。 */
    choice: function (groupId, fn, initial) {
      var g = $(groupId);
      var btns = g.querySelectorAll("[data-v]");
      function pick(v) {
        btns.forEach(function (b) { b.classList.toggle("on", b.dataset.v === v); });
        fn(v);
      }
      btns.forEach(function (b) { b.addEventListener("click", function () { pick(b.dataset.v); }); });
      pick(initial != null ? initial : btns[0].dataset.v);
      return pick;
    },
    /* 分步器：steps = [{t, html, note}]；render 到 outId，日志到 logId。 */
    stepper: function (o) {
      var i = -1, out = $(o.out), log = $(o.log);
      function render() {
        if (i < 0) {
          out.innerHTML = o.idle || '<p style="color:var(--muted);font-size:13.5px;margin:0">准备就绪，点「下一步」开始。</p>';
          log.textContent = "点「下一步」开始…";
        } else {
          var s = o.steps[i];
          out.innerHTML = '<div style="font-weight:700;color:var(--green);margin-bottom:6px">第 ' + (i + 1) + " / " + o.steps.length + " 步 · " + s.t + "</div>" + s.html;
          log.innerHTML = "<b>" + s.t + "</b>：" + s.note;
        }
        if (o.onRender) o.onRender(i);
      }
      $(o.next).addEventListener("click", function () { i = Math.min(i + 1, o.steps.length - 1); render(); });
      if (o.prev) $(o.prev).addEventListener("click", function () { i = Math.max(i - 1, -1); render(); });
      $(o.reset).addEventListener("click", function () { i = -1; render(); });
      if (o.start != null) i = o.start;
      render();
    },
    /* 1–5 格评分条 */
    meter: function (n) {
      var h = '<span class="meter" title="' + n + '/5">';
      for (var k = 1; k <= 5; k++) h += '<i class="' + (k <= n ? "f" : "") + '"></i>';
      return h + "</span>";
    }
  };
})();
