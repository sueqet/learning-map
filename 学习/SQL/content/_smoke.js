/* _smoke.js —— 极简 DOM 沙箱：执行每个详解页的内联 JS，捕获运行时异常
   用法：node _smoke.js [编号...]
   只做「能不能跑通、有没有抛错、面板有没有被挂载」的冒烟测试，不追求完整 DOM 语义。 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
require(path.join(__dirname, "assets", "sql-sandbox.js"));   // 让引擎在 Node 里可用

const DIR = "D:/DSH/Project/User/学习/SQL/content";
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

class El {
  constructor(tag, attrs) {
    this.tag = tag; this.attrs = attrs || {};
    this.children = []; this.parent = null;
    this._html = ""; this._text = "";
    this.listeners = {};
    this.checked = false; this._value = undefined;
    this.style = {}; this.disabled = false;
  }
  get value() {
    if (this.tag === "select") {
      if (this.attrs.value !== undefined) return this.attrs.value;
      const opts = all(this).filter(e => e.tag === "option");
      const sel = opts.find(o => o.selected === true || o.attrs.selected !== undefined) || opts[0];
      if (!sel) return "";
      return sel._value !== undefined ? sel._value : (sel.attrs.value !== undefined ? sel.attrs.value : sel.textContent.trim());
    }
    return this._value !== undefined ? this._value : (this.attrs.value || "");
  }
  set value(v) { this._value = String(v); }
  get id() { return this.attrs.id || ""; }
  set id(v) { this.attrs.id = String(v); }
  get className() { return this.attrs.class || ""; }
  set className(v) { this.attrs.class = String(v); }
  get classList() {
    const self = this;
    const list = () => (self.attrs.class || "").split(/\s+/).filter(Boolean);
    return {
      contains: c => list().includes(c),
      add: (...c) => { self.attrs.class = [...new Set([...list(), ...c])].join(" "); },
      remove: (...c) => { self.attrs.class = list().filter(x => !c.includes(x)).join(" "); },
      toggle: (c, on) => { const has = list().includes(c); const want = on === undefined ? !has : !!on; if (want) this.add ? null : null; want ? (list().includes(c) ? null : self.attrs.class = [...list(), c].join(" ")) : (self.attrs.class = list().filter(x => x !== c).join(" ")); return want; }
    };
  }
  get dataset() {
    const d = {};
    Object.keys(this.attrs).forEach(k => { if (k.startsWith("data-")) d[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = this.attrs[k]; });
    return d;
  }
  get innerHTML() { return this._html; }
  set innerHTML(v) {
    this._html = String(v);
    this.children = [];
    try { parseInto(this, this._html); } catch (e) { /* 忽略解析问题 */ }
  }
  get textContent() { return this._text || this.children.map(c => c.textContent).join(""); }
  set textContent(v) { this._text = String(v); }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  insertBefore(c, ref) { c.parent = this; const i = this.children.indexOf(ref); this.children.splice(i < 0 ? this.children.length : i, 0, c); return c; }
  removeChild(c) { this.children = this.children.filter(x => x !== c); return c; }
  remove() { if (this.parent) this.parent.removeChild(this); }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] === undefined ? null : this.attrs[k]; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  removeEventListener() { }
  dispatchEvent(ev) { const t = ev && ev.type; (this.listeners[t] || []).forEach(f => f(ev)); return true; }
  fire(type, extra) { return this.dispatchEvent(Object.assign({ type: type, target: this, preventDefault() { } }, extra || {})); }
  closest(sel) { let n = this; while (n) { if (matches(n, sel)) return n; n = n.parent; } return null; }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  querySelectorAll(sel) { return all(this).filter(el => matchesChain(el, sel)); }
  focus() { } click() { (this.listeners.click || []).forEach(f => f({ preventDefault() { } })); }
  get children_() { return this.children; }
}

function all(root) {
  const out = [];
  (function walk(n) { n.children.forEach(c => { out.push(c); walk(c); }); })(root);
  return out;
}
function matches(el, sel) {
  sel = sel.trim();
  if (!sel) return false;
  // 支持 tag / .class / #id / [attr] / [attr="v"] / :checked 的组合
  const parts = sel.match(/(^[a-zA-Z][\w-]*)|(\.[\w-]+)|(#[\w-]+)|(\[[^\]]+\])|(:checked)/g);
  if (!parts) return false;
  return parts.every(p => {
    if (p.startsWith(".")) return el.className.split(/\s+/).includes(p.slice(1));
    if (p.startsWith("#")) return el.id === p.slice(1);
    if (p === ":checked") return el.checked === true;
    if (p.startsWith("[")) {
      const m = p.slice(1, -1).match(/^([\w-]+)(?:=("?)([^"]*)\2)?$/);
      if (!m) return false;
      const v = el.attrs[m[1]];
      return m[3] === undefined ? v !== undefined : v === m[3];
    }
    return el.tag === p.toLowerCase();
  });
}
function matchesChain(el, sel) {
  const parts = sel.trim().split(/\s+(?![^\[]*\])/);
  if (parts.length === 1) return matches(el, parts[0]);
  if (!matches(el, parts[parts.length - 1])) return false;
  let i = parts.length - 2, n = el.parent;
  while (n && i >= 0) { if (matches(n, parts[i])) i--; n = n.parent; }
  return i < 0;
}

/* ---------- 极简 HTML 解析 ---------- */
function parseInto(root, html) {
  const stack = [root];
  let i = 0;
  const push = el => stack[stack.length - 1].appendChild(el);
  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt < 0) { break; }
    if (lt > i) { const txt = html.slice(i, lt).trim(); if (txt) { const t = stack[stack.length - 1]; t._text += txt; } }
    if (html.startsWith("<!--", lt)) { i = html.indexOf("-->", lt) + 3; continue; }
    const gt = html.indexOf(">", lt);
    if (gt < 0) break;
    const raw = html.slice(lt + 1, gt);
    if (raw.startsWith("/")) {
      const tag = raw.slice(1).trim().toLowerCase();
      for (let k = stack.length - 1; k > 0; k--) { if (stack[k].tag === tag) { stack.length = k; break; } }
      i = gt + 1; continue;
    }
    const m = raw.match(/^([a-zA-Z0-9-]+)/);
    if (!m) { i = gt + 1; continue; }
    const tag = m[1].toLowerCase();
    const attrs = {};
    raw.slice(m[1].length).replace(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g, (_, k, a, b, c) => {
      attrs[k.toLowerCase()] = a !== undefined ? a : b !== undefined ? b : c !== undefined ? c : "";
      return "";
    });
    const el = new El(tag, attrs);
    push(el);
    if (tag === "script" || tag === "style") {
      const close = html.toLowerCase().indexOf("</" + tag, gt);
      const end = close < 0 ? html.length : close;
      el._text = html.slice(gt + 1, end);
      i = close < 0 ? html.length : html.indexOf(">", close) + 1;
      continue;
    }
    if (!VOID.has(tag) && !raw.endsWith("/")) stack.push(el);
    i = gt + 1;
  }
}

/* ---------- 执行 ---------- */
const only = process.argv.slice(2);
let files = fs.readdirSync(DIR).filter(f => /^\d\d-.*\.html$/.test(f)).sort().map(f => [f, path.join(DIR, f)]);
files.push(["index.html", path.join(DIR, "..", "index.html")]);          // 大纲页也一起冒烟
if (only.length) files = files.filter(([f]) => only.some(o => f.startsWith(o)));

let bad = 0;
for (const [f, full] of files) {
  const html = fs.readFileSync(full, "utf8");
  const root = new El("html", {});
  const head = new El("head", {}); const body = new El("body", {});
  root.appendChild(head); root.appendChild(body);
  try { parseInto(body, html.replace(/<head>[\s\S]*?<\/head>/i, "")); } catch (e) { console.log("解析失败", f, e.message); }
  try { parseInto(head, (html.match(/<head>([\s\S]*?)<\/head>/i) || [, ""])[1]); } catch (e) { }

  const store = new Map();
  const document = {
    head, body, documentElement: root,
    getElementById: id => all(root).find(e => e.id === id) || null,
    querySelector: s => root.querySelector(s),
    querySelectorAll: s => root.querySelectorAll(s),
    createElement: t => new El(t, {}),
    addEventListener() { }, title: ""
  };
  const window = {
    document, localStorage: {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k)
    },
    addEventListener() { }, scrollTo() { }, scrollY: 0, alert() { }, confirm: () => true,
    location: { href: "", hash: "" }, navigator: { userAgent: "node" },
    SQLSandbox: globalThis.SQLSandbox
  };
  const sandbox = Object.assign(window, { window, globalThis: window, console, Math, JSON, Date, String, Number, Object, Array, RegExp, Error, Set, Map, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent });
  sandbox.mermaid = { initialize() { } };
  vm.createContext(sandbox);
  globalThis.document = document;        // 让引擎的 mount() 拿到页面 document
  globalThis.window = window;

  const errs = [];
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  scripts.forEach((code, si) => {
    try { vm.runInContext(code, sandbox, { timeout: 5000 }); }
    catch (e) { errs.push(`script#${si + 1}: ${e.message}\n      ${(e.stack || "").split("\n").slice(0, 4).join("\n      ")}`); }
  });

  // 面板是否真的渲染出内容（递归取文本，含 appendChild 进去的子节点）
  const textOf = e => ((e._text || "") + e.children.map(textOf).join("") + (e.innerHTML || "").replace(/<[^>]*>/g, "")).trim();
  const empties = [];
  const checkPanels = () => all(root).filter(e => /^demo/i.test(e.id)).filter(e => textOf(e).length < 10).map(e => e.id);

  /* ---------- 交互模拟：点按钮 / 换下拉 / 勾选 / 拖滑块 / 答题 ---------- */
  const ierr = [];
  const guard = (what, fn) => { try { fn(); } catch (e) { ierr.push(`${what}: ${e.message}`); } };
  const els = all(root);
  const tag = e => (e.tag + (e.id ? "#" + e.id : "") + (e.className ? "." + e.className.split(/\s+/)[0] : ""));

  // 1) 每道考核题先选一个选项，再点「提交此题」——验证判分引擎
  els.filter(e => e.tag === "input" && e.attrs.type === "radio").forEach((r, i) => { if (i % 4 === 0) r.checked = true; });
  // 2) 点击所有按钮（提交、预设、分步、切换…）
  els.filter(e => e.tag === "button").forEach(b => {
    guard(`点击 <button>「${(b.textContent || "").trim().slice(0, 14)}」`, () => b.fire("click"));
  });
  // 3) 下拉切换（每个 select 试 3 个选项）
  els.filter(e => e.tag === "select").forEach(s => {
    const opts = all(s).filter(o => o.tag === "option");
    opts.slice(0, 3).forEach(o => {
      guard(`切换 <select>「${(s.textContent || "").trim().slice(0, 14)}」→ ${o.textContent.trim().slice(0, 10)}`, () => {
        s.value = o._value !== undefined ? o._value : (o.attrs.value !== undefined ? o.attrs.value : o.textContent.trim());
        s.fire("change");
      });
    });
  });
  // 4) 勾选框（含知识点「已学会」与大纲进度）
  els.filter(e => e.tag === "input" && e.attrs.type === "checkbox").forEach(c => {
    guard(`勾选 checkbox${c.dataset.key ? "(" + c.dataset.key + ")" : ""}`, () => { c.checked = !c.checked; c.fire("change"); });
  });
  // 5) 滑块 / 文本框
  els.filter(e => e.tag === "input" && ["range", "text", undefined].includes(e.attrs.type)).forEach(inp => {
    guard(`输入 <input${inp.attrs.type ? " type=" + inp.attrs.type : ""}>`, () => {
      inp.value = inp.attrs.type === "range" ? String(Math.round((+(inp.attrs.max || 100)) / 2)) : "北京";
      inp.fire("input");
      inp.fire("change");
    });
  });
  // 6) 答题引擎的功能断言：全部提交后计分面板应显示
  const qs = document.getElementById("qscore");
  if (qs && (root.querySelectorAll(".qcard").length > 0) && qs.style.display !== "flex") {
    ierr.push("答题计分面板未在全部提交后显示（#qscore.style.display 仍为 " + JSON.stringify(qs.style.display) + "）");
  }
  empties.push(...checkPanels());

  if (errs.length || empties.length || ierr.length) {
    bad++;
    console.log(`✗ ${f}`);
    errs.forEach(e => console.log("    " + e));
    ierr.forEach(e => console.log("    交互 " + e));
    if (empties.length) console.log("    演示面板无内容: " + [...new Set(empties)].join(", "));
  } else {
    const panels = all(root).filter(e => /^demo/i.test(e.id)).length + all(root).filter(e => e.className.split(/\s+/).includes("demo")).length;
    const clicks = els.filter(e => e.tag === "button").length;
    console.log(`✓ ${f}  (内联脚本 ${scripts.length} 段，演示面板 ${panels} 处，按钮点击 ${clicks} 次，无异常)`);
  }
}
console.log(bad ? `\n✗ ${bad} 个文件有问题` : "\n✓ 冒烟测试全部通过");
