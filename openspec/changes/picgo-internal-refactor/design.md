## Context

`siyuan-plugin-picgo` 当前是多包 workspace 结构，包含插件 bootstrap、前端 app、核心库和 Siyuan 适配层。历史上包间存在较深的直连依赖，部分实现细节通过跨包 import、共享工具和隐式契约泄漏到外部调用面，导致后续维护和扩展成本偏高。

近期构建输出暴露了更深的设计问题：`vm-browserify` 中的 direct `eval`、`zhi-siyuan-picgo/dist/index.js` 中继承/内联的 `eval(this.code)`，以及 `eval("require")("stream")` 这类动态 require 逃逸被带入当前打包链路。这些警告不能被视为“替换三处 eval”即可完成的缺陷；它们说明当前架构没有明确区分浏览器运行时、SiYuan/Electron 宿主能力、Node 构建期能力和测试替身能力，也没有约束依赖输入究竟是源码、公共 API、条件导出还是 opaque dist bundle。

本次变更的目标不是重做功能，而是把内部结构整理到更稳定的分层，同时冻结对外 API 与现有插件行为。

## Goals / Non-Goals

**Goals:**
- 收敛包间耦合，建立更清晰的内部分层。
- 将公共入口与导出当作稳定契约，禁止无意破坏。
- 提升后续扩展与调试能力，让上传、存储、适配、UI 编排可单独演进。
- 通过契约/回归验证确保重构不改变外部行为。
- 从根上建立 runtime/bundle 边界：明确哪些包允许使用 Node 能力、哪些包必须是浏览器安全代码、哪些能力必须通过注入或 facade 暴露。
- 把 direct `eval`、动态 `require`、Node polyfill 意外进入浏览器 bundle 视为架构门禁失败，而不是局部告警修复。

**Non-Goals:**
- 不在本次变更中改变对外 API。
- 不重构为全新产品形态，也不替换现有图床能力。
- 不更改 plugin manifest、readme 对用户的可见语义、默认配置格式。
- 不以“清理历史包袱”为名引入功能性 break change。
- 不做单点式 `eval` 替换或对 `node_modules`/预构建产物打补丁来制造表面安静；必须先解决依赖入口、运行时归属和打包策略。

## Decisions

1. **冻结对外契约，内部先重排。**  
   先把公共导出、插件入口、配置键、存储路径和宿主交互行为视为稳定边界，内部实现再逐步重构。  
   备选方案是同时改 API 和内部结构，但这会显著放大迁移风险。

2. **以 facade / orchestrator 统一跨包调用。**  
   让 `picgo-plugin-bootstrap`、`picgo-plugin-app`、`Universal-PicGo-Core`、`Universal-PicGo-Store`、`zhi-siyuan-picgo` 之间通过更少、更稳定的入口协作。  
   备选方案是继续允许深层 import；拒绝，因为这会让重构变成“表面整理”。

3. **优先梳理状态与存储边界。**  
   先稳定配置、持久化、运行时上下文、插件加载和上传编排，再处理 UI 细节。  
   备选方案是从 UI 开始；拒绝，因为 UI 改动容易掩盖底层契约问题。

4. **用契约测试锁定 API。**  
   对外导出、manifest、配置字段、关键运行时行为建立可执行验证，防止内部重构误伤用户。  
   备选方案是只依赖人工 smoke；拒绝，因为维护面太大。

5. **把运行时能力作为一等架构边界。**  
   为浏览器 bundle、SiYuan/Electron 宿主侧、Node 构建期脚本、测试环境分别定义允许能力：浏览器目标不得隐式携带 `vm-browserify`、`eval("require")`、Node stream 动态探测等逃逸路径；需要 Node 能力时必须通过宿主适配层/facade 显式注入。  
   备选方案是对当前三处 `eval` 做字符串替换、alias 或 ignore warning；拒绝，因为下一次依赖升级或预构建 bundle 变化会复发，且无法说明运行时安全边界。

6. **禁止把 opaque dist bundle 当作内部依赖基础。**  
   对 workspace 内部或强耦合包，优先消费源码、条件导出或受控 facade，而不是直接依赖 `zhi-siyuan-picgo/dist/index.js` 这类已经混入 polyfill、动态 require 和 bundler 产物的文件。  
   备选方案是继续从 dist 反向适配；拒绝，因为 dist 是结果不是边界，不能作为顶层架构设计依据。

7. **构建门禁必须证明“没有错误运行时能力泄漏”。**  
   构建验证不只看是否成功，还要审计产物中 direct `eval`、`new Function`、`eval("require")`、`vm-browserify`、意外 Node polyfill 和跨环境 fallback 是否进入目标包。  
   备选方案是仅接受 Rolldown 警告并人工判断；拒绝，因为这会把架构缺陷周期性推迟到发布阶段。

## Risks / Trade-offs

- [Risk] 内部重构可能引入行为漂移 → Mitigation: 先冻结公共契约，再以测试和 smoke 证明兼容。
- [Risk] 过度抽象会增加短期改动成本 → Mitigation: 只抽象真正跨包复用的稳定边界。
- [Risk] 老代码中隐式依赖很多 → Mitigation: 逐步收敛，先找到高耦合入口再动手。
- [Risk] 不改 API 可能限制理想架构落地 → Mitigation: 本次优先稳定可维护性，必要破坏性调整另开变更。
- [Risk] direct `eval` 告警被误处理成局部代码替换 → Mitigation: 将其归类为运行时边界和依赖入口设计缺陷，先建立边界与门禁，再允许局部实现调整。
- [Risk] Node 兼容 polyfill 或 opaque dist bundle 继续周期性回流 → Mitigation: 明确依赖消费策略、条件导出策略和 bundle 审计规则，禁止错误运行时能力隐式进入浏览器目标。

## Migration Plan

1. 先建立基线：梳理公共导出、插件入口、配置键、存储路径和关键运行时流程。
2. 建立运行时矩阵：浏览器 bundle、SiYuan/Electron 宿主侧、Node 构建期脚本、测试替身分别允许哪些能力。
3. 追踪 direct `eval` 告警的依赖链，记录 `vm-browserify`、`zhi-siyuan-picgo/dist/index.js`、`eval("require")("stream")` 等进入 bundle 的路径和原因。
4. 提炼内部 facade，降低跨包深层 import，并把 Node/宿主能力收敛到显式适配层。
5. 调整实现结构，但保持外部 API、manifest 和运行时语义不变。
6. 增加契约测试、构建测试、bundle 审计、宿主 smoke。
7. 若发现需要破坏性 API 变化，单独开新变更，不混入本案。

## Open Questions

- 哪些导出属于真正的公共 API，哪些只是内部实现碰巧暴露？
- 目前最该优先拆解的是存储层、上传编排层，还是 UI 组合层？
- 是否存在需要保留的历史兼容入口，还是可以在内部完全收敛后再保留薄适配？
- 哪些 Node 能力是真实运行时必须，哪些只是依赖包为了兼容旧环境带入的 fallback？
- `zhi-siyuan-picgo` 应该提供怎样的源码/条件导出/facade，才能避免消费方依赖 opaque dist bundle？
- 是否需要为 bundle 产物建立允许列表，明确哪些动态代码能力在何种目标中可以存在？
