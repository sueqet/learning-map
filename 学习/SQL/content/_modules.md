# 各模块规格（moduleId / 文件 / 知识点 id）

> 大纲数据的权威来源是 index.html 的 MODULES 数组；本文件是同一份数据的副本，便于单独查看。

> `diff`：1 初学 / 2 进阶 / 3 难点。**必须**在页面里完整覆盖这些 id。

### 01 `overview` · `01-db-sql-overview.html` · MODULE 01 · 数据库与 SQL 全景
prev: `` · next: `02-basic-select.html`
- `db-concept` 数据库、DBMS 与关系模型
- `sql-family` SQL 语言分类（DDL/DML/DQL/DCL/TCL）
- `env-setup` 环境搭建：MySQL 安装、连接与客户端
- `table-model` 表、行、列：主键与外键
- `data-types` 常用数据类型与选型
- `first-sql` 第一条 SQL：建库建表与插入数据

### 02 `select` · `02-basic-select.html` · MODULE 02 · 单表查询基础
prev: `01-db-sql-overview.html` · next: `03-aggregate-group.html`
- `select-basic` SELECT / FROM / 列别名 / 常量列
- `where-basic` WHERE 与比较、逻辑运算符
- `where-special` BETWEEN / IN / LIKE / IS NULL
- `order-limit` ORDER BY 排序与 LIMIT 分页
- `distinct` DISTINCT 去重与常见坑
- `null-logic` NULL 与三值逻辑
- `exec-order` SELECT 的逻辑执行顺序

### 03 `aggregate` · `03-aggregate-group.html` · MODULE 03 · 聚合、分组与过滤
prev: `02-basic-select.html` · next: `04-joins.html`
- `agg-func` 聚合函数 COUNT / SUM / AVG / MAX / MIN
- `group-by` GROUP BY 分组语义
- `having` HAVING 与 WHERE 的区别
- `group-pitfall` 分组常见陷阱（非聚合列）
- `count-distinct` 去重计数与多列分组
- `group-ext` GROUP BY 扩展（ROLLUP / 过滤分组）

### 04 `joins` · `04-joins.html` · MODULE 04 · 多表连接
prev: `03-aggregate-group.html` · next: `05-subquery-set.html`
- `join-basic` 连接的本质与笛卡尔积
- `inner-join` INNER JOIN 与 ON / USING
- `outer-join` LEFT / RIGHT / FULL OUTER JOIN
- `self-join` 自连接（同一张表多次使用）
- `cross-join` CROSS JOIN 与生成序列
- `multi-join` 多表连接与连接顺序
- `semi-anti` 半连接 / 反连接（EXISTS 与 JOIN 互换）

### 05 `subquery` · `05-subquery-set.html` · MODULE 05 · 子查询与集合运算
prev: `04-joins.html` · next: `06-window-functions.html`
- `sub-scalar` 标量、列、行、表子查询
- `sub-in-exists` IN / EXISTS / ANY / ALL 的语义差异
- `sub-correlated` 相关子查询与执行方式
- `sub-derived` 派生表与 FROM 子查询
- `cte` CTE（WITH）与可读性重构
- `set-ops` UNION / UNION ALL / INTERSECT / EXCEPT

### 06 `window` · `06-window-functions.html` · MODULE 06 · 窗口函数
prev: `05-subquery-set.html` · next: `07-dml-transaction.html`
- `win-concept` 窗口函数 vs 聚合函数
- `win-rank` ROW_NUMBER / RANK / DENSE_RANK / NTILE
- `win-offset` LAG / LEAD / FIRST_VALUE / LAST_VALUE
- `win-agg` 窗口聚合与累计计算
- `win-frame` 窗口帧 ROWS / RANGE 与滑动窗口
- `win-topn` 分组内 TopN 与取最新一条
- `win-pitfall` 窗口函数常见坑与限制

### 07 `dml` · `07-dml-transaction.html` · MODULE 07 · 数据修改、事务与并发
prev: `06-window-functions.html` · next: `08-schema-design.html`
- `dml-insert` INSERT 与批量插入 / INSERT ... SELECT
- `dml-update` UPDATE 与安全更新
- `dml-delete` DELETE / TRUNCATE / DROP 的区别
- `upsert` 幂等写入（ON DUPLICATE KEY / REPLACE）
- `txn-acid` 事务与 ACID
- `txn-isolation` 隔离级别与并发异常（脏读/不可重复读/幻读）
- `txn-practice` 事务实践：回滚、保存点、长事务危害

### 08 `schema` · `08-schema-design.html` · MODULE 08 · 表设计、约束与范式
prev: `07-dml-transaction.html` · next: `09-index-explain.html`
- `ddl-basic` CREATE / ALTER / DROP / TRUNCATE
- `constraint` 主键 / 外键 / 唯一 / 非空 / 默认 / CHECK
- `key-choice` 自增主键 vs 业务主键 vs UUID
- `index-intro` 索引初识：什么时候该加索引
- `view` 视图与物化视图
- `er-model` ER 建模与表关系（1:1 / 1:N / M:N）
- `norm-123` 范式：1NF / 2NF / 3NF
- `norm-bcnf` BCNF 与反范式权衡

### 09 `index` · `09-index-explain.html` · MODULE 09 · 索引原理与执行计划
prev: `08-schema-design.html` · next: `10-query-tuning.html`
- `idx-btree` B+ 树索引结构
- `idx-clustered` 聚簇索引与二级索引
- `idx-composite` 联合索引与最左前缀原则
- `idx-covering` 覆盖索引与回表
- `idx-explain` EXPLAIN 执行计划解读
- `idx-fail` 索引失效的常见场景
- `idx-design` 索引设计原则与代价

### 10 `tuning` · `10-query-tuning.html` · MODULE 10 · 查询优化与慢 SQL
prev: `09-index-explain.html` · next: `11-storage-locks.html`
- `tune-slowlog` 慢查询日志与问题定位
- `tune-rewrite` SQL 重写技巧
- `tune-join-algo` JOIN 算法（NLJ / BNL / Hash Join）
- `tune-paging` 深分页优化
- `tune-count` COUNT 与统计信息
- `tune-batch` 批量操作与大事务拆分
- `tune-flow` 优化流程与效果验证

### 11 `storage` · `11-storage-locks.html` · MODULE 11 · 存储引擎、锁与 MVCC
prev: `10-query-tuning.html` · next: `12-data-modeling.html`
- `eng-innodb` InnoDB vs MyISAM 与引擎选择
- `log-redo-undo` redo / undo / binlog 三种日志
- `mvcc` MVCC 与 Read View
- `lock-type` 行锁 / 表锁 / 意向锁 / 间隙锁
- `lock-deadlock` 死锁成因与排查
- `lock-practice` 加锁实践与避免锁等待

### 12 `modeling` · `12-data-modeling.html` · MODULE 12 · 数据建模与数仓
prev: `11-storage-locks.html` · next: `13-advanced-sql.html`
- `model-dim` 维度建模：事实表与维度表
- `model-star` 星型模型与雪花模型
- `model-layer` 数仓分层（ODS / DWD / DWS / ADS）
- `model-scd` 缓慢变化维 SCD
- `model-metrics` 指标口径与宽表设计
- `model-case` 建模实战案例

### 13 `advanced` · `13-advanced-sql.html` · MODULE 13 · 高级函数与特性
prev: `12-data-modeling.html` · next: `14-ops-security.html`
- `fn-string` 字符串函数
- `fn-date` 日期时间函数
- `fn-numeric` 数值函数与类型转换
- `fn-case` CASE WHEN 与条件表达式
- `fn-pivot` 行列转换（PIVOT）
- `cte-recursive` 递归 CTE（树形结构 / 生成序列）
- `json-type` JSON 类型与函数
- `proc` 存储过程 / 函数 / 触发器（选学）

### 14 `ops` · `14-ops-security.html` · MODULE 14 · 运维、安全与分布式
prev: `13-advanced-sql.html` · next: `15-interview-patterns.html`
- `ops-backup` 备份与恢复
- `ops-user` 用户、权限与最小授权
- `ops-replica` 主从复制与读写分离
- `ops-shard` 分库分表与水平拆分
- `sec-injection` SQL 注入原理与防护
- `sec-audit` 审计、脱敏与合规

### 15 `interview` · `15-interview-patterns.html` · MODULE 15 · 面试高频 SQL 题型
prev: `14-ops-security.html` · next: `16-analytics-practice.html`
- `itv-topn` TopN 与分组 TopN
- `itv-rank` 排名与并列处理
- `itv-consecutive` 连续 N 天 / 连续区间
- `itv-dedup` 去重与保留最新
- `itv-compare` 自连接比较类（环比 / 上一条）
- `itv-pivot` 行列转换与报表题
- `itv-trap` NULL 与边界陷阱题

### 16 `analytics` · `16-analytics-practice.html` · MODULE 16 · 数据分析实战
prev: `15-interview-patterns.html` · next: `17-capstone-project.html`
- `biz-funnel` 漏斗分析
- `biz-retention` 留存与同期群分析
- `biz-abtest` AB 实验与指标统计
- `biz-yoy` 同比环比与累计指标
- `biz-rfm` 用户分层（RFM）
- `biz-report` 报表 SQL 与自动化

### 17 `capstone` · `17-capstone-project.html` · MODULE 17 · 综合项目实战
prev: `16-analytics-practice.html` · next: ``
- `cap-design` 需求分析与表设计
- `cap-etl` 数据导入与清洗
- `cap-query` 核心分析查询实现
- `cap-optimize` 性能优化与索引落地
- `cap-review` 代码规范与交付
- `cap-next` 下一步学习路线

---
