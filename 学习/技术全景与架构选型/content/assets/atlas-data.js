/* atlas-data.js —— 技术图鉴数据（唯一数据源）
   图鉴页、闪卡复习、⌘K 搜索、详解页的名词悬停卡片都读取这里。

   字段说明（为节省篇幅用了短键名）：
     id   唯一标识（小写，用于链接 atlas.html#id 和复习记录）
     n    名称            aka  别名 / 常见写法（用于搜索和正文识别）
     ly   所在层：fe 前端 · be 后端 · data 数据 · infra 基础设施 · ai AI · arch 架构与概念
     cat  类别（语言 / 框架 / 数据库 / 协议 / 模式 / 概念 …）
     one  一句话是什么    s  解决什么问题    c  代价    x  什么时候别用（可空）
     pair 常一起出现的 id 列表          alt 可替代的 id 列表
     mod  对应详解页锚点（相对 content/ 目录）
     pk   可深入的专项学习包：sql | python | linux | git | dsa
     lv   1 必知 · 2 常见 · 3 了解即可
*/
const ATLAS_LAYERS = [
  { k:"fe",    n:"前端层",     en:"FRONTEND",       mod:"04-frontend.html", d:"用户看到和操作的界面" },
  { k:"be",    n:"后端层",     en:"BACKEND",        mod:"05-backend.html",  d:"业务规则、鉴权与 API" },
  { k:"data",  n:"数据层",     en:"DATA",           mod:"06-data.html",     d:"数据放在哪、怎么保证不错" },
  { k:"infra", n:"基础设施层", en:"INFRA · DEVOPS",  mod:"08-devops.html",   d:"把代码送上线并保持运行" },
  { k:"ai",    n:"AI 层",      en:"AI",             mod:"12-ai.html",       d:"大模型、检索与推理" },
  { k:"arch",  n:"架构与概念", en:"PATTERNS",       mod:"07-arch.html",     d:"贯穿各层的组织方式与关键概念" },
];

const ATLAS = [
  /* ---------------- 前端层 ---------------- */
  { id:"html", n:"HTML", ly:"fe", cat:"标记语言", lv:1, one:"网页的结构与内容骨架。", s:"描述页面上有什么：标题、段落、按钮、表单。", c:"只管结构，不管样式和交互。", pair:["css","javascript"], mod:"04-frontend.html#fe-basics" },
  { id:"css", n:"CSS", ly:"fe", cat:"样式语言", lv:1, one:"控制颜色、字体、布局和动画。", s:"让页面好看，并适配手机和电脑。", c:"全局样式容易互相覆盖，大项目需要规范或工具。", pair:["html","tailwind"], mod:"04-frontend.html#fe-basics" },
  { id:"javascript", n:"JavaScript", aka:["JS"], ly:"fe", cat:"语言", lv:1, one:"浏览器原生支持的编程语言，网页交互的基础。", s:"响应点击、调用接口、更新页面；借助 Node.js 也能写后端。", c:"历史包袱多（隐式类型转换等），大项目建议用 TypeScript。", x:"CPU 密集计算：单线程事件循环会被卡住。", pair:["typescript","vue","react","nodejs"], alt:["typescript","wasm"], mod:"03-lang.html#js-ts" },
  { id:"typescript", n:"TypeScript", aka:["TS"], ly:"fe", cat:"语言", lv:1, one:"带静态类型的 JavaScript 超集。", s:"写代码时就发现类型错误，大项目重构更安心；前后端都能用。", c:"多一步编译，要学类型写法。", x:"几十行的一次性小脚本。", pair:["react","vue","nestjs","nodejs"], alt:["javascript"], mod:"03-lang.html#js-ts" },
  { id:"vue", n:"Vue", aka:["Vue.js","Vue 3"], ly:"fe", cat:"前端框架", lv:1, one:"渐进式前端框架，模板接近 HTML，上手最平缓。", s:"用组件 + 状态驱动搭界面，数据变了界面自动更新。", c:"超大型应用的生态与招聘面略小于 React。", x:"想用 React Native 复用代码做 App 时。", pair:["vite","element-plus","nuxt","fastapi"], alt:["react","svelte","angular"], mod:"04-frontend.html#vue-react" },
  { id:"react", n:"React", ly:"fe", cat:"前端 UI 库", lv:1, one:"用 JSX 写组件的 UI 库，全球生态最大。", s:"构建大型交互应用，还能延伸到 React Native 做 App。", c:"只管视图，路由和状态管理要自己挑；要理解函数式思路。", x:"团队只会 Vue 且项目运行良好时，不必为流行度迁移。", pair:["nextjs","typescript","antd","react-native"], alt:["vue","svelte","angular"], mod:"04-frontend.html#vue-react" },
  { id:"svelte", n:"Svelte", ly:"fe", cat:"前端框架", lv:3, one:"编译时框架，运行时代码极少。", s:"体积小、写法简洁的界面和小工具。", c:"生态和招聘面较小。", x:"需要大量现成组件的大型企业项目。", alt:["vue","react"], mod:"04-frontend.html#vue-react" },
  { id:"angular", n:"Angular", ly:"fe", cat:"前端框架", lv:3, one:"强制 TypeScript 的企业级「全家桶」框架。", s:"大团队长期协作时的统一规范。", c:"概念多，学习曲线最陡。", x:"小项目、快速原型。", alt:["react","vue"], mod:"04-frontend.html#vue-react" },
  { id:"nextjs", n:"Next.js", ly:"fe", cat:"全栈框架", lv:2, one:"基于 React 的全栈框架，提供 SSR / SSG 和路由。", s:"首屏速度和 SEO；也能写简单的后端接口。", c:"比纯 SPA 部署复杂，需要能运行 Node.js 的环境（或静态导出）。", x:"登录后才能用的纯后台系统，SPA 就够。", pair:["react","paas"], alt:["nuxt"], mod:"04-frontend.html#fe-ecosystem" },
  { id:"nuxt", n:"Nuxt", ly:"fe", cat:"全栈框架", lv:2, one:"Vue 生态里的 Next.js。", s:"给 Vue 应用加上服务端渲染、静态生成和路由。", c:"同 Next.js：部署和心智负担比 SPA 重。", pair:["vue"], alt:["nextjs"], mod:"04-frontend.html#fe-ecosystem" },
  { id:"vite", n:"Vite", ly:"fe", cat:"构建工具", lv:2, one:"极快的前端开发服务器与打包工具。", s:"开发时秒级热更新，上线前把源码打包优化。", c:"打包出问题时需要懂一些构建概念。", pair:["vue","react"], mod:"04-frontend.html#fe-ecosystem" },
  { id:"tailwind", n:"Tailwind CSS", aka:["Tailwind"], ly:"fe", cat:"CSS 框架", lv:2, one:"用原子化样式类直接在 HTML 里写样式。", s:"快速搭出风格统一的界面，少起 class 名。", c:"HTML 里类名很长，需要适应。", pair:["css"], mod:"04-frontend.html#fe-ecosystem" },
  { id:"antd", n:"Ant Design", aka:["antd"], ly:"fe", cat:"UI 组件库", lv:2, one:"React 生态的企业级组件库。", s:"表格、表单、弹窗等现成组件，后台系统快速成型。", c:"风格偏中后台，定制外观要花功夫。", pair:["react"], alt:["element-plus"], mod:"04-frontend.html#fe-ecosystem" },
  { id:"element-plus", n:"Element Plus", ly:"fe", cat:"UI 组件库", lv:2, one:"Vue 3 生态最常用的组件库之一。", s:"后台管理系统几小时搭出雏形。", c:"同类组件库的通病：深度定制样式较麻烦。", pair:["vue"], alt:["antd"], mod:"04-frontend.html#fe-ecosystem" },
  { id:"spa", n:"SPA 单页应用", aka:["SPA"], ly:"fe", cat:"渲染方式", lv:1, one:"浏览器里由 JavaScript 生成页面，切换页面不刷新。", s:"交互流畅，后端只需提供 API。", c:"首屏慢，不利于搜索引擎收录。", x:"需要 SEO 的内容页、商品页。", alt:["ssr","ssg"], mod:"04-frontend.html#render-modes" },
  { id:"ssr", n:"SSR 服务端渲染", aka:["SSR"], ly:"fe", cat:"渲染方式", lv:1, one:"每次请求由服务器生成完整 HTML 再发给浏览器。", s:"首屏快、SEO 好、内容实时。", c:"服务器压力大，部署更复杂。", x:"登录后才能用的后台系统。", pair:["nextjs","nuxt"], alt:["spa","ssg"], mod:"04-frontend.html#render-modes" },
  { id:"ssg", n:"SSG 静态生成", aka:["SSG"], ly:"fe", cat:"渲染方式", lv:1, one:"构建时把所有页面生成好 HTML，放到 CDN 上。", s:"最快、最便宜、最稳，适合博客和文档站。", c:"内容变了要重新构建。", x:"价格、库存实时变化的页面。", pair:["cdn"], alt:["ssr","spa"], mod:"04-frontend.html#render-modes" },
  { id:"react-native", n:"React Native", ly:"fe", cat:"跨端框架", lv:2, one:"用 React 写 iOS / Android 原生 App。", s:"一套代码两端复用，Web 团队也能做 App。", c:"复杂动画和原生能力需要额外处理。", pair:["react"], alt:["flutter"], mod:"04-frontend.html#fe-ecosystem" },
  { id:"flutter", n:"Flutter", ly:"fe", cat:"跨端框架", lv:2, one:"Google 的跨端 UI 框架，使用 Dart 语言。", s:"多端界面一致，性能好。", c:"要学 Dart，和 Web 技术栈不通用。", alt:["react-native"], mod:"04-frontend.html#fe-ecosystem" },
  { id:"miniprogram", n:"微信小程序", aka:["小程序"], ly:"fe", cat:"平台", lv:2, one:"运行在微信里、免安装的轻应用。", s:"借助微信的流量、登录和支付快速触达用户。", c:"受平台规则和审核约束，代码难以直接复用到别处。", pair:["uniapp"], mod:"04-frontend.html#fe-ecosystem" },
  { id:"uniapp", n:"uni-app", ly:"fe", cat:"跨端框架", lv:3, one:"用 Vue 写法，一套代码发布到小程序、H5、App。", s:"国内多端发布的常见选择。", c:"跨端抽象有限制，复杂需求要写平台条件代码。", pair:["vue","miniprogram"], mod:"04-frontend.html#fe-ecosystem" },
  { id:"electron", n:"Electron", ly:"fe", cat:"桌面框架", lv:3, one:"用网页技术做桌面软件，VS Code 就是它做的。", s:"Web 团队直接做跨平台桌面应用。", c:"安装包大、内存占用高。", mod:"04-frontend.html#fe-ecosystem" },
  { id:"wasm", n:"WebAssembly", aka:["WASM"], ly:"fe", cat:"运行技术", lv:3, one:"让 C++ / Rust 等编译的代码在浏览器里接近原生速度运行。", s:"浏览器里的视频剪辑、游戏、计算密集任务。", c:"普通业务界面用不上，工具链更复杂。", pair:["rust"], mod:"03-lang.html#rust" },

  /* ---------------- 后端层 ---------------- */
  { id:"python", n:"Python", ly:"be", cat:"语言", lv:1, pk:"python", one:"语法直观、开发极快，AI 与数据的主力语言。", s:"API 服务、AI / 数据分析、自动化脚本、快速原型。", c:"原生执行慢；GIL 限制多线程并行；动态类型在大项目里易藏 bug。", x:"纯 Python 写的 CPU 密集核心链路。", pair:["fastapi","django","pytorch"], alt:["go","java","nodejs"], mod:"03-lang.html#python" },
  { id:"java", n:"Java", ly:"be", cat:"语言", lv:1, one:"运行在 JVM 上的企业级「压舱石」。", s:"复杂业务、事务管理、需要长期维护的大型系统。", c:"启动慢、内存占用高、代码相对啰嗦。", x:"小脚本和快速原型。", pair:["spring-boot","kotlin","mysql"], alt:["go","csharp","kotlin"], mod:"03-lang.html#java" },
  { id:"go", n:"Go", aka:["Golang"], ly:"be", cat:"语言", lv:1, one:"为高并发网络服务设计，编译成单个可执行文件。", s:"微服务、API 网关、云原生基础设施（Docker、K8s 都用 Go 写）。", c:"表达力刻意朴素；AI / 数据生态弱。", x:"复杂领域建模、AI 训练。", pair:["gin","docker","kubernetes"], alt:["java","rust"], mod:"03-lang.html#go" },
  { id:"rust", n:"Rust", ly:"be", cat:"语言", lv:2, one:"编译期保证内存安全，性能接近 C / C++。", s:"数据库、浏览器引擎、网络代理、高性能工具链等底层组件。", c:"学习曲线陡、编译慢、招聘难。", x:"需求每周都在变的业务后台。", pair:["wasm"], alt:["cpp","go"], mod:"03-lang.html#rust" },
  { id:"cpp", n:"C / C++", aka:["C++"], ly:"be", cat:"语言", lv:2, one:"贴近硬件的「老匠人」，最快也最容易踩内存坑。", s:"操作系统、游戏引擎、嵌入式、高性能计算。", c:"内存安全全靠人小心，开发效率低。", alt:["rust"], mod:"03-lang.html#lang-choose" },
  { id:"kotlin", n:"Kotlin", ly:"be", cat:"语言", lv:2, one:"更现代简洁的 JVM 语言，Android 官方推荐。", s:"Android App、JVM 后端，可复用全部 Java 生态。", c:"团队仍需熟悉 JVM 生态。", pair:["spring-boot"], alt:["java"], mod:"03-lang.html#lang-choose" },
  { id:"csharp", n:"C#", aka:[".NET"], ly:"be", cat:"语言", lv:3, one:"微软 .NET 生态的全能语言。", s:"企业应用、Windows 桌面、Unity 游戏。", c:"生态与微软技术栈绑定较深。", alt:["java"], mod:"03-lang.html#lang-choose" },
  { id:"php", n:"PHP", ly:"be", cat:"语言", lv:3, one:"老牌建站语言，部署简单。", s:"WordPress、传统网站、Laravel 后端。", c:"新项目热度下降，大型系统需要额外的工程规范。", mod:"03-lang.html#lang-choose" },
  { id:"nodejs", n:"Node.js", aka:["Node"], ly:"be", cat:"运行时", lv:1, one:"让 JavaScript 跑在服务器上的运行时。", s:"前后端同一种语言、实时应用、前端的配套服务层。", c:"CPU 密集任务会阻塞事件循环；npm 依赖多需管理供应链风险。", pair:["express","nestjs","typescript"], alt:["python","go"], mod:"05-backend.html#other-stacks" },
  { id:"fastapi", n:"FastAPI", ly:"be", cat:"后端框架 · Python", lv:1, pk:"python", one:"Python 的现代 API 框架：类型标注即校验即文档，异步友好。", s:"快速写出带自动校验和交互文档的 HTTP 接口，适合 AI 服务化。", c:"只管 API，数据库、权限、后台要自己组合；不会让 CPU 计算变快。", x:"需要现成管理后台和完整用户系统的内容网站（Django 更省事）。", pair:["pydantic","postgresql","docker","vue"], alt:["django","flask","spring-boot","express"], mod:"05-backend.html#fastapi" },
  { id:"django", n:"Django", ly:"be", cat:"后端框架 · Python", lv:1, pk:"python", one:"自带管理后台、ORM、认证的 Python 全家桶。", s:"快速做出带管理后台的完整业务系统、内容网站。", c:"较重、约定多，灵活度略低。", x:"只需要几个轻量 API 的服务。", pair:["postgresql"], alt:["fastapi","flask","spring-boot"], mod:"05-backend.html#py-family" },
  { id:"flask", n:"Flask", ly:"be", cat:"后端框架 · Python", lv:2, pk:"python", one:"极简的 Python 微框架，其余功能靠插件。", s:"小工具、简单服务、想完全掌控结构。", c:"项目变大后要自己定规范，容易各写各的。", alt:["fastapi","django"], mod:"05-backend.html#py-family" },
  { id:"spring-boot", n:"Spring Boot", aka:["Spring","Spring Cloud"], ly:"be", cat:"后端框架 · Java", lv:1, one:"Java 企业级后端开发的事实标准。", s:"金融、电商、政企大型系统；Spring Cloud 提供微服务全家桶。", c:"启动和资源开销较大，要学的东西多。", pair:["java","mysql","kafka"], alt:["fastapi","gin","nestjs"], mod:"05-backend.html#other-stacks" },
  { id:"nestjs", n:"NestJS", ly:"be", cat:"后端框架 · TS", lv:2, one:"结构严谨、分层清晰的 Node.js 企业级框架。", s:"想用 TypeScript 统一前后端的中大型团队。", c:"概念较多，对小服务偏重。", pair:["typescript","nodejs"], alt:["express","spring-boot"], mod:"05-backend.html#other-stacks" },
  { id:"express", n:"Express", ly:"be", cat:"后端框架 · JS", lv:2, one:"Node.js 生态最老牌的极简框架。", s:"小服务、原型、学习。", c:"大项目要自己补齐结构和规范。", pair:["nodejs"], alt:["nestjs","fastapi"], mod:"05-backend.html#other-stacks" },
  { id:"gin", n:"Gin", ly:"be", cat:"后端框架 · Go", lv:2, one:"轻量高性能的 Go Web 框架。", s:"高并发 API、微服务、网关。", c:"Go 社区偏爱少依赖，很多能力要自己组合。", pair:["go"], alt:["spring-boot","fastapi"], mod:"05-backend.html#other-stacks" },
  { id:"rest", n:"REST API", aka:["REST","RESTful"], ly:"be", cat:"接口风格", lv:1, one:"用 URL 表示资源，用 GET / POST / PATCH / DELETE 表示操作。", s:"前后端之间最通用的接口约定。", c:"页面需要的数据分散时，可能要请求多次。", pair:["openapi"], alt:["graphql","grpc"], mod:"05-backend.html#http-api" },
  { id:"graphql", n:"GraphQL", ly:"be", cat:"接口风格", lv:3, one:"前端在一次请求里按需声明要哪些字段。", s:"页面数据来源多、字段多变的场景。", c:"服务端实现、缓存和权限控制更复杂。", alt:["rest"], mod:"05-backend.html#http-api" },
  { id:"grpc", n:"gRPC", ly:"be", cat:"接口风格", lv:2, one:"基于 HTTP/2 和 Protobuf 的高性能远程调用。", s:"微服务之间的内部通信。", c:"浏览器不能直接调用，二进制格式不如 JSON 直观。", pair:["microservices"], alt:["rest"], mod:"05-backend.html#http-api" },
  { id:"websocket", n:"WebSocket", ly:"be", cat:"协议", lv:2, one:"浏览器与服务器之间的双向长连接。", s:"聊天、协作编辑、实时推送、在线游戏。", c:"连接要长期保持，扩容、断线重连、消息补发更复杂。", alt:["sse"], mod:"13-products.html#p-im" },
  { id:"sse", n:"SSE 服务器推送", aka:["SSE","Server-Sent Events"], ly:"be", cat:"协议", lv:2, one:"服务器沿一个 HTTP 连接持续向浏览器推送数据。", s:"AI 回答逐字流式输出、通知推送。", c:"只能服务器到浏览器单向。", alt:["websocket"], mod:"13-products.html#p-aichat" },
  { id:"orm", n:"ORM", aka:["SQLAlchemy","Hibernate"], ly:"be", cat:"库 · 概念", lv:2, pk:"sql", one:"用代码里的对象操作数据库表，不必手写 SQL。", s:"减少样板 SQL，便于在不同数据库之间迁移。", c:"复杂查询可能生成低效 SQL（如 N+1 查询）。", pair:["postgresql","fastapi"], mod:"07-arch.html#layered" },
  { id:"pydantic", n:"Pydantic", ly:"be", cat:"库 · Python", lv:3, pk:"python", one:"用 Python 类型标注做数据校验的库。", s:"FastAPI 的请求校验、配置解析。", c:"复杂校验规则需要额外学习。", pair:["fastapi"], mod:"05-backend.html#fastapi" },
  { id:"celery", n:"Celery", ly:"be", cat:"任务队列 · Python", lv:2, one:"把耗时任务交给后台工人进程执行。", s:"发邮件、生成报表、图片处理等不必立刻返回的任务。", c:"需要 Redis / RabbitMQ 做中间件，要处理失败重试与幂等。", pair:["redis","rabbitmq"], mod:"05-backend.html#sync-async" },

  /* ---------------- 数据层 ---------------- */
  { id:"postgresql", n:"PostgreSQL", aka:["Postgres","PG"], ly:"data", cat:"关系型数据库", lv:1, pk:"sql", one:"功能最全面的开源关系型数据库之一。", s:"强一致业务和复杂查询；扩展支持 JSONB、全文检索、向量检索。", c:"单机写入有上限；要做备份和运维（可用托管版）。", x:"只拿来当缓存。", pair:["pgvector","redis","fastapi"], alt:["mysql"], mod:"06-data.html#sql-db" },
  { id:"mysql", n:"MySQL", ly:"data", cat:"关系型数据库", lv:1, pk:"sql", one:"国内互联网使用最广的关系型数据库之一。", s:"订单、用户、库存等核心业务数据。", c:"同其他关系型：单机写入上限，扩展要读写分离或分库分表。", pair:["redis","spring-boot"], alt:["postgresql","tidb"], mod:"06-data.html#sql-db" },
  { id:"sqlite", n:"SQLite", ly:"data", cat:"嵌入式数据库", lv:2, pk:"sql", one:"单文件、零配置的数据库。", s:"手机 App、桌面软件、小工具、自动化测试。", c:"不适合高并发写入的服务端。", alt:["postgresql"], mod:"06-data.html#sql-db" },
  { id:"redis", n:"Redis", ly:"data", cat:"内存键值库", lv:1, one:"数据放在内存里，读写极快的键值数据库。", s:"缓存、会话、验证码、计数器、排行榜、限流。", c:"内存成本高；和数据库同时存一份数据会有不一致。", x:"当作唯一的账本存钱相关的数据。", pair:["postgresql","mysql","celery"], mod:"06-data.html#cache" },
  { id:"mongodb", n:"MongoDB", aka:["Mongo"], ly:"data", cat:"文档数据库", lv:1, one:"直接存 JSON 风格文档、字段灵活的 NoSQL 数据库。", s:"结构多变的内容、快速迭代的产品。", c:"数据质量要靠应用保证；复杂关联查询不如 SQL。", x:"强关联、强一致的财务数据。", alt:["postgresql"], mod:"06-data.html#nosql" },
  { id:"elasticsearch", n:"Elasticsearch", aka:["ES","OpenSearch"], ly:"data", cat:"搜索引擎", lv:2, one:"基于倒排索引的全文搜索与分析引擎。", s:"站内搜索、日志检索。", c:"资源占用大、运维复杂，数据要从主库同步过来。", alt:["postgresql"], mod:"06-data.html#nosql" },
  { id:"clickhouse", n:"ClickHouse", ly:"data", cat:"列式分析库", lv:3, one:"为海量数据的聚合分析优化的列式数据库。", s:"埋点分析、报表、日志统计。", c:"不适合频繁的单行更新和事务。", mod:"06-data.html#data-choose" },
  { id:"cassandra", n:"Cassandra / HBase", aka:["Cassandra","HBase"], ly:"data", cat:"宽列数据库", lv:3, one:"为海量写入和水平扩展设计的数据库。", s:"消息记录、物联网数据等写多读少的海量数据。", c:"查询方式受限，要按查询提前设计表。", mod:"13-products.html#p-im" },
  { id:"neo4j", n:"Neo4j", ly:"data", cat:"图数据库", lv:3, one:"用节点和关系存储数据。", s:"社交关系、推荐、风控关系网。", c:"通用业务用不上，多一个组件。", mod:"06-data.html#nosql" },
  { id:"tidb", n:"TiDB / OceanBase", aka:["TiDB","OceanBase"], ly:"data", cat:"分布式关系库", lv:3, one:"兼容 MySQL 协议、又能水平扩展的分布式数据库。", s:"单机 MySQL 撑不住的大规模业务。", c:"运维和成本更高，小规模用不上。", alt:["mysql"], mod:"06-data.html#sql-db" },
  { id:"kafka", n:"Kafka", ly:"data", cat:"消息队列", lv:2, one:"高吞吐的分布式消息日志。", s:"服务解耦、削峰填谷、事件驱动、埋点与日志管道。", c:"运维复杂；要处理消息重复、乱序。", pair:["event-driven","microservices"], alt:["rabbitmq"], mod:"07-arch.html#other-styles" },
  { id:"rabbitmq", n:"RabbitMQ", aka:["RocketMQ"], ly:"data", cat:"消息队列", lv:2, one:"功能灵活的经典消息中间件。", s:"任务分发、服务间的异步通知。", c:"吞吐通常不如 Kafka，同样要处理重复投递。", pair:["celery"], alt:["kafka"], mod:"07-arch.html#other-styles" },
  { id:"object-storage", n:"对象存储", aka:["S3","OSS","MinIO"], ly:"data", cat:"存储服务", lv:1, one:"按「文件」存海量数据的存储服务（如 S3、OSS）。", s:"图片、视频、备份、前端静态资源。", c:"不适合频繁修改的小数据；注意流量费用。", pair:["cdn"], mod:"13-products.html#p-feed" },

  /* ---------------- 基础设施层 ---------------- */
  { id:"linux", n:"Linux", ly:"infra", cat:"操作系统", lv:1, pk:"linux", one:"服务器上最常用的操作系统。", s:"运行几乎所有后端服务和容器。", c:"需要学习命令行和系统概念。", pair:["docker","nginx"], mod:"08-devops.html#deploy-where" },
  { id:"git", n:"Git", ly:"infra", cat:"版本控制", lv:1, pk:"git", one:"记录每次代码改动的版本控制工具。", s:"多人并行开发、合并、回滚。", c:"分支和合并概念需要练习。", x:"往里提交密码和密钥。", pair:["github"], mod:"08-devops.html#git" },
  { id:"github", n:"GitHub / GitLab", aka:["GitHub","GitLab","Gitee"], ly:"infra", cat:"代码托管平台", lv:1, pk:"git", one:"托管 Git 仓库，并提供代码评审、问题跟踪、自动化。", s:"团队协作、Pull Request 评审、开源。", c:"平台权限要管理好，避免泄露私有代码。", pair:["git","github-actions"], mod:"08-devops.html#git" },
  { id:"docker", n:"Docker", ly:"infra", cat:"容器", lv:1, pk:"linux", one:"把应用和运行环境一起打包成标准镜像。", s:"解决「在我电脑上能跑」：开发、测试、生产跑同一个镜像。", c:"要学镜像构建；容器隔离弱于虚拟机。", pair:["compose","kubernetes","github-actions"], mod:"08-devops.html#docker" },
  { id:"compose", n:"Docker Compose", ly:"infra", cat:"容器编排（单机）", lv:1, one:"用一个文件描述多个容器，一条命令全部启动。", s:"本地开发与小规模部署：应用 + 数据库 + 缓存。", c:"不负责跨机器调度和自动扩容。", pair:["docker"], alt:["kubernetes"], mod:"11-capstone.html#wire-up" },
  { id:"kubernetes", n:"Kubernetes", aka:["K8s"], ly:"infra", cat:"容器编排平台", lv:1, one:"管理大量容器：调度、自愈、自动扩缩容、滚动更新。", s:"服务多、需要弹性的中大型系统。", c:"学习和运维成本很高。", x:"小团队、几个服务的项目（用 PaaS 或 Compose）。", pair:["docker","prometheus"], alt:["compose","paas"], mod:"08-devops.html#k8s" },
  { id:"nginx", n:"Nginx", ly:"infra", cat:"反向代理", lv:1, pk:"linux", one:"站在后端前面接请求的 Web 服务器 / 反向代理。", s:"HTTPS、负载均衡、托管静态文件、转发 /api。", c:"配置写错会导致 404 / 502。", pair:["https"], alt:["api-gateway"], mod:"02-map.html#request-journey" },
  { id:"cdn", n:"CDN", ly:"infra", cat:"内容分发网络", lv:1, one:"把静态资源缓存到离用户最近的节点。", s:"图片、视频、前端文件加速；扛住流量峰值。", c:"内容更新要刷新缓存；按流量计费。", pair:["object-storage","ssg"], mod:"13-products.html#p-feed" },
  { id:"https", n:"HTTPS / TLS", aka:["HTTPS","TLS"], ly:"infra", cat:"协议", lv:1, pk:"linux", one:"加密传输的 HTTP。", s:"防窃听、防篡改，浏览器不再提示不安全。", c:"证书要续期，过期会导致全站无法访问。", pair:["nginx"], mod:"09-safety.html#secure-basics" },
  { id:"dns", n:"DNS", ly:"infra", cat:"基础服务", lv:2, pk:"linux", one:"把域名翻译成 IP 地址的「电话簿」。", s:"用户通过域名找到你的服务器。", c:"修改后生效有延迟（各级缓存）。", mod:"02-map.html#request-journey" },
  { id:"cicd", n:"CI/CD", aka:["持续集成","持续部署"], ly:"infra", cat:"实践", lv:1, one:"提交代码后自动检查、测试、构建、部署。", s:"解决人工上线易错，让频繁发布变安全。", c:"要先有可靠的自动化测试，流水线本身也需维护。", pair:["github-actions","docker"], mod:"08-devops.html#cicd" },
  { id:"github-actions", n:"GitHub Actions", ly:"infra", cat:"CI/CD 平台", lv:1, one:"GitHub 自带的自动化流水线。", s:"提交即跑测试、打包镜像、部署。", c:"复杂流水线要学 YAML 配置；注意密钥只放在 Secrets 里。", pair:["github","cicd"], alt:["jenkins"], mod:"08-devops.html#cicd" },
  { id:"jenkins", n:"Jenkins", ly:"infra", cat:"CI/CD 工具", lv:3, one:"老牌的自建 CI/CD 服务器，插件丰富。", s:"内网、需要高度定制的流水线。", c:"要自己维护服务器和插件。", alt:["github-actions"], mod:"08-devops.html#cicd" },
  { id:"observability", n:"可观测性", aka:["日志","指标","链路追踪"], ly:"infra", cat:"实践", lv:1, one:"通过日志、指标、链路追踪看清系统内部状态。", s:"比用户先发现问题，快速定位慢在哪、错在哪。", c:"要设计指标和告警规则，避免告警疲劳。", pair:["prometheus","opentelemetry"], mod:"08-devops.html#observability" },
  { id:"prometheus", n:"Prometheus + Grafana", aka:["Prometheus","Grafana"], ly:"infra", cat:"监控", lv:2, one:"采集指标、画仪表盘、配置告警的开源组合。", s:"看清 QPS、错误率、延迟、资源使用。", c:"指标设计和存储要规划。", pair:["observability","kubernetes"], mod:"08-devops.html#observability" },
  { id:"opentelemetry", n:"OpenTelemetry", aka:["OTel"], ly:"infra", cat:"可观测性标准", lv:3, one:"统一采集日志、指标、链路的开放标准。", s:"跨服务追踪一个请求慢在哪一段。", c:"接入和采样策略需要设计。", pair:["observability","microservices"], mod:"08-devops.html#observability" },
  { id:"terraform", n:"Terraform", ly:"infra", cat:"基础设施即代码", lv:3, one:"用代码描述云资源，可审查、可重复创建。", s:"多环境一致地创建服务器、数据库、网络。", c:"状态文件要妥善管理；有学习成本。", mod:"08-devops.html#deploy-where" },
  { id:"vm", n:"云服务器", aka:["ECS","EC2","VPS"], ly:"infra", cat:"部署方式", lv:1, pk:"linux", one:"租一台虚拟机，系统和运行环境都自己管。", s:"需要完全控制、长期稳定的负载。", c:"运维工作量最大：补丁、安全、监控都要自己做。", alt:["paas","serverless"], mod:"08-devops.html#deploy-where" },
  { id:"paas", n:"PaaS 应用托管", aka:["PaaS","Vercel","Render"], ly:"infra", cat:"部署方式", lv:1, one:"只交代码或镜像，平台负责运行和扩缩容。", s:"小团队快速上线、几乎免运维。", c:"灵活度有限，规模大后可能更贵。", alt:["vm","kubernetes"], mod:"08-devops.html#deploy-where" },
  { id:"serverless", n:"Serverless 函数", aka:["Serverless","Lambda","函数计算"], ly:"infra", cat:"部署方式", lv:2, one:"只写函数，平台在有请求时运行并按调用计费。", s:"流量波动大或很低的接口、定时任务、事件处理。", c:"冷启动、执行时长限制、厂商锁定、本地调试难。", alt:["paas"], mod:"07-arch.html#other-styles" },
  { id:"managed-db", n:"托管数据库", aka:["RDS"], ly:"infra", cat:"云服务", lv:2, one:"由云厂商负责备份、主从、升级的数据库服务。", s:"小团队省掉数据库运维。", c:"比自建贵一些，部分参数不能随意改。", pair:["postgresql","mysql"], mod:"08-devops.html#deploy-where" },

  /* ---------------- AI 层 ---------------- */
  { id:"llm-api", n:"大模型 API", aka:["LLM","大模型","大语言模型"], ly:"ai", cat:"AI 服务", lv:1, one:"通过接口调用云端的大语言模型。", s:"问答、总结、写作、代码生成，最快的 AI 起步方式。", c:"按 token 计费；数据会发给外部服务；会幻觉。", x:"敏感数据不能出公司、又没有私有化方案时。", pair:["rag","sse"], alt:["vllm","ollama"], mod:"10-decide.html#case-ai" },
  { id:"embedding", n:"Embedding 向量化", aka:["Embedding","向量"], ly:"ai", cat:"概念", lv:2, one:"把文字变成一串数字，意思相近的文字向量也相近。", s:"语义搜索、推荐、聚类。", c:"向量模型换了，已有向量要全部重算。", pair:["vector-db","pgvector","rag"], mod:"06-data.html#vector-db" },
  { id:"vector-db", n:"向量数据库", aka:["Milvus","Qdrant","Weaviate","Pinecone"], ly:"ai", cat:"数据库", lv:2, one:"存向量并快速找出「意思最接近」的内容。", s:"大规模语义检索、RAG 知识库。", c:"多一个组件要运维，并和主库同步数据。", pair:["embedding","rag"], alt:["pgvector"], mod:"06-data.html#vector-db" },
  { id:"pgvector", n:"pgvector", ly:"ai", cat:"PostgreSQL 扩展", lv:2, pk:"sql", one:"让 PostgreSQL 支持向量存储和相似度检索。", s:"中小规模 RAG：少一个组件，数据和业务在同一个库。", c:"超大规模时性能不如专用向量库。", pair:["postgresql","rag"], alt:["vector-db"], mod:"06-data.html#vector-db" },
  { id:"rag", n:"RAG 检索增强生成", aka:["RAG"], ly:"ai", cat:"模式", lv:1, one:"先检索相关资料，再让大模型基于资料回答。", s:"回答有出处、减少胡编、能用上私有知识。", c:"检索质量决定答案质量；要做文档切片和效果评估。", pair:["embedding","pgvector","llm-api"], mod:"06-data.html#vector-db" },
  { id:"agent", n:"Agent 智能体", aka:["Agent","智能体"], ly:"ai", cat:"模式", lv:2, one:"让大模型自己规划步骤、调用工具完成任务。", s:"多步骤任务：查资料、调接口、写代码、操作系统。", c:"行为难预测：要限制权限、记录日志、关键步骤人工确认。", pair:["mcp","llm-api"], mod:"12-ai.html#ai-limits" },
  { id:"mcp", n:"MCP 模型上下文协议", aka:["MCP"], ly:"ai", cat:"协议", lv:3, one:"让 AI 应用以统一方式接入外部工具和数据源的开放协议。", s:"一个工具接入一次，多个 AI 客户端都能用。", c:"接入的工具权限要按最小权限管理。", pair:["agent"], mod:"12-ai.html#ai-limits" },
  { id:"langchain", n:"LangChain", aka:["LlamaIndex"], ly:"ai", cat:"开发框架", lv:3, one:"编排大模型调用、检索和工具的开发框架。", s:"快速搭 RAG 和 Agent 原型。", c:"抽象层多；简单场景直接调 API 往往更清楚。", pair:["rag","agent"], mod:"10-decide.html#case-ai" },
  { id:"pytorch", n:"PyTorch", ly:"ai", cat:"深度学习框架", lv:2, pk:"python", one:"训练和研究神经网络的主流框架。", s:"模型训练、微调、科研。", c:"需要数学基础和 GPU 资源。", pair:["python"], mod:"03-lang.html#python" },
  { id:"vllm", n:"vLLM", ly:"ai", cat:"推理服务", lv:3, one:"高吞吐的大模型推理引擎。", s:"私有化部署开源模型，提高 GPU 利用率。", c:"需要 GPU 服务器和运维能力。", alt:["llm-api","ollama"], mod:"13-products.html#p-aichat" },
  { id:"ollama", n:"Ollama", ly:"ai", cat:"本地模型工具", lv:3, one:"一条命令在自己电脑上运行开源大模型。", s:"本地实验、离线和隐私场景。", c:"受本机硬件限制，不适合高并发生产环境。", alt:["vllm","llm-api"], mod:"10-decide.html#case-ai" },

  /* ---------------- 架构与概念 ---------------- */
  { id:"monolith", n:"单体架构", aka:["单体"], ly:"arch", cat:"架构模式", lv:1, one:"所有功能打包在一个应用里，一次部署。", s:"起步最快，开发、测试、部署链路短。", c:"膨胀后牵一发而动全身；只能整体扩容。", alt:["modular-monolith","microservices"], mod:"07-arch.html#monolith" },
  { id:"modular-monolith", n:"模块化单体", ly:"arch", cat:"架构模式", lv:1, one:"一个部署单元，内部按业务划出边界清晰的模块。", s:"今天简单，明天可沿模块边界拆分。", c:"需要团队自觉守住边界，不直接读别的模块的表。", alt:["monolith","microservices"], mod:"07-arch.html#modular" },
  { id:"microservices", n:"微服务", aka:["微服务架构"], ly:"arch", cat:"架构模式", lv:1, one:"把系统拆成多个独立开发、部署、运行的服务。", s:"故障隔离、独立扩展、多团队独立发布。", c:"运维、网络调用、数据一致性、排障都变难。", x:"小团队、业务还在摸索阶段。", pair:["kubernetes","api-gateway","kafka"], alt:["modular-monolith"], mod:"07-arch.html#microservices" },
  { id:"layered", n:"分层架构", ly:"arch", cat:"架构模式", lv:1, one:"接入层、业务层、数据层各司其职。", s:"职责清晰，换数据库只改数据层。", c:"简单功能也要写好几层。", mod:"07-arch.html#layered" },
  { id:"event-driven", n:"事件驱动", ly:"arch", cat:"架构模式", lv:2, one:"服务发布事件，其他服务订阅后各自处理。", s:"一件事触发多个后续动作，彼此解耦。", c:"只能最终一致；流程不直观、排查更难。", pair:["kafka","rabbitmq"], mod:"07-arch.html#other-styles" },
  { id:"api-gateway", n:"API 网关", aka:["网关"], ly:"arch", cat:"组件", lv:2, one:"所有外部请求的统一入口。", s:"集中做鉴权、限流、路由、监控。", c:"成为关键单点，必须高可用。", pair:["microservices"], alt:["nginx"], mod:"07-arch.html#microservices" },
  { id:"acid", n:"ACID 事务", aka:["事务","ACID"], ly:"arch", cat:"概念", lv:1, pk:"sql", one:"原子性、一致性、隔离性、持久性。", s:"转账这类多步操作，要么全部成功，要么全部失败。", c:"跨服务时没有单个数据库事务可用。", pair:["postgresql","mysql"], mod:"06-data.html#sql-db" },
  { id:"consistency", n:"强一致 / 最终一致", aka:["最终一致","强一致"], ly:"arch", cat:"概念", lv:1, one:"写完后是「立刻」还是「过一会儿」所有人都读到新值。", s:"按业务取舍：余额要强一致，点赞数可以最终一致。", c:"强一致在分布式下更贵；最终一致不能用于钱和库存。", pair:["cap","cache-aside"], mod:"06-data.html#consistency" },
  { id:"cap", n:"CAP 定理", aka:["CAP"], ly:"arch", cat:"概念", lv:3, one:"网络分区时，一致性和可用性只能优先保证一个。", s:"理解分布式系统取舍的思考框架。", c:"常被简化误用：正常情况下系统可以同时兼顾两者。", pair:["consistency"], mod:"06-data.html#consistency" },
  { id:"cache-aside", n:"旁路缓存", aka:["Cache-Aside"], ly:"arch", cat:"模式", lv:1, one:"读：先查缓存再查库；写：先更新数据库再删缓存。", s:"热点读走缓存，挡住数据库压力。", c:"仍可能短暂不一致，要设 TTL 兜底。", pair:["redis"], mod:"06-data.html#cache" },
  { id:"idempotency", n:"幂等", aka:["幂等性","Idempotency-Key"], ly:"arch", cat:"概念", lv:1, one:"同一个操作执行一次和执行多次，结果一样。", s:"超时重试、用户连点都不会重复扣款、重复下单。", c:"要设计幂等键、唯一约束或状态机。", pair:["timeout-retry"], mod:"09-safety.html#idempotency" },
  { id:"timeout-retry", n:"超时与重试", aka:["超时","重试"], ly:"arch", cat:"模式", lv:1, one:"给每个网络调用设上限，只对临时失败退避重试。", s:"防止慢依赖拖垮整个系统。", c:"重试 + 不幂等 = 重复执行；同时重试会形成重试风暴。", pair:["idempotency","circuit-breaker"], mod:"09-safety.html#timeout-retry" },
  { id:"circuit-breaker", n:"限流 / 熔断 / 降级", aka:["熔断","限流","降级"], ly:"arch", cat:"模式", lv:2, one:"系统扛不住或依赖出错时，主动保住核心链路。", s:"大促、依赖故障时不至于全站崩溃。", c:"要提前定义核心链路和兜底方案。", pair:["timeout-retry","api-gateway"], mod:"09-safety.html#degrade" },
  { id:"authn-authz", n:"认证与授权", aka:["认证","授权","越权"], ly:"arch", cat:"安全概念", lv:1, one:"认证：你是谁；授权：你能做什么。", s:"防止越权访问（改个 id 就看到别人的数据）。", c:"每个接口都要检查数据归属，不能只看是否登录。", pair:["jwt","oauth"], mod:"09-safety.html#authn-authz" },
  { id:"jwt", n:"JWT", ly:"arch", cat:"令牌格式", lv:2, one:"自带签名的登录令牌，服务端可以无状态校验。", s:"多服务、多端共用登录状态。", c:"签发后难以提前作废，要设短有效期和刷新机制。", pair:["authn-authz"], mod:"09-safety.html#authn-authz" },
  { id:"oauth", n:"OAuth 2.0", aka:["OAuth","第三方登录","SSO"], ly:"arch", cat:"协议", lv:2, one:"让用户用微信、GitHub 等账号授权登录或授权访问。", s:"免注册登录、授权第三方读取部分数据。", c:"流程较复杂，回调地址和令牌存储都要谨慎。", pair:["authn-authz"], mod:"09-safety.html#authn-authz" },
  { id:"openapi", n:"OpenAPI 接口文档", aka:["OpenAPI","Swagger"], ly:"arch", cat:"规范", lv:1, one:"用标准格式描述接口契约，FastAPI 能自动生成。", s:"前后端按契约并行开发，自动生成文档和调用代码。", c:"契约一改，调用方都要跟着改，需要版本管理。", pair:["rest","fastapi"], mod:"11-capstone.html#contract-first" },
  { id:"backup", n:"备份与恢复", aka:["备份","3-2-1"], ly:"arch", cat:"实践", lv:1, one:"3 份副本、2 种介质、1 份异地，并定期演练恢复。", s:"误删、勒索病毒、机器故障后还能找回数据。", c:"没恢复过的备份不算备份；主从复制不能替代备份。", pair:["managed-db"], mod:"09-safety.html#backup" },
  { id:"adr", n:"ADR 架构决策记录", aka:["ADR"], ly:"arch", cat:"实践", lv:2, one:"把重要技术决定的背景、选项、选择和理由写下来。", s:"以后回头看知道当初为什么这么选，新人也能快速理解。", c:"需要坚持写，且保持简短。", mod:"10-decide.html#evolution" },
];

if (typeof window !== "undefined") { window.ATLAS = ATLAS; window.ATLAS_LAYERS = ATLAS_LAYERS; }
