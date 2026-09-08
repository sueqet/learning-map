# SQL / 数据库 学习区

> **SQL** 是跟数据库「说话」的语言：查数据、改数据、建表、调优都靠它。**后端、数据、算法、测试、运维**几乎每个方向都要用，学习成本低、覆盖极广——属于「学了立刻能用在工作和面试里」的高性价比技能。
>
> 本学习包以 **MySQL 8.0** 为准，示例数据统一为电商场景（`customers` / `orders` / `order_items` / `products` / `employees`），从「会用」到「用好」再到「面试与实战」。

## 主入口：交互式学习大纲

用浏览器打开 **`index.html`** 开始学习：

- **17 个模块 / 113 个知识点**，分「基础篇 → 进阶篇 → 实战篇」三阶段循序渐进。
- **可打勾记录进度**：学会一个勾一个，进度保存在本机浏览器（localStorage），刷新不丢。
- **可跳转**：点知识点标题或「去学习 →」，进入对应的**详解网页**并自动定位到该知识点。
- 在大纲或任意详解页勾选「已学会」，**进度双向同步**（共用同一个 localStorage 键）。
- **可搜索 / 可筛选**：按阶段筛选，或直接搜「窗口函数」「索引失效」等关键词。

## 目录结构

```
SQL/
├── index.html                     ← 学习大纲（主入口，交互式）
├── README.md
└── content/
    ├── _skeleton.html             （详解页骨架：直接复制，含全部必需结构与引擎 JS）
    ├── _template.html             （同上，保留此名与其它学习包一致）
    ├── _GUIDE.md                  （撰写规范）
    ├── _patterns.md               （交互演示面板的 4 种可复制模式）
    ├── _modules.md                （各模块 id / 文件名 / prev / next 一览）
    ├── assets/learn.css           （共享设计系统，注入到每个页面）
    ├── assets/sql-sandbox.js      （迷你 SQL 引擎 + 交互查询练习台）
    ├── _validate.js               （校验：锚点/进度键/题目/演示 SQL/JS 语法）
    ├── _smoke.js                  （DOM 冒烟测试：执行页面脚本 + 模拟点击/切换/答题）
    ├── _inject-style.js           （把 learn.css 同步进所有详解页）
    ├── _summary.js                （统计各页知识点/面板/题数）
    ├── _facts.md                  （示例数据的「标准答案」速查：行数/金额/占比）
    ├── _facts.js                  （生成 _facts.md 用的实跑脚本）
    ├── _selftest-engine.js        （迷你 SQL 引擎自测，27 条用例）
    ├── 01-db-sql-overview.html    （数据库与 SQL 全景）
    ├── 02-basic-select.html       （单表查询基础）
    ├── 03-aggregate-group.html    （聚合、分组与过滤）
    ├── 04-joins.html              （多表连接）
    ├── 05-subquery-set.html       （子查询与集合运算）
    ├── 06-window-functions.html   （窗口函数）
    ├── 07-dml-transaction.html    （数据修改、事务与并发）
    ├── 08-schema-design.html      （表设计、约束与范式）
    ├── 09-index-explain.html      （索引原理与执行计划）
    ├── 10-query-tuning.html       （查询优化与慢 SQL）
    ├── 11-storage-locks.html      （存储引擎、锁与 MVCC）
    ├── 12-data-modeling.html      （数据建模与数仓）
    ├── 13-advanced-sql.html       （高级函数与特性）
    ├── 14-ops-security.html       （运维、安全与分布式）
    ├── 15-interview-patterns.html （面试高频 SQL 题型）
    ├── 16-analytics-practice.html （数据分析实战）
    └── 17-capstone-project.html   （综合项目实战）
```

## 每个详解网页包含

- **本节学习目标**：可验证的「学完后你能…」，3–6 条。
- **学习内容**：概念讲解 + 可运行 SQL 示例 + 结果对照表 + 易错点提示 + Mermaid / SVG 图解。
- **🖥 交互演示面板**：本学习包的特色，动手改一改就能看到结果变化（见下）。
- **本节考核 · 自我检测**：8–12 道选择题，提交后自动判分并给出解析，含「面试延伸」题。
- **进阶挑战**：需要动手或思考的延伸任务。
- **「我已掌握本节」**：一键标记全部知识点，与大纲进度同步。

## 交互演示面板（重点）

### 1. SQL 练习台（真实可跑）

`content/assets/sql-sandbox.js` 是一个纯前端迷你 SQL 引擎，页面里可以直接**改 SQL → 点运行 → 看结果表和执行步骤**：

- 支持：`SELECT [DISTINCT]`、多表 `INNER/LEFT/RIGHT/FULL/CROSS JOIN … ON/USING`、派生表、`WHERE`、`GROUP BY`、`HAVING`、`ORDER BY`、`LIMIT n [OFFSET m]`、`IN/EXISTS`、`LIKE`、`BETWEEN`、`IS [NOT] NULL`、`CASE WHEN`、聚合（含 `COUNT(DISTINCT …)`）、常用字符串/日期/数值函数。
- 不支持：`UNION`、`INSERT/UPDATE/DELETE`、窗口函数 `OVER()`、`WITH` —— 这些主题改用「手算演示面板」讲，语法照样在代码块里给出。
- 面板还会显示每一步的**行数变化**（FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT），帮助建立执行顺序直觉。

### 2. 主题演示面板（每个模块一套）

| 模块 | 演示 |
| --- | --- |
| 01 | 关系模型点选、SQL 语句分类 |
| 02 | 逻辑执行顺序分步器、NULL 三值逻辑真值表 |
| 03 | 分组桶演示、WHERE vs HAVING 分步 |
| 04 | JOIN 可视化（切换连接类型看行怎么配 + Venn 图） |
| 05 | 子查询执行分步、集合运算对比 |
| 06 | 排名函数对比、窗口帧滑动演示 |
| 07 | 隔离级别并发时间线、DELETE/TRUNCATE/DROP 对比 |
| 08 | 范式规范化检查器、约束演示、ER 关系切换 |
| 09 | B+ 树查找动画、索引 vs 全表扫描、EXPLAIN 解读 |
| 10 | 慢 SQL 优化前后对比、JOIN 算法演示 |
| 11 | 锁等待 / 死锁时间线、MVCC 版本链 |
| 12 | 星型 vs 雪花模型、数仓分层 |
| 13 | 函数实验室、行列转换、递归 CTE |
| 14 | SQL 注入演示（拼接 vs 参数化） |
| 15 | 题目演算器（数据 → 逐步解法） |
| 16 | 漏斗 / 留存 / RFM 计算器 |
| 17 | 项目 ER 图与查询清单 |

## 如何维护

- 新增/修改知识点：改 `index.html` 的 `MODULES` 数组，再复制 `content/_template.html` 创建对应 `NN-slug.html`（细则见 `content/_GUIDE.md`）。
- 详解页只改 `<script>` 里的 `CONFIG` 与 `QUZ` 以及正文；**不要改动 `<style>` 块、进度同步逻辑与答题引擎**，保证全站一致。
- 校验：`node content/_validate.js`（检查大纲 ↔ 详解页的锚点、进度键、题目数量、演示 SQL 是否可执行）。

## 学习建议

按「基础 → 进阶 → 实战」推进：

1. **基础篇（01–08）**：先装一个 MySQL（或直接用练习台），把查询、聚合、连接、子查询、窗口函数、增删改事务、建表范式这七块练熟。每学完一个模块，用练习台把示例 SQL 改三遍。
2. **进阶篇（09–14）**：重点啃索引与执行计划——遇到任何查询都问一句「它走索引了吗」。再用 `EXPLAIN` 在真实库上验证。
3. **实战篇（15–17）**：把面试高频题型（TopN、连续 N 天、去重取最新）手写一遍；再用 SQL 做一遍漏斗、留存、RFM；最后走一遍完整的项目流程。

> 与网页配套：`D:\DSH\Project\User\职业规划网页.html` 的「高性价比技能推荐」中，SQL / 数据库 卡片已接入本学习地图。
