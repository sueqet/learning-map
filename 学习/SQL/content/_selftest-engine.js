// 临时测试：验证 sql-sandbox.js 引擎
require("D:/DSH/Project/User/学习/SQL/content/assets/sql-sandbox.js");
const S = globalThis.SQLSandbox;
const tests = [
  ["SELECT * FROM customers;", 8],
  ["SELECT name, city FROM customers WHERE city = '北京';", 2],
  ["SELECT name FROM customers WHERE city IS NULL;", 1],
  ["SELECT COUNT(*) AS cnt, AVG(amount) AS avg_amt FROM orders WHERE status='paid';", 1],
  ["SELECT city, COUNT(*) c, SUM(amount) s FROM customers c JOIN orders o ON c.id=o.customer_id GROUP BY city ORDER BY s DESC;", 5],
  ["SELECT c.name, o.id FROM customers c LEFT JOIN orders o ON c.id=o.customer_id ORDER BY c.id;", 13],
  ["SELECT c.name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id=c.id);", 1],
  ["SELECT c.city, COUNT(*) n FROM customers c GROUP BY city HAVING COUNT(*) >= 2 ORDER BY n DESC, city;", 2],
  ["SELECT * FROM (SELECT id, name FROM customers) t WHERE t.id <= 3;", 3],
  ["SELECT name, CASE WHEN amount >= 1000 THEN '大额' ELSE '普通' END AS lv FROM orders o JOIN customers c ON c.id=o.customer_id ORDER BY amount DESC LIMIT 3;", 3],
  ["SELECT DISTINCT city FROM customers ORDER BY city;", 6],
  ["SELECT p.category, SUM(oi.qty) q FROM order_items oi JOIN products p ON oi.product_id=p.id GROUP BY p.category ORDER BY q DESC;", 3],
  ["SELECT name FROM customers WHERE name LIKE '张%';", 1],
  ["SELECT COUNT(DISTINCT customer_id) FROM orders;", 1],
  ["SELECT id, amount FROM orders WHERE amount BETWEEN 100 AND 500 ORDER BY amount;", 4],
  ["SELECT e.name, m.name AS mgr FROM employees e LEFT JOIN employees m ON e.manager_id = m.id ORDER BY e.id;", 9],
  ["SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 2 OFFSET 1;", 2],
  ["SELECT c.name, o.amount FROM customers c RIGHT JOIN orders o ON c.id=o.customer_id ORDER BY o.id;", 12],
  ["SELECT city, COUNT(*) FROM customers GROUP BY city ORDER BY 2 DESC, 1;", 6],
  ["SELECT * FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE city='北京');", 3],
  ["SELECT UPPER(name) u, LENGTH(name) l, DATE_FORMAT(signup_date,'%Y-%m') ym FROM customers WHERE id=1;", 1],
  ["SELECT dept, SUM(salary) total FROM employees GROUP BY dept HAVING SUM(salary) > 60000 ORDER BY total DESC;", 2],
  ["SELECT 1+2*3 AS x, 'a' || 'b' AS y;", 1],
  ["SELECT * FROM customers c CROSS JOIN products p LIMIT 5;", 5],
];
let fail = 0;
for (const [sql, want] of tests) {
  const r = S.run(sql);
  const ok = !r.error && r.rows.length === want;
  if (!ok) { fail++; console.log("FAIL:", sql, "\n  error=", r.error, " got=", r.rows.length, " want=", want, "\n  rows=", JSON.stringify(r.rows).slice(0, 300)); }
  else console.log("ok  ", String(r.rows.length).padStart(3), sql.slice(0, 70));
}
// 错误处理
for (const bad of ["SELECT nope FROM customers;", "DELETE FROM customers;", "SELECT * FROM nope;"]) {
  const r = S.run(bad);
  console.log(r.error ? "ok-err " : "FAIL-err ", bad, "=>", r.error);
}
console.log(fail ? "\n❌ " + fail + " 个用例失败" : "\n✅ 全部用例通过");
