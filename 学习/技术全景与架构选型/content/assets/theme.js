/* theme.js —— 深色 / 浅色 / 跟随系统。放在 <head> 里同步加载，避免页面闪白。
   偏好保存在 localStorage("arch_theme")：auto | light | dark */
(function () {
  var KEY = "arch_theme", root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function pref() { try { return localStorage.getItem(KEY) || "auto"; } catch (e) { return "auto"; } }
  function apply() {
    var p = pref();
    root.setAttribute("data-theme", p === "auto" ? (mq && mq.matches ? "dark" : "light") : p);
    root.setAttribute("data-theme-pref", p);
  }
  apply();
  if (mq && mq.addEventListener) mq.addEventListener("change", apply);
  window.addEventListener("storage", function (e) { if (e.key === KEY) apply(); });
  window.ArchTheme = {
    pref: pref, apply: apply,
    cycle: function () {
      var order = ["auto", "light", "dark"], n = order[(order.indexOf(pref()) + 1) % 3];
      try { localStorage.setItem(KEY, n); } catch (e) {}
      apply(); return n;
    }
  };
})();
