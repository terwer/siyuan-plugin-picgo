## Context

`siyuan-plugin-picgo` 当前是多包 workspace 结构，包含插件 bootstrap、前端 app、核心库和 Siyuan 适配层。历史上包间存在较深的直连依赖，部分实现细节通过跨包 import、共享工具和隐式契约泄漏到外部调用面，导致后续维护和扩展成本偏高。

近期构建输出暴露了更深的设计问题：`vm-browserify` 中的 direct `eval`、`zhi-siyuan-picgo/dist/index.js` 中继承/内联的 `eval(this.code)`，以及 `eval("require")("stream")` 这类动态 require 逃逸被带入当前打包链路。这些警告不能被视为“替换三处 eval”即可完成的缺陷；它们说明当前架构没有明确区分浏览器运行时、SiYuan/Electron 宿主能力、Node 构建期能力和测试替身能力，也没有约束依赖输入究竟是源码、公共 API、条件导出还是 opaque dist bundle。

进一步全量阅读代码后，另一个更根本的缺陷是“插件产品”和“可发布/可打包 lib”没有分开。`picgo-plugin-bootstrap` 是 SiYuan 插件入口，`picgo-plugin-app` 是 Vue 设置/上传 UI，二者共同输出到插件产物；但它们都直接依赖 `zhi-siyuan-picgo`，其中 bootstrap 甚至深层导入 `zhi-siyuan-picgo/src`。`zhi-siyuan-picgo` 又不只是窄 Siyuan facade：它转出 `universal-picgo` 的 db/core/runtime 能力，包含 Vue/Element Plus 工具、Electron remote 菜单、Siyuan 配置迁移、PicGo 插件管理和 `SiyuanPicGo` 静态单例。底层 `universal-picgo`/`universal-picgo-store` 也把 `win`、`hasNodeEnv`、文件系统、npm 插件安装、动态 require 和 node polyfill 当作通用能力暴露。结果是产品 shell、UI、宿主适配、domain core、store、第三方插件生态和发布 lib 互相污染。

另一个不可忽略的致命缺陷在粘贴上传链路。当前 `picgo-plugin-bootstrap` 监听 SiYuan `paste` 事件后，没有在事件源头阻断默认粘贴/内部上传，而是先调用 PicGo 上传，再通过 `siyuanApi.uploadAsset(formData)` 让 SiYuan 生成本地 asset，然后按 `siyuan.waitTimeout`/`siyuan.retryTimes` 轮询 DOM 与 block markdown，最后把本地链接替换成图床链接并补写 `custom-picgo-file-map-key`。这不是“复杂但可用”的实现，而是 ownership 错误：同一次用户粘贴由 SiYuan 默认行为和插件补偿逻辑共同处理，上传顺序、DOM 出现时间、block attrs、succMap、本地 asset 与图床 URL 都变成竞态。该路径随机可用不代表可接受；一旦失败，用户看到的是匪夷所思的重复上传、链接不一致、替换失败或元数据错乱，而且回滚很难控制。正确方向必须是插件在粘贴事件源头取得唯一 ownership，例如调用宿主事件 `source.preventDefault()` 阻断默认行为，然后由插件单独完成上传、插入/替换和元数据写入。

更深一层看，粘贴上传的问题不是“某个 listener 里少了一行 preventDefault”，而是产品架构把“用户输入接管”“上传业务”“文档变更”“元数据一致性”“失败回滚”全部压在一个补偿型事件处理器里，并且让 SiYuan 默认行为先改变文档，再让插件追着宿主状态修补。这个模型从根上无法做到确定性：事务起点不属于插件，文档写入不属于插件，回滚对象也不属于插件。彻底重写时必须倒过来设计：只有在插件已经同步取得 paste event ownership 后，才允许启动上传；只允许有一个事实源，即插件事务产出的远端图片结果和对应元数据；文档写入必须是事务的一步，而不是通过等待默认 asset 出现后偷换链接。

本次变更的目标不是重做功能，而是把内部结构整理到更稳定的分层，同时冻结对外 API 与现有插件行为。重构必须从顶层回答“哪些代码属于插件产品、哪些属于可发布 lib、哪些只是运行时 adapter、哪些是纯 domain 能力”，否则任何局部修复都会继续把维护风险推迟到下一次构建或依赖升级。

## Current Code Evidence

- `packages/picgo-plugin-bootstrap/src/index.ts` 同时依赖 SiYuan `Plugin`、`zhi-siyuan-picgo` 主入口和 `zhi-siyuan-picgo/src` 深层源码入口。
- `packages/picgo-plugin-app/src/components/setting/PicgoSetting.vue` 获取 `SiyuanPicGoClient.getInstance()` 后直接把 `ctx` 传给设置组件；`useBundledPicGoSetting.ts` / `useExternalPicGoSetting.ts` 直接 `new ConfigDb(ctx)` / `new ExternalPicgoConfigDb(ctx)`。
- `libs/zhi-siyuan-picgo/src/index.ts` 转出 `universal-picgo` 的 db、类型、runtime `win` 和工具；`src/lib/utils/utils.ts` 依赖 `element-plus` 和 `vue`；`src/lib/picgoHelper.ts` 依赖 Vue `readonly`、Electron remote、PicGo plugin handler 和全局 `picgoEventBus`。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgo.ts` 使用静态单例保存 `SiyuanKernelApi` 与 `SiyuanPicgoPostApi`；`siyuanPicgoPostApi.ts` 同时处理 Siyuan block attrs、文档链接替换、配置迁移、文件移动和 PicGo 上传。
- `libs/Universal-PicGo-Core/src/core/UniversalPicGo.ts` 构造函数立即初始化配置、路径、db、plugin handler、request wrapper、内置插件、第三方插件 loader；`PluginLoader.ts` / `PluginHandler.ts` 负责 `node_modules` 插件加载和 npm 安装/更新。
- `libs/Universal-PicGo-Store/src/lib/utils.ts` 通过 `window`/`parent`/`fs.rm` 推断 `win` 与 `hasNodeEnv`，并被 core 与 Siyuan lib 转出或消费。
- 三个可发布 lib 只有 `main: ./dist/index.js` / `typings`，缺少 runtime-specific `exports`；多个 Vite lib build 使用 `external: []`，Core/Store 还启用 `vite-plugin-node-polyfills`。
- `packages/picgo-plugin-bootstrap/src/index.ts` 的 `picturePasteEventListener` 读取 `detail.files`、`siyuanHTML`、`textHTML`、`textPlain`，但没有调用 `source.preventDefault()` 或任何默认行为阻断。
- 剪贴板路径先 `uploadSingleImageToBed(..., forceUpload=true, ignoreReplaceLink=true)` 上传到 PicGo，再进入 `handleAfterUpload()` / `JsTimer()`，最终在 `doUpdatePictureMetadata()` 内调用 `siyuanApi.uploadAsset(formData)`、`getBlockAttrs()`、`setBlockAttrs()`、`document.querySelector()`、`getBlockByID()`、`updateBlock()` 做后置补偿。
- `siyuan.waitTimeout` / `siyuan.retryTimes` 配置暴露在设置页中，说明当前粘贴链路把时序竞态产品化为用户配置，而不是从架构上消除竞态。
- 全仓扫描只发现 `packages/picgo-plugin-app/src/components/home/controls/DragUpload.vue` 中存在已注释的浏览器 paste `e.preventDefault()`，生产 `eventBus.on("paste")` 路径没有任何默认行为阻断代码。
- 右键/菜单图片上传路径在 `doSelectedPictureUpload()` 中给 `ImageItem.blockId` 赋值并调用 `uploadSingleImageToBed(..., ignoreReplaceLink=false)` 直接替换已有块；剪贴板路径却传入 `ignoreReplaceLink=true`，再由 bootstrap 私有轮询补偿，说明当前架构已经把 paste 变成一条特殊旁路而不是统一上传事务。

## Goals / Non-Goals

**Goals:**
- 收敛包间耦合，建立更清晰的内部分层。
- 将公共入口与导出当作稳定契约，禁止无意破坏。
- 提升后续扩展与调试能力，让上传、存储、适配、UI 编排可单独演进。
- 通过契约/回归验证确保重构不改变外部行为。
- 从根上建立 runtime/bundle 边界：明确哪些包允许使用 Node 能力、哪些包必须是浏览器安全代码、哪些能力必须通过注入或 facade 暴露。
- 把 direct `eval`、动态 `require`、Node polyfill 意外进入浏览器 bundle 视为架构门禁失败，而不是局部告警修复。
- 从根上拆清“插件产品 shell”和“可发布 lib”的责任：UI、SiYuan 宿主副作用、配置迁移、插件商店/npm 管理不得继续污染 domain core 或通用 store。
- 建立 package role 与依赖方向：product shell → Siyuan adapter → PicGo application facade → domain core/ports；禁止反向依赖和 UI 技术栈进入底层 lib。
- 粘贴图片自动上传必须源头阻断 SiYuan 默认粘贴/内部上传，由插件唯一接管；上传、插入/替换、元数据写入必须属于同一个可验证事务。
- 粘贴上传必须作为产品级用例重写，建立 `PasteEventAdapter`、`PasteUploadTransaction`、`DocumentMutationPort`、`MetadataRepository`、`RollbackPolicy` 等明确边界，而不是把旧补偿链路包一层继续复用。

**Non-Goals:**
- 不在本次变更中改变对外 API。
- 不重构为全新产品形态，也不替换现有图床能力。
- 不更改 plugin manifest、readme 对用户的可见语义、默认配置格式。
- 不以“清理历史包袱”为名引入功能性 break change。
- 不做单点式 `eval` 替换或对 `node_modules`/预构建产物打补丁来制造表面安静；必须先解决依赖入口、运行时归属和打包策略。
- 不把“继续共用底层能力”理解为继续共用同一个胖对象/胖 lib；本次要解决的是复用边界设计，而不是把现有耦合换个目录摆放。
- 不把 Vue/Element Plus/Electron helper、SiYuan DOM 查询、npm 插件安装、配置迁移等产品/宿主职责包装成通用 lib API。
- 不允许把双上传、轮询等待、DOM 查找、block markdown 后置偷换链接作为粘贴上传的 fallback、兼容路径或可接受主路径。
- 不允许用 mock 证明粘贴接管正确；必须用真实 SiYuan 宿主事件证明默认行为已被阻断。
- 不允许把 `source.preventDefault()` 当作单点补丁后继续保留原有 `uploadAsset`/`JsTimer`/DOM 查询补偿架构；阻断只是事务 ownership 的入口条件，不是完整设计。

## Future Paste Upload Architecture

粘贴图片上传需要从“宿主默认行为之后的补偿脚本”重写为“插件独占的产品级事务”。目标结构如下：

```text
SiYuan paste event
      │
      ▼
PasteEventAdapter
  - 读取 detail.files / protyle / pageId / textHTML / textPlain
  - 同步判断是否符合自动上传 takeover 条件
  - 在启动异步上传前调用 source.preventDefault()
      │
      ▼
PasteUploadTransaction
  - 创建 transactionId / input snapshot
  - 串联上传、文档写入、元数据提交、通知、回滚
      │
      ├── PicGoUploadService
      │     只负责把 File/Blob 上传到目标图床并返回 remote image result
      │
      ├── DocumentMutationPort
      │     只负责把最终图床链接写入当前编辑位置或目标块
      │     不等待 SiYuan 默认 asset，不通过 DOM 查询偷取 block id
      │
      ├── MetadataRepository
      │     以最终 remote result 和文档写入结果为事实源写 custom-picgo-file-map-key
      │
      └── RollbackPolicy
            明确失败时插入占位、撤销文档变更、提示用户或保留手动处理入口
```

设计约束：

- `PasteEventAdapter` 是唯一允许接触 SiYuan paste event 原始对象的层；它必须在任何 `await` 上传动作之前完成 takeover 决策和默认行为阻断。
- `PasteUploadTransaction` 是粘贴自动上传的唯一编排入口；bootstrap listener 只能调用该 use case，不能直接做 PicGo 上传、SiYuan `uploadAsset`、轮询、DOM 查询和 `updateBlock`。
- `PicGoUploadService` 不应知道 SiYuan 默认 asset、block markdown、DOM 或 `custom-picgo-file-map-key`；它只返回远端上传结果。
- `DocumentMutationPort` 必须基于明确的编辑器/块事务写入最终图床 markdown 或 DOM；如果宿主没有可靠 API，需要先做真实宿主 spike，不能退回“双上传等默认 asset 出现”。
- `MetadataRepository` 必须在文档写入成功后基于同一个 transaction result 提交；失败时不得留下指向不存在文档链接或本地 asset 的陈旧映射。
- `RollbackPolicy` 必须先于实现定义清楚。可接受状态只能是：未插入且提示失败、插入明确失败占位并可重试、或完整成功；不可接受状态是本地 asset 已插入、远端 URL 已上传、metadata 半写入、定时器继续重试的混合状态。

旧链路只能作为反面证据和迁移删除对象：

- `uploadSingleImageToBed(..., ignoreReplaceLink=true)` 的剪贴板特殊旁路不应成为新事务核心。
- `siyuanApi.uploadAsset(formData)` 不得作为自动粘贴上传的补偿主路径；只有在另一个明确需求需要“同时保存到 SiYuan assets”时，才可另开变更设计成显式用户选项，且不能影响默认 takeover 事务。
- `waitTimeout`、`retryTimes`、`JsTimer`、`document.querySelector(img[src=...])`、`getBlockByID()` 后置判断 markdown 再 `updateBlock()` 都不能作为正确性的基础。
- 如果不能证明 `source.preventDefault()` 或等价机制在真实宿主中及时生效，则该版本不能声称已经完成粘贴自动上传重构。

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

8. **把插件产品和可发布 lib 视为两个一等消费者。**  
   `picgo-plugin-bootstrap`/`picgo-plugin-app` 是产品 shell，可以组合 UI、Dialog、status bar、Siyuan event bus 和宿主 API；`universal-picgo`、`universal-picgo-store`、`zhi-siyuan-picgo` 的发布入口必须声明自己面向的消费者和运行时，不得通过转出所有内部对象来同时服务所有场景。  
   备选方案是继续让 app/bootstrap 直接吃 `zhi-siyuan-picgo` 胖入口；拒绝，因为这会让每次 lib 变动都变成插件产品回归风险。

9. **domain core 只能依赖 ports，不能依赖宿主全局。**  
   PicGo 上传编排、配置模型、图片解析、图床插件协议应沉到 UI/宿主无关的 core；文件系统、clipboard、Electron remote、Siyuan kernel API、npm 插件安装、localStorage 等必须通过显式 adapter/port 注入。  
   备选方案是继续用 `win`/`hasNodeEnv` 在任意层分支；拒绝，因为这会把运行时判断变成隐式全局状态，无法被构建和测试稳定验证。

10. **Siyuan 集成 facade 不等于插件产品实现。**  
    `zhi-siyuan-picgo` 可以作为 Siyuan integration package，但必须分清公共 facade、宿主 adapter、产品 UI helper、配置迁移任务和第三方 PicGo 插件管理；Vue/Element Plus/Electron 菜单等产品 helper 不应从 lib 主入口泄漏。  
    备选方案是继续把 `PicgoHelper`、`SiyuanPicGo` 静态单例、配置迁移、插件商店 UI 行为都放在一个包级入口；拒绝，因为这正是当前难维护的核心原因。

11. **发布包入口必须表达目标，而不是只给一个 `dist/index.js`。**  
    可发布包需要明确 public exports、内部 exports、browser/node/host 条件入口和禁止深层 import 策略；产品构建应消费受控源码/facade，而不是消费 opaque dist 或 `src` 深层路径。  
    备选方案是继续依赖 `main: ./dist/index.js` 与 `external: []`；拒绝，因为它无法同时满足插件 bundle、库发布、tree-shaking 和运行时隔离。

12. **粘贴上传必须先取得事件 ownership，再执行上传。**  
    当 `siyuan.autoUpload` 决定由 PicGo 插件接管粘贴图片时，插件必须在事件源头阻断 SiYuan 默认粘贴/内部上传，例如验证并调用宿主 `source.preventDefault()`；随后由插件作为唯一处理方完成 PicGo 上传、文档插入/替换和元数据写入。  
    备选方案是先任由 SiYuan 默认上传，再通过 `uploadAsset`、轮询、DOM 查询和 markdown 替换偷换成图床链接；拒绝，因为这会产生不可控竞态，随机可用也不可接受，失败时用户行为表现不可解释且难以回滚。

13. **粘贴上传回归必须基于真实宿主行为。**  
    粘贴链路验证必须覆盖真实 SiYuan paste event、`detail.source`/`source.preventDefault()`、默认 asset 是否未产生、最终文档链接是否由插件一次性写入、元数据是否一致。  
    备选方案是只用单元 mock、只检查函数调用或只检查最终 URL；拒绝，因为当前缺陷本质是宿主默认行为和插件补偿逻辑之间的真实时序竞态。

14. **粘贴上传要按事务边界彻底重写，而不是包裹旧补偿链路。**  
    新设计必须以 `PasteUploadTransaction` 或等价 use case 作为唯一入口，把事件接管、上传、文档变更、元数据、通知和回滚串成一个可审计流程；旧的 `uploadAsset` 二次上传、`ignoreReplaceLink=true` 旁路、`JsTimer` 轮询和 DOM 查找只能被删除或隔离为历史兼容代码，不能作为 fallback 留在自动上传路径。  
    备选方案是保留旧链路作为“阻断失败时兜底”或“偶发可用时兼容”；拒绝，因为这会重新引入双事实源和不可控回滚。

15. **文档写入必须通过显式端口完成。**  
    阻断默认粘贴后，插件必须通过一个明确的 `DocumentMutationPort` 或等价 adapter 把最终图床链接写入当前编辑上下文，并拿到可用于元数据关联的确定结果；不能通过等待宿主先插入本地 asset 后再反查 DOM 推导 block。  
    备选方案是继续依赖 `document.querySelector` 和 block markdown 包含关系推断目标块；拒绝，因为 DOM 渲染时序不是事务边界。

16. **失败回滚要先设计后实现。**  
    粘贴上传重写必须先定义各阶段失败后的用户可见状态和恢复策略，再写实现；不得在失败后继续依赖后台定时器、重复 `uploadAsset` 或半写 metadata 期待后续自愈。  
    备选方案是“上传失败弹 toast，替换失败让用户重试”；拒绝，因为当前缺陷的核心就是半成功状态用户无法理解也无法可靠恢复。

## Risks / Trade-offs

- [Risk] 内部重构可能引入行为漂移 → Mitigation: 先冻结公共契约，再以测试和 smoke 证明兼容。
- [Risk] 过度抽象会增加短期改动成本 → Mitigation: 只抽象真正跨包复用的稳定边界。
- [Risk] 老代码中隐式依赖很多 → Mitigation: 逐步收敛，先找到高耦合入口再动手。
- [Risk] 不改 API 可能限制理想架构落地 → Mitigation: 本次优先稳定可维护性，必要破坏性调整另开变更。
- [Risk] direct `eval` 告警被误处理成局部代码替换 → Mitigation: 将其归类为运行时边界和依赖入口设计缺陷，先建立边界与门禁，再允许局部实现调整。
- [Risk] Node 兼容 polyfill 或 opaque dist bundle 继续周期性回流 → Mitigation: 明确依赖消费策略、条件导出策略和 bundle 审计规则，禁止错误运行时能力隐式进入浏览器目标。
- [Risk] 插件产品和可发布 lib 继续互相牵制 → Mitigation: 建立 package role 矩阵、依赖方向门禁和 public/internal exports；产品只能通过 facade/adapter 组合能力。
- [Risk] UI/宿主能力继续进入 lib 主入口 → Mitigation: 将 Vue/Element Plus/Electron remote/Siyuan DOM/npm 管理归类为 product 或 host adapter 能力，并在 lib bundle 审计中禁止泄漏。
- [Risk] 静态单例和全局 event bus 掩盖生命周期问题 → Mitigation: 为 `SiyuanPicGo`、`picgoEventBus`、配置迁移和 PicGo ctx 定义显式 ownership 与 reset/test 策略。
- [Risk] 粘贴上传继续沿用双上传补偿，表现随机可用 → Mitigation: 把 `source.preventDefault()`/默认行为阻断作为硬门禁；未证明阻断前不得保留自动上传主路径。
- [Risk] 真实宿主事件与 mock 行为不一致 → Mitigation: 粘贴链路必须做 SiYuan 宿主 smoke，证明未产生默认本地 asset 或后置偷换。
- [Risk] 只补 `preventDefault` 但不改事务边界，旧竞态以另一种形式保留 → Mitigation: 以 `PasteUploadTransaction`、显式文档写入端口和回滚策略作为验收对象；旧补偿路径不得作为 fallback。
- [Risk] 阻断默认粘贴后找不到稳定插入 API → Mitigation: 先做真实宿主 spike 验证 `DocumentMutationPort`，未证明前不允许退回默认 asset 中转。

## Migration Plan

1. 先建立基线：梳理公共导出、插件入口、配置键、存储路径和关键运行时流程。
2. 建立 package role 矩阵：标记 product shell、UI app、Siyuan adapter、PicGo application facade、domain core、store、host adapter、build-only script。
3. 建立运行时矩阵：浏览器 bundle、SiYuan/Electron 宿主侧、Node 构建期脚本、测试替身分别允许哪些能力。
4. 追踪 direct `eval` 告警的依赖链，记录 `vm-browserify`、`zhi-siyuan-picgo/dist/index.js`、`eval("require")("stream")` 等进入 bundle 的路径和原因。
5. 追踪 product/lib 冲突链路：记录 app/bootstrap 直接依赖 `zhi-siyuan-picgo`、`zhi-siyuan-picgo/src` 深层 import、`PicgoHelper` UI 依赖、`win/hasNodeEnv` 转出口、`UniversalPicGo` 构造副作用、core npm 插件管理。
6. 追踪粘贴上传时序链路：记录 paste event detail/source、默认行为阻断点、PicGo 上传、文档写入、元数据写入、失败回滚边界；证明旧双上传补偿路径被移出主路径。
7. 提炼内部 facade，降低跨包深层 import，并把 Node/宿主能力收敛到显式适配层。
8. 调整实现结构，但保持外部 API、manifest 和运行时语义不变。
9. 增加契约测试、构建测试、package role 审计、bundle 审计、真实粘贴宿主 smoke。
10. 若发现需要破坏性 API 变化，单独开新变更，不混入本案。

## Open Questions

- 哪些导出属于真正的公共 API，哪些只是内部实现碰巧暴露？
- 目前最该优先拆解的是存储层、上传编排层，还是 UI 组合层？
- 是否存在需要保留的历史兼容入口，还是可以在内部完全收敛后再保留薄适配？
- 哪些 Node 能力是真实运行时必须，哪些只是依赖包为了兼容旧环境带入的 fallback？
- `zhi-siyuan-picgo` 应该提供怎样的源码/条件导出/facade，才能避免消费方依赖 opaque dist bundle？
- 是否需要为 bundle 产物建立允许列表，明确哪些动态代码能力在何种目标中可以存在？
- `zhi-siyuan-picgo` 的长期定位是 public integration lib、插件内部 facade，还是两者拆包？
- `PicgoHelper` 中哪些能力属于 UI helper，哪些属于 application service，哪些属于 domain 配置规则？
- `UniversalPicGo` 构造函数中的配置初始化、插件加载、第三方插件注册是否需要拆成显式 lifecycle 阶段？
- `win`/`hasNodeEnv` 是否应从 public exports 中移除或降级为内部 adapter 细节？
- package manifest 是否需要 `exports`/条件导出/内部子路径封锁来阻止 `src` 深层 import？
- SiYuan paste event 的 `detail.source`/`source.preventDefault()` 在各前端/后端组合中的真实可用性和调用时机是什么？
- 阻断默认粘贴后，插件应通过哪个 SiYuan API 或编辑器事务插入最终图床链接，才能避免本地 asset 中转？
- 粘贴上传失败时应如何回滚：不插入、插入原本地图片、提示用户手动处理，还是保留剪贴板内容？
