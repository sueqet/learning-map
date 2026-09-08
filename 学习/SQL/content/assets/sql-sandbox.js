/* ============================================================
   sql-sandbox.js —— SQL 学习包的「交互演示」共享引擎
   纯前端迷你 SQL 引擎（教学用），支持：
     SELECT [DISTINCT] 列/表达式/聚合
     FROM 表 [别名] [INNER|LEFT|RIGHT|FULL|CROSS] JOIN 表 [ON ...|USING (...)]
     WHERE / GROUP BY / HAVING / ORDER BY / LIMIT [OFFSET]
     表达式：算术、比较、AND/OR/NOT、IS [NOT] NULL、[NOT] LIKE、
             [NOT] IN (…)、[NOT] BETWEEN … AND …、CASE WHEN、
             EXISTS/标量子查询、(子查询) 派生表
     函数：COUNT/SUM/AVG/MIN/MAX（含 DISTINCT）、UPPER/LOWER/LENGTH/
             CONCAT/SUBSTR/TRIM/REPLACE/ROUND/ABS/CEIL/FLOOR/COALESCE/
             IFNULL/IF/NULLIF/YEAR/MONTH/DAY/DATE_FORMAT
   用法：
     SQLSandbox.run(sql, tables)   → {columns, rows, plan, error}
     SQLSandbox.mount(el, {query, presets, tables, height})
   全站示例数据统一为电商场景，见下方 SAMPLE。
   ============================================================ */
(function (global) {
  "use strict";

  /* ------------------------------------------------------------
     一、统一示例数据集（全站一致：customers / orders /
         order_items / products / employees）
     ------------------------------------------------------------ */
  const SAMPLE = {
    customers: {
      columns: ["id", "name", "city", "gender", "signup_date", "level"],
      rows: [
        [1, "张伟", "北京", "M", "2023-01-05", "金卡"],
        [2, "李娜", "上海", "F", "2023-02-11", "银卡"],
        [3, "王强", "广州", "M", "2023-03-20", "金卡"],
        [4, "刘敏", "深圳", "F", "2023-04-02", "普通"],
        [5, "陈晨", "杭州", "M", "2023-05-18", "银卡"],
        [6, "赵磊", "北京", "M", "2023-06-25", "普通"],
        [7, "孙悦", "上海", "F", "2023-07-30", "金卡"],
        [8, "周涛", null, null, "2023-08-14", "普通"]
      ]
    },
    orders: {
      columns: ["id", "customer_id", "order_date", "amount", "status"],
      rows: [
        [1001, 1, "2024-01-05", 247.00, "paid"],
        [1002, 1, "2024-01-20", 1299.00, "paid"],
        [1003, 2, "2024-01-08", 89.00, "paid"],
        [1004, 3, "2024-02-11", 2297.00, "paid"],
        [1005, 3, "2024-02-15", 318.00, "refunded"],
        [1006, 4, "2024-02-20", 59.00, "paid"],
        [1007, 5, "2024-03-01", 998.00, "paid"],
        [1008, 5, "2024-03-12", 89.00, "paid"],
        [1009, 6, "2024-03-18", 129.00, "cancelled"],
        [1010, 7, "2024-04-02", 1458.00, "paid"],
        [1011, 7, "2024-04-15", 178.00, "paid"],
        [1012, 2, "2024-04-22", 1497.00, "paid"]
      ]
    },
    products: {
      columns: ["id", "name", "category", "price", "stock"],
      rows: [
        [1, "机械键盘", "数码", 499.00, 120],
        [2, "无线鼠标", "数码", 129.00, 300],
        [3, "显示器", "数码", 1299.00, 40],
        [4, "笔记本", "图书", 59.00, 500],
        [5, "保温杯", "家居", 89.00, 200],
        [6, "台灯", "家居", 159.00, 80]
      ]
    },
    order_items: {
      columns: ["id", "order_id", "product_id", "qty", "unit_price"],
      rows: [
        [1, 1001, 2, 1, 129.00],
        [2, 1001, 4, 2, 59.00],
        [3, 1002, 3, 1, 1299.00],
        [4, 1003, 5, 1, 89.00],
        [5, 1004, 3, 1, 1299.00],
        [6, 1004, 1, 2, 499.00],
        [7, 1005, 6, 2, 159.00],
        [8, 1006, 4, 1, 59.00],
        [9, 1007, 1, 2, 499.00],
        [10, 1008, 5, 1, 89.00],
        [11, 1009, 2, 1, 129.00],
        [12, 1010, 3, 1, 1299.00],
        [13, 1010, 6, 1, 159.00],
        [14, 1011, 5, 2, 89.00],
        [15, 1012, 1, 3, 499.00]
      ]
    },
    employees: {
      columns: ["id", "name", "dept", "manager_id", "salary", "hire_date"],
      rows: [
        [1, "张伟", "技术", null, 35000, "2019-03-01"],
        [2, "李娜", "技术", 1, 28000, "2020-07-15"],
        [3, "王强", "技术", 1, 26000, "2021-02-01"],
        [4, "刘敏", "市场", null, 30000, "2018-11-20"],
        [5, "陈晨", "市场", 4, 18000, "2022-05-10"],
        [6, "赵磊", "财务", null, 24000, "2019-09-05"],
        [7, "孙悦", "技术", 2, 22000, "2023-01-10"],
        [8, "周涛", "市场", 4, 16500, "2023-08-14"],
        [9, "吴迪", "财务", 6, 15000, "2024-01-08"]
      ]
    }
  };

  /* ------------------------------------------------------------
     二、词法分析
     ------------------------------------------------------------ */
  function tokenize(sql) {
    const out = [];
    let i = 0;
    const ID_START = /[A-Za-z_\u4e00-\u9fa5]/;
    const ID_CHAR = /[A-Za-z0-9_\u4e00-\u9fa5$]/;
    while (i < sql.length) {
      const ch = sql[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === "-" && sql[i + 1] === "-") { while (i < sql.length && sql[i] !== "\n") i++; continue; }
      if (ch === "/" && sql[i + 1] === "*") { i += 2; while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) i++; i += 2; continue; }
      if (ch === "#" ) { while (i < sql.length && sql[i] !== "\n") i++; continue; }
      if (ch === "'" || ch === '"') {
        const q = ch; let j = i + 1, s = "";
        while (j < sql.length) {
          if (sql[j] === q) { if (sql[j + 1] === q) { s += q; j += 2; continue; } break; }
          if (sql[j] === "\\") { s += sql[j + 1]; j += 2; continue; }
          s += sql[j]; j++;
        }
        out.push({ t: "str", v: s }); i = j + 1; continue;
      }
      if (/[0-9]/.test(ch)) {
        let j = i; while (j < sql.length && /[0-9.]/.test(sql[j])) j++;
        out.push({ t: "num", v: parseFloat(sql.slice(i, j)) }); i = j; continue;
      }
      if (ID_START.test(ch)) {
        let j = i; while (j < sql.length && ID_CHAR.test(sql[j])) j++;
        out.push({ t: "id", v: sql.slice(i, j) }); i = j; continue;
      }
      const two = sql.substr(i, 2);
      if (two === "<>" || two === "!=" || two === "<=" || two === ">=" || two === "||") { out.push({ t: "op", v: two }); i += 2; continue; }
      if ("(),.*+-/%=<>;".indexOf(ch) >= 0) { out.push({ t: "op", v: ch }); i++; continue; }
      throw new Error("无法识别的字符：" + ch);
    }
    return out;
  }

  const KW = new Set(["SELECT","FROM","WHERE","GROUP","ORDER","BY","HAVING","LIMIT","OFFSET","AS","AND","OR","NOT","IS","NULL","IN","LIKE","BETWEEN","CASE","WHEN","THEN","ELSE","END","DISTINCT","EXISTS","JOIN","INNER","LEFT","RIGHT","FULL","CROSS","OUTER","ON","USING","ASC","DESC","TRUE","FALSE","UNION"]);
  const AGG = new Set(["COUNT","SUM","AVG","MIN","MAX","GROUP_CONCAT"]);

  /* ------------------------------------------------------------
     三、子句切分
     ------------------------------------------------------------ */
  const upOf = tk => (tk && tk.t === "id") ? tk.v.toUpperCase() : null;

  function findClauses(tokens) {
    const res = { select: null, from: null, where: null, group: null, having: null, order: null, limit: null };
    let i = 0, depth = 0;
    while (i < tokens.length && upOf(tokens[i]) !== "SELECT") i++;
    if (i >= tokens.length) throw new Error("本沙箱只支持 SELECT 查询（练习查询语法用）");
    i++;
    res.select = [];
    let cur = "select";
    for (; i < tokens.length; i++) {
      const tk = tokens[i];
      if (tk.t === "op" && tk.v === "(") depth++;
      else if (tk.t === "op" && tk.v === ")") depth--;
      if (depth === 0 && tk.t === "id") {
        const u = tk.v.toUpperCase();
        if (u === "DISTINCT" && cur === "select" && res.select.length === 0) { res.distinct = true; continue; }
        if (u === "FROM" && !res.from) { cur = "from"; res.from = []; continue; }
        if (u === "WHERE" && !res.where) { cur = "where"; res.where = []; continue; }
        if (u === "HAVING" && !res.having) { cur = "having"; res.having = []; continue; }
        if (u === "LIMIT" && !res.limit) { cur = "limit"; res.limit = []; continue; }
        if ((u === "GROUP" || u === "ORDER") && upOf(tokens[i + 1]) === "BY") {
          const key = u === "GROUP" ? "group" : "order";
          if (!res[key]) { cur = key; res[key] = []; i++; continue; }
        }
        if (u === "UNION") throw new Error("沙箱暂不支持 UNION / UNION ALL，请在详解页里阅读语法后到真实数据库练习");
      }
      if (res[cur]) res[cur].push(tk);
    }
    return res;
  }

  function splitTop(tokens, sep) {
    const parts = []; let cur = [], depth = 0;
    for (const tk of tokens) {
      if (tk.t === "op" && tk.v === "(") depth++;
      if (tk.t === "op" && tk.v === ")") depth--;
      if (depth === 0 && tk.t === "op" && tk.v === sep) { parts.push(cur); cur = []; continue; }
      cur.push(tk);
    }
    parts.push(cur);
    return parts.filter(p => p.length);
  }

  /* ------------------------------------------------------------
     四、表达式解析（递归下降）
     ------------------------------------------------------------ */
  function ExprParser(toks) { this.toks = toks; this.i = 0; }
  ExprParser.prototype.peek = function (k) { return this.toks[this.i + (k || 0)]; };
  ExprParser.prototype.next = function () { return this.toks[this.i++]; };
  ExprParser.prototype.atOp = function (v) { const t = this.peek(); return t && t.t === "op" && t.v === v; };
  ExprParser.prototype.atKw = function (v) { return upOf(this.peek()) === v; };
  ExprParser.prototype.eatOp = function (v) { if (this.atOp(v)) { this.i++; return true; } return false; };
  ExprParser.prototype.eatKw = function (v) { if (this.atKw(v)) { this.i++; return true; } return false; };
  ExprParser.prototype.done = function () { return this.i >= this.toks.length; };

  ExprParser.prototype.parse = function () { return this.parseOr(); };

  ExprParser.prototype.parseOr = function () {
    let l = this.parseAnd();
    while (this.eatKw("OR")) l = { k: "bin", op: "OR", l: l, r: this.parseAnd() };
    return l;
  };
  ExprParser.prototype.parseAnd = function () {
    let l = this.parseNot();
    while (this.eatKw("AND")) l = { k: "bin", op: "AND", l: l, r: this.parseNot() };
    return l;
  };
  ExprParser.prototype.parseNot = function () {
    if (this.eatKw("NOT")) return { k: "un", op: "NOT", e: this.parseNot() };
    return this.parseCompare();
  };
  ExprParser.prototype.parseCompare = function () {
    let l = this.parseAdd();
    for (;;) {
      const t = this.peek();
      if (!t) break;
      if (t.t === "op" && ["=", "<>", "!=", "<", "<=", ">", ">="].indexOf(t.v) >= 0) {
        this.i++; l = { k: "bin", op: t.v, l: l, r: this.parseAdd() }; continue;
      }
      if (upOf(t) === "IS") {
        this.i++; const not = this.eatKw("NOT");
        if (!this.eatKw("NULL")) throw new Error("IS 后面只能是 NULL");
        l = { k: "isnull", e: l, not: not }; continue;
      }
      const not = (upOf(t) === "NOT") ? (this.i++, true) : false;
      const t2 = this.peek();
      if (upOf(t2) === "LIKE") { this.i++; l = { k: "like", e: l, pat: this.parseAdd(), not: not }; continue; }
      if (upOf(t2) === "IN") {
        this.i++; this.eatOp("(");
        let list = [], sub = null;
        if (upOf(this.peek()) === "SELECT") {
          const toks = []; let depth = 0;
          while (!this.done()) {
            const x = this.peek();
            if (x.t === "op" && x.v === "(") depth++;
            if (x.t === "op" && x.v === ")") { if (depth === 0) break; depth--; }
            toks.push(this.next());
          }
          sub = toks;
        } else {
          list = splitTop(this.collectParen(), ",").map(ts => new ExprParser(ts).parse());
        }
        this.eatOp(")");
        l = { k: "in", e: l, list: list, sub: sub, not: not }; continue;
      }
      if (upOf(t2) === "BETWEEN") {
        this.i++;
        const lo = this.parseAdd();
        if (!this.eatKw("AND")) throw new Error("BETWEEN 需要 … AND …");
        l = { k: "between", e: l, lo: lo, hi: this.parseAdd(), not: not }; continue;
      }
      if (not) throw new Error("NOT 后面只能是 LIKE / IN / BETWEEN");
      break;
    }
    return l;
  };
  ExprParser.prototype.collectParen = function () {
    const out = []; let depth = 0;
    while (!this.done()) {
      const x = this.peek();
      if (x.t === "op" && x.v === "(") { depth++; out.push(this.next()); continue; }
      if (x.t === "op" && x.v === ")") { if (depth === 0) break; depth--; out.push(this.next()); continue; }
      out.push(this.next());
    }
    return out;
  };
  ExprParser.prototype.parseAdd = function () {
    let l = this.parseMul();
    for (;;) {
      const t = this.peek();
      if (t && t.t === "op" && (t.v === "+" || t.v === "-" || t.v === "||")) { this.i++; l = { k: "bin", op: t.v, l: l, r: this.parseMul() }; continue; }
      break;
    }
    return l;
  };
  ExprParser.prototype.parseMul = function () {
    let l = this.parseUnary();
    for (;;) {
      const t = this.peek();
      if (t && t.t === "op" && (t.v === "*" || t.v === "/" || t.v === "%")) { this.i++; l = { k: "bin", op: t.v, l: l, r: this.parseUnary() }; continue; }
      break;
    }
    return l;
  };
  ExprParser.prototype.parseUnary = function () {
    if (this.atOp("-")) { this.i++; return { k: "un", op: "-", e: this.parseUnary() }; }
    if (this.atOp("+")) { this.i++; return this.parseUnary(); }
    return this.parsePrimary();
  };
  ExprParser.prototype.parsePrimary = function () {
    const t = this.next();
    if (!t) throw new Error("表达式不完整");
    if (t.t === "num") return { k: "lit", v: t.v };
    if (t.t === "str") return { k: "lit", v: t.v };
    if (t.t === "op" && t.v === "(") {
      if (upOf(this.peek()) === "SELECT") {
        const toks = this.collectParen(); this.eatOp(")");
        return { k: "sub", toks: toks };
      }
      const e = this.parse(); this.eatOp(")"); return e;
    }
    if (t.t === "op" && t.v === "*") return { k: "star" };
    if (t.t === "id") {
      const U = t.v.toUpperCase();
      if (U === "NULL") return { k: "lit", v: null };
      if (U === "TRUE") return { k: "lit", v: true };
      if (U === "FALSE") return { k: "lit", v: false };
      if (U === "CASE") return this.parseCase();
      if (U === "EXISTS") { this.eatOp("("); const toks = this.collectParen(); this.eatOp(")"); return { k: "exists", toks: toks }; }
      if (U === "NOT" && upOf(this.peek()) === "EXISTS") { this.i++; this.eatOp("("); const toks = this.collectParen(); this.eatOp(")"); return { k: "exists", toks: toks, not: true }; }
      if (this.atOp("(")) {
        this.i++;
        const distinct = this.eatKw("DISTINCT");
        let args = [];
        if (!this.atOp(")")) args = splitTop(this.collectParen(), ",").map(ts => new ExprParser(ts).parse());
        this.eatOp(")");
        return { k: "func", name: U, args: args, distinct: distinct };
      }
      if (this.atOp(".")) {
        this.i++;
        const nx = this.next();
        if (nx && nx.t === "op" && nx.v === "*") return { k: "star", prefix: t.v };
        return { k: "col", name: t.v + "." + (nx ? nx.v : "") };
      }
      return { k: "col", name: t.v };
    }
    throw new Error("无法解析的表达式片段：" + (t.v === undefined ? t.t : t.v));
  };
  ExprParser.prototype.parseCase = function () {
    const whens = []; let elseE = null;
    while (this.eatKw("WHEN")) {
      const w = this.parse();
      if (!this.eatKw("THEN")) throw new Error("CASE WHEN 缺少 THEN");
      whens.push({ when: w, then: this.parse() });
    }
    if (this.eatKw("ELSE")) elseE = this.parse();
    if (!this.eatKw("END")) throw new Error("CASE 缺少 END");
    return { k: "case", whens: whens, elseE: elseE };
  };

  function parseExpr(toks) { const p = new ExprParser(toks); const e = p.parse(); return e; }

  function containsAgg(node) {
    if (!node) return false;
    if (node.k === "func" && AGG.has(node.name)) return true;
    if (node.k === "bin") return containsAgg(node.l) || containsAgg(node.r);
    if (node.k === "un") return containsAgg(node.e);
    if (node.k === "case") return node.whens.some(w => containsAgg(w.when) || containsAgg(w.then)) || containsAgg(node.elseE);
    if (node.k === "func") return node.args.some(containsAgg);
    if (node.k === "isnull") return containsAgg(node.e);
    if (node.k === "like") return containsAgg(node.e) || containsAgg(node.pat);
    if (node.k === "in") return containsAgg(node.e) || (node.list || []).some(containsAgg);
    if (node.k === "between") return containsAgg(node.e) || containsAgg(node.lo) || containsAgg(node.hi);
    return false;
  }

  /* ------------------------------------------------------------
     五、取值 / 三值逻辑 / 比较
     ------------------------------------------------------------ */
  function resolveCol(row, name) {
    if (row && Object.prototype.hasOwnProperty.call(row, name)) return row[name];
    const hits = row ? Object.keys(row).filter(k => k.endsWith("." + name)) : [];
    if (hits.length === 1) return row[hits[0]];
    if (hits.length > 1) throw new Error("字段名歧义：`" + name + "` 在多张表里都有，请写成 表.字段 或 别名.字段");
    return undefined;
  }

  const isNull = v => v === null || v === undefined;
  function truth(v) {
    if (isNull(v)) return null;
    if (v === true) return true;
    if (v === false) return false;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") return v !== "";
    return true;
  }
  function triAnd(a, b) { if (a === false || b === false) return false; if (a === null || b === null) return null; return true; }
  function triOr(a, b) { if (a === true || b === true) return true; if (a === null || b === null) return null; return false; }

  function num(v) {
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
    return NaN;
  }
  function compare(op, a, b) {
    if (isNull(a) || isNull(b)) return null;
    let x = a, y = b;
    if (typeof x === "number" && typeof y === "string") y = num(y);
    if (typeof y === "number" && typeof x === "string") x = num(x);
    switch (op) {
      case "=": return x === y || (typeof x === "number" && typeof y === "number" && x === y);
      case "<>": case "!=": return !(x === y);
      case "<": return x < y;
      case "<=": return x <= y;
      case ">": return x > y;
      case ">=": return x >= y;
    }
    throw new Error("未知比较运算符 " + op);
  }
  function likeToRegExp(pat) {
    let s = String(pat).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(/%/g, ".*").replace(/_/g, ".");
    return new RegExp("^" + s + "$", "is");
  }

  /* ------------------------------------------------------------
     六、表达式求值
     ------------------------------------------------------------ */
  function evalExpr(node, row, group, ctx) {
    if (!node) return null;
    switch (node.k) {
      case "lit": return node.v;
      case "star": return null;
      case "col": {
        const v = resolveCol(row, node.name);
        if (v === undefined && ctx && ctx.outer) {
          const ov = resolveCol(ctx.outer, node.name);
          if (ov !== undefined) return ov;
        }
        if (v === undefined) throw new Error("找不到字段 `" + node.name + "`（检查表名/别名与列名拼写）");
        return v;
      }
      case "bin": {
        if (node.op === "AND") return triAnd(truth(evalExpr(node.l, row, group, ctx)), truth(evalExpr(node.r, row, group, ctx)));
        if (node.op === "OR") return triOr(truth(evalExpr(node.l, row, group, ctx)), truth(evalExpr(node.r, row, group, ctx)));
        const a = evalExpr(node.l, row, group, ctx), b = evalExpr(node.r, row, group, ctx);
        switch (node.op) {
          case "=": case "<>": case "!=": case "<": case "<=": case ">": case ">=": return compare(node.op, a, b);
          case "+": if (isNull(a) || isNull(b)) return null; return (typeof a === "string" || typeof b === "string") && isNaN(num(a) + num(b)) ? String(a) + String(b) : num(a) + num(b);
          case "-": if (isNull(a) || isNull(b)) return null; return num(a) - num(b);
          case "*": if (isNull(a) || isNull(b)) return null; return num(a) * num(b);
          case "/": if (isNull(a) || isNull(b)) return null; return num(b) === 0 ? null : num(a) / num(b);
          case "%": if (isNull(a) || isNull(b)) return null; return num(a) % num(b);
          case "||": if (isNull(a) || isNull(b)) return null; return String(a) + String(b);
        }
        throw new Error("未知运算符 " + node.op);
      }
      case "un": {
        if (node.op === "NOT") { const t = truth(evalExpr(node.e, row, group, ctx)); return t === null ? null : !t; }
        const v = evalExpr(node.e, row, group, ctx);
        return isNull(v) ? null : -num(v);
      }
      case "isnull": {
        const v = evalExpr(node.e, row, group, ctx);
        const r = isNull(v);
        return node.not ? !r : r;
      }
      case "like": {
        const v = evalExpr(node.e, row, group, ctx), p = evalExpr(node.pat, row, group, ctx);
        if (isNull(v) || isNull(p)) return null;
        const r = likeToRegExp(p).test(String(v));
        return node.not ? !r : r;
      }
      case "in": {
        const v = evalExpr(node.e, row, group, ctx);
        if (isNull(v)) return null;
        let list;
        if (node.sub) {
          const r = runTokens(node.sub, ctx.tables, row);
          list = r.rows.map(x => x[0]);
        } else {
          list = node.list.map(e => evalExpr(e, row, group, ctx));
        }
        let hit = false, hasNull = false;
        for (const x of list) { if (isNull(x)) { hasNull = true; continue; } if (compare("=", v, x) === true) { hit = true; break; } }
        if (hit) return node.not ? false : true;
        if (hasNull) return null;
        return node.not ? true : false;
      }
      case "between": {
        const v = evalExpr(node.e, row, group, ctx), lo = evalExpr(node.lo, row, group, ctx), hi = evalExpr(node.hi, row, group, ctx);
        if (isNull(v) || isNull(lo) || isNull(hi)) return null;
        const r = compare(">=", v, lo) === true && compare("<=", v, hi) === true;
        return node.not ? !r : r;
      }
      case "exists": {
        const r = runTokens(node.toks, ctx.tables, row);
        const has = r.rows.length > 0;
        return node.not ? !has : has;
      }
      case "sub": {
        const r = runTokens(node.toks, ctx.tables, row);
        if (r.rows.length === 0) return null;
        if (r.rows.length > 1) throw new Error("标量子查询返回了多行（用 IN / EXISTS 或加 LIMIT 1）");
        return r.rows[0][0];
      }
      case "case": {
        for (const w of node.whens) { if (truth(evalExpr(w.when, row, group, ctx)) === true) return evalExpr(w.then, row, group, ctx); }
        return node.elseE ? evalExpr(node.elseE, row, group, ctx) : null;
      }
      case "func": return evalFunc(node, row, group, ctx);
    }
    throw new Error("无法求值的表达式");
  }

  function evalFunc(node, row, group, ctx) {
    const N = node.name;
    const argRows = group || (row ? [row] : []);
    const argVals = () => node.args.map(a => evalExpr(a, row, group, ctx));
    if (AGG.has(N)) {
      if (!group) throw new Error("聚合函数 " + N + " 只能用在 SELECT / HAVING / ORDER BY 里（或与 GROUP BY 一起用）");
      const vals = [];
      if (node.args.length === 0 || (node.args[0] && node.args[0].k === "star")) {
        vals.push(...argRows.map(() => 1));
      } else {
        for (const r of argRows) vals.push(evalExpr(node.args[0], r, null, ctx));
      }
      let nonNull = vals.filter(v => !isNull(v));
      if (node.distinct) {
        const seen = new Set(); const out = [];
        for (const v of nonNull) { const k = JSON.stringify(v); if (!seen.has(k)) { seen.add(k); out.push(v); } }
        nonNull = out;
      }
      switch (N) {
        case "COUNT": return node.distinct || !(node.args.length === 0 || (node.args[0] && node.args[0].k === "star")) ? nonNull.length : argRows.length;
        case "SUM": return nonNull.length ? nonNull.reduce((a, b) => a + num(b), 0) : null;
        case "AVG": return nonNull.length ? nonNull.reduce((a, b) => a + num(b), 0) / nonNull.length : null;
        case "MIN": return nonNull.length ? nonNull.reduce((a, b) => (compare("<", b, a) === true ? b : a)) : null;
        case "MAX": return nonNull.length ? nonNull.reduce((a, b) => (compare(">", b, a) === true ? b : a)) : null;
        case "GROUP_CONCAT": return nonNull.length ? nonNull.join(",") : null;
      }
    }
    const args = argVals();
    const S = v => (isNull(v) ? null : String(v));
    switch (N) {
      case "UPPER": return S(args[0]) === null ? null : String(args[0]).toUpperCase();
      case "LOWER": return S(args[0]) === null ? null : String(args[0]).toLowerCase();
      case "LENGTH": case "CHAR_LENGTH": return S(args[0]) === null ? null : String(args[0]).length;
      case "CONCAT": return args.some(isNull) ? null : args.map(String).join("");
      case "SUBSTR": case "SUBSTRING": {
        if (S(args[0]) === null) return null;
        const s = String(args[0]); const start = num(args[1]);
        const len = args.length > 2 ? num(args[2]) : undefined;
        const i0 = start > 0 ? start - 1 : s.length + start;
        return len === undefined ? s.slice(i0) : s.substr(i0, len);
      }
      case "TRIM": return S(args[0]) === null ? null : String(args[0]).trim();
      case "REPLACE": return args.some(isNull) ? null : String(args[0]).split(String(args[1])).join(String(args[2]));
      case "LEFT": return S(args[0]) === null ? null : String(args[0]).slice(0, num(args[1]));
      case "RIGHT": return S(args[0]) === null ? null : String(args[0]).slice(-num(args[1]));
      case "INSTR": return S(args[0]) === null ? null : String(args[0]).indexOf(String(args[1])) + 1;
      case "ROUND": { if (S(args[0]) === null) return null; const d = args.length > 1 ? num(args[1]) : 0; const p = Math.pow(10, d); return Math.round(num(args[0]) * p) / p; }
      case "ABS": return S(args[0]) === null ? null : Math.abs(num(args[0]));
      case "CEIL": case "CEILING": return S(args[0]) === null ? null : Math.ceil(num(args[0]));
      case "FLOOR": return S(args[0]) === null ? null : Math.floor(num(args[0]));
      case "MOD": return S(args[0]) === null ? null : num(args[0]) % num(args[1]);
      case "COALESCE": { for (const a of args) if (!isNull(a)) return a; return null; }
      case "IFNULL": case "NVL": return isNull(args[0]) ? args[1] : args[0];
      case "NULLIF": return compare("=", args[0], args[1]) === true ? null : args[0];
      case "IF": return truth(args[0]) === true ? args[1] : args[2];
      case "GREATEST": return args.filter(v => !isNull(v)).reduce((a, b) => (compare(">", b, a) === true ? b : a), null);
      case "LEAST": return args.filter(v => !isNull(v)).reduce((a, b) => (compare("<", b, a) === true ? b : a), null);
      case "YEAR": return S(args[0]) === null ? null : parseInt(String(args[0]).slice(0, 4), 10);
      case "MONTH": return S(args[0]) === null ? null : parseInt(String(args[0]).slice(5, 7), 10);
      case "DAY": return S(args[0]) === null ? null : parseInt(String(args[0]).slice(8, 10), 10);
      case "DATE": return S(args[0]) === null ? null : String(args[0]).slice(0, 10);
      case "DATE_FORMAT": {
        if (S(args[0]) === null) return null;
        const d = new Date(String(args[0]).replace(" ", "T"));
        if (isNaN(d.getTime())) return String(args[0]);
        const p2 = n => String(n).padStart(2, "0");
        return String(args[1])
          .replace(/%Y/g, d.getFullYear())
          .replace(/%m/g, p2(d.getMonth() + 1))
          .replace(/%d/g, p2(d.getDate()))
          .replace(/%H/g, p2(d.getHours()))
          .replace(/%i/g, p2(d.getMinutes()))
          .replace(/%s/g, p2(d.getSeconds()));
      }
      case "DATEDIFF": {
        if (S(args[0]) === null || S(args[1]) === null) return null;
        return Math.round((new Date(String(args[0])) - new Date(String(args[1]))) / 86400000);
      }
      case "NOW": return new Date().toISOString().slice(0, 19).replace("T", " ");
      case "CAST": return args[0];
      default: throw new Error("沙箱暂不支持函数 " + N + "（可在详解页阅读其用法）");
    }
  }

  /* ------------------------------------------------------------
     七、FROM / JOIN
     ------------------------------------------------------------ */
  const JOINKW = new Set(["JOIN", "INNER", "LEFT", "RIGHT", "FULL", "CROSS", "OUTER"]);

  function parseTableRef(toks) {
    if (toks.length && toks[0].t === "op" && toks[0].v === "(") {
      const p = new ExprParser(toks); p.next();
      const inner = p.collectParen(); p.eatOp(")");
      let alias = null;
      if (p.peek() && p.peek().t === "id" && upOf(p.peek()) !== "AS") alias = p.next().v;
      else if (upOf(p.peek()) === "AS") { p.next(); alias = p.next().v; }
      return { sub: inner, alias: alias || "t" };
    }
    let name = null, alias = null;
    for (let i = 0; i < toks.length; i++) {
      const tk = toks[i];
      if (tk.t === "id" && upOf(tk) === "AS") { alias = toks[i + 1] ? toks[i + 1].v : null; break; }
      if (tk.t === "id" && !name) { name = tk.v; continue; }
      if (tk.t === "id" && name && !alias) { alias = tk.v; }
    }
    return { name: name, alias: alias };
  }

  function parseFromClause(tokens) {
    const out = [];
    let i = 0, refToks = [], nextJoin = null;
    const isJ = tk => tk && tk.t === "id" && JOINKW.has(tk.v.toUpperCase());
    const push = () => {
      if (!refToks.length) return;
      const t = parseTableRef(refToks);
      t.join = nextJoin;
      out.push(t);
      refToks = [];
    };
    while (i < tokens.length) {
      const tk = tokens[i];
      if (isJ(tk)) {
        push();
        const jt = [];
        while (i < tokens.length && isJ(tokens[i])) { jt.push(tokens[i].v.toUpperCase()); i++; }
        const parts = jt.filter(x => x !== "JOIN" && x !== "OUTER");
        nextJoin = parts.length ? parts[0] : (jt.includes("CROSS") ? "CROSS" : "INNER");
        continue;
      }
      if (tk.t === "id" && tk.v.toUpperCase() === "ON") {
        push();                       // 先把当前表推进结果，ON 属于这张表
        const onToks = []; let j = i + 1, depth = 0;
        while (j < tokens.length) {
          const t2 = tokens[j];
          if (t2.t === "op" && t2.v === "(") depth++;
          else if (t2.t === "op" && t2.v === ")") depth--;
          if (depth === 0 && t2.t === "id" && (JOINKW.has(t2.v.toUpperCase()) || ["ON", "USING"].indexOf(t2.v.toUpperCase()) >= 0)) break;
          onToks.push(t2); j++;
        }
        if (out.length) out[out.length - 1].on = onToks;
        i = j; continue;
      }
      if (tk.t === "id" && tk.v.toUpperCase() === "USING") {
        push();
        let j = i + 1; const cols = [];
        if (tokens[j] && tokens[j].v === "(") {
          j++;
          while (j < tokens.length && tokens[j].v !== ")") { if (tokens[j].t === "id") cols.push(tokens[j].v); j++; }
          j++;
        }
        if (out.length) out[out.length - 1].using = cols;
        i = j; continue;
      }
      refToks.push(tk); i++;
    }
    push();
    return out;
  }

  function tableData(name, tables) {
    const key = Object.keys(tables).find(k => k.toLowerCase() === String(name).toLowerCase());
    if (!key) throw new Error("未知的表 `" + name + "`（可用表：" + Object.keys(tables).join(", ") + "）");
    const def = tables[key];
    return def.rows.map(r => {
      const o = {};
      def.columns.forEach((c, idx) => { o[key + "." + c] = r[idx]; });
      return o;
    });
  }

  function evalFrom(fromToks, tables, outer) {
    if (!fromToks || !fromToks.length) return [{ __empty: true }];
    const refs = parseFromClause(fromToks);
    let rows = null;
    let joined = "";
    for (const ref of refs) {
      let right;
      if (ref.sub) {
        const r = runTokens(ref.sub, tables, outer);
        right = r.rows.map(row => {
          const o = {};
          r.columns.forEach((c, i) => { o[(ref.alias || "t") + "." + c] = row[i]; });
          return o;
        });
      } else {
        right = tableData(ref.name, tables);
        if (ref.alias) {
          right = right.map(o => {
            const n = {};
            Object.keys(o).forEach(k => { n[ref.alias + "." + k.split(".").slice(1).join(".")] = o[k]; });
            return n;
          });
        }
      }
      if (!rows) { rows = right; joined = ref.name || "子查询"; continue; }
      const jt = ref.join || "INNER";
      const onExpr = ref.on ? parseExpr(ref.on) : null;
      const out = [];
      const keysOf = set => { const o = {}; set.forEach(k => o[k] = null); return o; };
      const lKeys = new Set(); rows.forEach(o => Object.keys(o).forEach(k => lKeys.add(k)));
      const rKeys = new Set();
      right.forEach(o => Object.keys(o).forEach(k => rKeys.add(k)));
      if (ref.sub) { rKeys.add((ref.alias || "t") + ".__"); }
      else {
        const def = tables[Object.keys(tables).find(k => k.toLowerCase() === String(ref.name).toLowerCase())];
        if (def) def.columns.forEach(c => rKeys.add((ref.alias || ref.name) + "." + c));
      }
      const matchOn = (l, r) => {
        if (ref.using && ref.using.length) {
          return ref.using.every(c => compare("=", resolveCol(l, c), resolveCol(r, c)) === true);
        }
        if (!onExpr) return true;
        return truth(evalExpr(onExpr, Object.assign({}, l, r), null, { tables: tables, outer: outer })) === true;
      };
      if (jt === "CROSS") {
        for (const l of rows) for (const r of right) out.push(Object.assign({}, l, r));
      } else if (jt === "RIGHT") {
        for (const r of right) {
          let hit = false;
          for (const l of rows) if (matchOn(l, r)) { out.push(Object.assign({}, l, r)); hit = true; }
          if (!hit) out.push(Object.assign(keysOf(lKeys), r));
        }
      } else if (jt === "FULL") {
        const rMatched = new Set();
        for (const l of rows) {
          let hit = false;
          right.forEach((r, idx) => { if (matchOn(l, r)) { out.push(Object.assign({}, l, r)); hit = true; rMatched.add(idx); } });
          if (!hit) out.push(Object.assign(keysOf(rKeys), l));
        }
        right.forEach((r, idx) => { if (!rMatched.has(idx)) out.push(Object.assign(keysOf(lKeys), r)); });
      } else {
        for (const l of rows) {
          let hit = false;
          for (const r of right) if (matchOn(l, r)) { out.push(Object.assign({}, l, r)); hit = true; }
          if (!hit && jt === "LEFT") out.push(Object.assign(keysOf(rKeys), l));
        }
      }
      rows = out;
      joined += " " + jt + " JOIN " + (ref.name || "子查询");
    }
    return rows || [];
  }

  /* ------------------------------------------------------------
     八、主执行流程
     ------------------------------------------------------------ */
  function parseSelectList(toks) {
    return splitTop(toks, ",").map(part => {
      let alias = null;
      let body = part;
      for (let i = 0; i < part.length; i++) {
        if (part[i].t === "id" && part[i].v.toUpperCase() === "AS") {
          alias = part[i + 1] ? (part[i + 1].t === "id" || part[i + 1].t === "str" ? part[i + 1].v : null) : null;
          body = part.slice(0, i); break;
        }
      }
      if (!alias && body.length >= 2) {
        const last = body[body.length - 1];
        const prev = body[body.length - 2];
        const lastOk = last.t === "id" && !KW.has(last.v.toUpperCase());
        const prevOk = !(prev.t === "op" && [".", "+", "-", "*", "/", "%", "(", ",", "=", "<", ">", "<=", ">=", "<>", "!="].indexOf(prev.v) >= 0);
        if (lastOk && prevOk) { alias = last.v; body = body.slice(0, -1); }
      }
      const expr = parseExpr(body);
      const text = body.map(t => t.t === "str" ? "'" + t.v + "'" : t.v).join(" ").replace(/\s*\.\s*/g, ".").replace(/\s*,\s*/g, ", ");
      return { expr: expr, alias: alias, text: text };
    });
  }

  function runTokens(tokens, tables, outer) {
    const cl = findClauses(tokens);
    if (!cl.select) throw new Error("子查询必须以 SELECT 开头");
    const plan = [];
    let rows = evalFrom(cl.from, tables, outer);
    plan.push({ step: "FROM", detail: (cl.from ? cl.from.map(t => t.v).join(" ") : "—"), rows: rows.length });
    if (cl.where) {
      const w = parseExpr(cl.where);
      rows = rows.filter(r => truth(evalExpr(w, r, null, { tables: tables, outer: outer })) === true);
      plan.push({ step: "WHERE", detail: cl.where.map(t => t.v).join(" "), rows: rows.length });
    }
    const sel = parseSelectList(cl.select);
    const star = sel.length === 1 && sel[0].expr.k === "star" && !sel[0].alias;
    // MySQL 允许 GROUP BY / HAVING 引用 SELECT 的列别名，这里做一次替换
    const aliasMap = {};
    sel.forEach(it => { if (it.alias) aliasMap[it.alias.toLowerCase()] = it.expr; });
    const resolveAlias = e => {
      if (!e) return e;
      if (e.k === "col" && aliasMap[e.name.toLowerCase()]) return aliasMap[e.name.toLowerCase()];
      if (e.k === "bin") return { k: "bin", op: e.op, l: resolveAlias(e.l), r: resolveAlias(e.r) };
      if (e.k === "un") return { k: "un", op: e.op, e: resolveAlias(e.e) };
      if (e.k === "func") return { k: "func", name: e.name, args: e.args.map(resolveAlias), distinct: e.distinct };
      if (e.k === "isnull") return { k: "isnull", e: resolveAlias(e.e), not: e.not };
      if (e.k === "case") return { k: "case", whens: e.whens.map(w => ({ when: resolveAlias(w.when), then: resolveAlias(w.then) })), elseE: resolveAlias(e.elseE) };
      return e;
    };
    const havingExpr = cl.having ? resolveAlias(parseExpr(cl.having)) : null;
    const orderItems = cl.order ? splitTop(cl.order, ",").map(part => {
      let desc = false, body = part.slice();
      if (body.length && body[body.length - 1].t === "id" && body[body.length - 1].v.toUpperCase() === "DESC") { desc = true; body.pop(); }
      else if (body.length && body[body.length - 1].t === "id" && body[body.length - 1].v.toUpperCase() === "ASC") { body.pop(); }
      return { expr: parseExpr(body), desc: desc, text: body.map(t => t.v).join("") };
    }) : [];
    const groupExprs = cl.group ? splitTop(cl.group, ",").map(parseExpr).map(resolveAlias) : null;
    const anyAgg = sel.some(it => containsAgg(it.expr)) || containsAgg(havingExpr) || orderItems.some(o => containsAgg(o.expr));
    const useGroup = !!(groupExprs || anyAgg);

    let groups;
    if (useGroup) {
      const map = new Map();
      const keyOf = r => JSON.stringify((groupExprs || []).map(e => evalExpr(e, r, null, { tables: tables, outer: outer })));
      if (groupExprs) {
        for (const r of rows) { const k = keyOf(r); if (!map.has(k)) map.set(k, { rows: [], first: r }); map.get(k).rows.push(r); }
      } else {
        map.set("__all__", { rows: rows, first: rows[0] || {} });
      }
      groups = [...map.values()];
      if (groupExprs) plan.push({ step: "GROUP BY", detail: cl.group.map(t => t.v).join(" "), rows: groups.length, note: "组数" });
      else plan.push({ step: "聚合", detail: "整表聚合为 1 组", rows: groups.length, note: "组数" });
      if (havingExpr) {
        groups = groups.filter(g => truth(evalExpr(havingExpr, g.first, g.rows, { tables: tables, outer: outer })) === true);
        plan.push({ step: "HAVING", detail: cl.having.map(t => t.v).join(" "), rows: groups.length, note: "组数" });
      }
    } else {
      groups = rows.map(r => ({ rows: [r], first: r }));
    }

    let columns, pairs;
    if (star) {
      const keys = [];
      for (const r of rows) for (const k of Object.keys(r)) if (keys.indexOf(k) < 0) keys.push(k);
      columns = keys;
      pairs = groups.map(g => ({ g: g, r: keys.map(k => g.first[k]) }));
    } else {
      columns = sel.map(it => it.alias || it.text);
      pairs = groups.map(g => ({ g: g, r: sel.map(it => evalExpr(it.expr, g.first, g.rows, { tables: tables, outer: outer })) }));
    }
    plan.push({ step: "SELECT", detail: columns.join(", "), rows: pairs.length });

    if (cl.distinct) {
      const seen = new Set(); const out = [];
      for (const p of pairs) { const k = JSON.stringify(p.r); if (!seen.has(k)) { seen.add(k); out.push(p); } }
      pairs = out;
      plan.push({ step: "DISTINCT", detail: "去重", rows: pairs.length });
    }

    if (orderItems.length) {
      const idxOf = t => columns.findIndex(c => c.toLowerCase() === String(t).toLowerCase());
      const dec = orderItems.map(o => {
        if (o.expr.k === "lit" && typeof o.expr.v === "number") return { idx: o.expr.v - 1, desc: o.desc };
        if (o.expr.k === "col") {
          const i = idxOf(o.expr.name);
          if (i >= 0) return { idx: i, desc: o.desc };
        }
        return { expr: o.expr, desc: o.desc };
      });
      pairs.sort((A, B) => {
        for (const d of dec) {
          let va, vb;
          if (d.idx !== undefined) { va = A.r[d.idx]; vb = B.r[d.idx]; }
          else { va = evalExpr(d.expr, A.g.first, A.g.rows, { tables: tables, outer: outer }); vb = evalExpr(d.expr, B.g.first, B.g.rows, { tables: tables, outer: outer }); }
          let c;
          if (isNull(va) && isNull(vb)) c = 0;
          else if (isNull(va)) c = -1;
          else if (isNull(vb)) c = 1;
          else c = compare("<", va, vb) === true ? -1 : (compare(">", va, vb) === true ? 1 : 0);
          if (c !== 0) return d.desc ? -c : c;
        }
        return 0;
      });
      plan.push({ step: "ORDER BY", detail: cl.order.map(t => t.v).join(" "), rows: pairs.length });
    }

    let outRows = pairs.map(p => p.r);
    if (cl.limit) {
      const nums = cl.limit.filter(t => t.t === "num").map(t => t.v);
      const hasOffset = cl.limit.some(t => t.t === "id" && t.v.toUpperCase() === "OFFSET");
      let limit = nums[0], offset = 0;
      if (nums.length >= 2) { if (hasOffset) { limit = nums[0]; offset = nums[1]; } else { offset = nums[0]; limit = nums[1]; } }
      outRows = outRows.slice(offset, offset + (limit === undefined ? outRows.length : limit));
      plan.push({ step: "LIMIT", detail: cl.limit.map(t => t.v).join(" "), rows: outRows.length });
    }
    return { columns: columns, rows: outRows, plan: plan };
  }

  function buildTables(extra) {
    const t = {};
    Object.keys(SAMPLE).forEach(k => t[k] = SAMPLE[k]);
    if (extra) Object.keys(extra).forEach(k => t[k] = extra[k]);
    return t;
  }

  function run(sql, tables) {
    try {
      const r = runTokens(tokenize(sql), buildTables(tables), null);
      return { columns: r.columns, rows: r.rows, plan: r.plan, error: null };
    } catch (e) {
      return { columns: [], rows: [], plan: [], error: e.message || String(e) };
    }
  }

  /* ------------------------------------------------------------
     九、交互面板：样式（自动注入，保证各页外观一致）
     ------------------------------------------------------------ */
  const CSS = `
  .sqlpanel{border:1px solid #d3c9b0;border-radius:14px;background:#fdfbf5;box-shadow:0 1px 2px rgba(35,31,24,.04),0 12px 32px -20px rgba(35,31,24,.4);margin:16px 0;overflow:hidden;font-family:"PingFang SC","Microsoft YaHei",-apple-system,sans-serif}
  .sqlpanel .sp-head{display:flex;align-items:center;gap:10px;padding:11px 16px;background:#e8f0f6;border-bottom:1px solid #cfe0dc}
  .sqlpanel .sp-title{font-weight:800;font-size:14.5px;color:#3a6b8f}
  .sqlpanel .sp-hint{margin-left:auto;font-size:12px;color:#857c6b;font-family:"JetBrains Mono",Consolas,monospace}
  .sqlpanel .sp-presets{display:flex;flex-wrap:wrap;gap:7px;padding:12px 16px 0}
  .sqlpanel .sp-presets button{cursor:pointer;border:1px solid #d3c9b0;background:#fff;color:#514b3f;font-size:12.5px;padding:5px 12px;border-radius:999px;transition:.14s;font-family:inherit}
  .sqlpanel .sp-presets button:hover{border-color:#1e5b4f;color:#1e5b4f;background:#e4efeb}
  .sqlpanel .sp-editor{display:block;width:calc(100% - 32px);margin:12px 16px 0;min-height:96px;padding:12px 14px;border:1px solid #d3c9b0;border-radius:10px;background:#1f2318;color:#e9e5d6;font-family:"JetBrains Mono",Consolas,monospace;font-size:13px;line-height:1.7;resize:vertical;outline:none;tab-size:2}
  .sqlpanel .sp-editor:focus{border-color:#1e5b4f;box-shadow:0 0 0 3px #e4efeb}
  .sqlpanel .sp-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 16px}
  .sqlpanel .sp-actions button{cursor:pointer;border:1px solid #1e5b4f;background:#1e5b4f;color:#fff;font-size:13.5px;font-weight:700;padding:8px 18px;border-radius:999px;font-family:inherit;transition:.14s}
  .sqlpanel .sp-actions button.ghost{background:#fff;color:#514b3f;border-color:#d3c9b0;font-weight:400}
  .sqlpanel .sp-actions button.ghost:hover{border-color:#1e5b4f;color:#1e5b4f}
  .sqlpanel .sp-actions button:hover{filter:brightness(1.06)}
  .sqlpanel .sp-msg{font-size:12.5px;font-family:"JetBrains Mono",Consolas,monospace;color:#857c6b}
  .sqlpanel .sp-msg.ok{color:#1e5b4f}
  .sqlpanel .sp-msg.bad{color:#b8392a}
  .sqlpanel .sp-plan{display:none;margin:0 16px 10px;padding:10px 12px;border:1px dashed #d3c9b0;border-radius:10px;background:#f5f1e8;font-size:12.5px;font-family:"JetBrains Mono",Consolas,monospace;color:#514b3f}
  .sqlpanel .sp-plan.on{display:block}
  .sqlpanel .sp-plan .pl-row{display:flex;gap:8px;align-items:baseline;padding:2px 0}
  .sqlpanel .sp-plan .pl-step{flex:none;width:86px;color:#b7791f;font-weight:700}
  .sqlpanel .sp-plan .pl-n{color:#1e5b4f;font-weight:700}
  .sqlpanel .sp-result{margin:0 16px 14px;overflow-x:auto}
  .sqlpanel .sp-result table{border-collapse:collapse;width:100%;font-size:13px;font-family:"JetBrains Mono",Consolas,monospace;background:#fff;border-radius:10px;overflow:hidden}
  .sqlpanel .sp-result th,.sqlpanel .sp-result td{padding:7px 11px;text-align:left;border-bottom:1px solid #e3dcc9;white-space:nowrap}
  .sqlpanel .sp-result th{background:#e4efeb;color:#1e5b4f;font-weight:700;position:sticky;top:0}
  .sqlpanel .sp-result tr:nth-child(even) td{background:#faf8f2}
  .sqlpanel .sp-result td.null{color:#b8392a;font-style:italic}
  .sqlpanel .sp-result .sp-empty{font-size:13px;color:#857c6b;padding:6px 0;font-family:inherit}
  .sqlpanel .sp-schema{margin:0 16px 16px;font-size:13px}
  .sqlpanel .sp-schema summary{cursor:pointer;color:#3a6b8f;font-size:12.5px;font-family:"JetBrains Mono",Consolas,monospace;outline:none}
  .sqlpanel .sp-schema .tabs{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
  .sqlpanel .sp-schema .tabs button{cursor:pointer;border:1px solid #d3c9b0;background:#fff;font-size:12px;padding:4px 10px;border-radius:999px;font-family:"JetBrains Mono",Consolas,monospace;color:#514b3f}
  .sqlpanel .sp-schema .tabs button.on{background:#1e5b4f;border-color:#1e5b4f;color:#fff}
  .sqlpanel .sp-schema .cols{margin-top:10px;font-size:12.5px;color:#514b3f;font-family:"JetBrains Mono",Consolas,monospace;line-height:1.9}
  .sqlpanel .sp-schema .cols code{background:#e4efeb;border-radius:5px;padding:1px 6px;color:#1e5b4f}
  `;
  function injectStyle() {
    if (global.document && !global.document.getElementById("sql-sandbox-style")) {
      const s = global.document.createElement("style");
      s.id = "sql-sandbox-style";
      s.textContent = CSS;
      global.document.head.appendChild(s);
    }
  }

  /* ------------------------------------------------------------
     十、交互面板：渲染
     ------------------------------------------------------------ */
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  function renderTable(columns, rows) {
    if (!rows.length) return '<div class="sp-empty">（查询结果为空：0 行）</div>';
    const head = columns.map(c => "<th>" + esc(c) + "</th>").join("");
    const body = rows.map(r => "<tr>" + r.map(v => v === null || v === undefined ? '<td class="null">NULL</td>' : "<td>" + esc(typeof v === "number" ? (Number.isInteger(v) ? v : Math.round(v * 100) / 100) : v) + "</td>").join("") + "</tr>").join("");
    return "<table><thead><tr>" + head + "</tr></thead><tbody>" + body + "</tbody></table>";
  }

  function mount(el, opts) {
    opts = opts || {};
    const node = typeof el === "string" ? global.document.querySelector(el) : el;
    if (!node) return null;
    injectStyle();
    const tables = opts.tables || null;
    const presets = opts.presets || [];
    const initial = opts.query || "SELECT * FROM customers;";

    const box = global.document.createElement("div");
    box.className = "sqlpanel";
    box.innerHTML =
      '<div class="sp-head"><span class="sp-title">🖥 SQL 练习台</span><span class="sp-hint">改一改 → 点「运行查询」</span></div>' +
      (presets.length ? '<div class="sp-presets"></div>' : "") +
      '<textarea class="sp-editor" spellcheck="false"></textarea>' +
      '<div class="sp-actions"><button class="sp-run">▶ 运行查询</button><button class="ghost sp-reset">↺ 重置</button><span class="sp-msg"></span></div>' +
      '<div class="sp-plan"></div>' +
      '<div class="sp-result"></div>' +
      '<details class="sp-schema"><summary>📚 查看示例数据表结构（点击展开）</summary><div class="tabs"></div><div class="cols"></div></details>';
    node.appendChild(box);

    const ed = box.querySelector(".sp-editor");
    const msg = box.querySelector(".sp-msg");
    const res = box.querySelector(".sp-result");
    const planBox = box.querySelector(".sp-plan");
    ed.value = initial;

    if (presets.length) {
      const pw = box.querySelector(".sp-presets");
      presets.forEach(p => {
        const b = global.document.createElement("button");
        b.textContent = p.label;
        b.addEventListener("click", () => { ed.value = p.sql; exec(); });
        pw.appendChild(b);
      });
    }

    const schemaTabs = box.querySelector(".sp-schema .tabs");
    const schemaCols = box.querySelector(".sp-schema .cols");
    const allTables = buildTables(tables);
    Object.keys(allTables).forEach((name, idx) => {
      const b = global.document.createElement("button");
      b.textContent = name;
      b.addEventListener("click", () => {
        schemaTabs.querySelectorAll("button").forEach(x => x.classList.remove("on"));
        b.classList.add("on");
        schemaCols.innerHTML = "<b>" + esc(name) + "</b> (" + allTables[name].columns.map(c => "<code>" + esc(c) + "</code>").join(", ") + ") &nbsp;·&nbsp; " + allTables[name].rows.length + " 行";
      });
      schemaTabs.appendChild(b);
      if (idx === 0) b.click();
    });

    function exec() {
      const r = run(ed.value, tables);
      if (r.error) {
        msg.className = "sp-msg bad";
        msg.textContent = "✗ " + r.error;
        res.innerHTML = '<div class="sp-empty">' + esc(r.error) + "</div>";
        planBox.classList.remove("on");
        return;
      }
      msg.className = "sp-msg ok";
      msg.textContent = "✓ 返回 " + r.rows.length + " 行";
      res.innerHTML = renderTable(r.columns, r.rows);
      if (r.plan && r.plan.length) {
        planBox.classList.add("on");
        planBox.innerHTML = r.plan.map(p =>
          '<div class="pl-row"><span class="pl-step">' + esc(p.step) + '</span><span>' + esc(p.detail) + '</span><span class="pl-n">' + p.rows + (p.note ? " " + p.note : " 行") + "</span></div>"
        ).join("");
      } else {
        planBox.classList.remove("on");
      }
    }

    box.querySelector(".sp-run").addEventListener("click", exec);
    box.querySelector(".sp-reset").addEventListener("click", () => { ed.value = initial; exec(); });
    ed.addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exec(); } });
    exec();
    return { exec: exec, box: box, editor: ed };
  }

  global.SQLSandbox = {
    SAMPLE: SAMPLE,
    run: run,
    mount: mount,
    renderTable: renderTable,
    esc: esc,
    injectStyle: injectStyle
  };
})(typeof window !== "undefined" ? window : globalThis);
