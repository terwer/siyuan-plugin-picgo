## Why

`siyuan-plugin-picgo` 的历史包袱已经明显影响可维护性：包与包之间存在深度耦合、内部职责混杂、实现细节外泄到跨包调用中。全量阅读当前代码后可以看到更根本的问题：该仓库同时承担“SiYuan 插件产品”和“可发布/可打包复用 lib”两种身份，但没有在架构上把 product shell、Siyuan 适配、PicGo domain core、运行时 adapter、UI helper、package public contract 分开；所谓“公用底层能力”实际通过胖 lib、全局 runtime 探测、深层 import、静态单例和全量打包复用，导致插件和 lib 长期互相打架。构建期出现的 direct `eval` / `eval("require")` 警告不是单行代码问题，而是运行时边界、依赖输入、预构建产物消费和打包策略长期未被顶层约束的架构信号。现在适合把内部结构重整一次，但必须冻结对外 API，并从根上补齐 product/library 分层与 runtime/bundle 边界设计，避免把维护成本和破坏风险继续传给后续功能。

## What Changes

- 重新梳理 `picgo-plugin-bootstrap`、`picgo-plugin-app`、`Universal-PicGo-Core`、`Universal-PicGo-Store`、`zhi-siyuan-picgo` 的内部职责边界。
- 明确插件产品与可发布 lib 是两个不同消费者：插件产品只能通过 product facade/host adapter 组合能力；可发布 lib 必须提供稳定、目标明确、无产品 UI 泄漏的公共入口。
- 用稳定的包级 facade 替换跨包深层 import 和实现细节外泄，禁止 `zhi-siyuan-picgo/src` 这类源码穿透成为长期契约。
- 从顶层定义浏览器/SiYuan 宿主/Node 构建期/测试环境的运行时能力边界，禁止以局部替换 direct `eval` 的方式掩盖环境混用。
- 治理会把 `vm-browserify`、预构建 `zhi-siyuan-picgo/dist`、动态 `require` 探测等不透明依赖带入目标 bundle 的设计缺陷。
- 治理 `zhi-siyuan-picgo` 同时暴露 core/db/runtime、包含 Vue/Element Plus/Electron helper、又承担 Siyuan 配置迁移和插件管理编排的胖 lib 设计。
- 收敛重复的状态、存储、上传编排和 SiYuan 适配逻辑，降低模块间耦合。
- 增加公共契约与运行时回归验证，锁定现有插件入口、导出、数据兼容性和用户可见行为。
- **不改变对外 API**：不改公开导出名、不改强制配置字段、不改 manifest 结构、不改既有存储契约，除非后续单独提出新的变更。

## Capabilities

### New Capabilities
- `picgo-public-contract-stability`: 在内部重构期间保持现有公共入口、导出符号、插件清单、存储契约和用户可见行为稳定。
- `picgo-runtime-boundary-integrity`: 从架构层约束运行时能力、依赖输入和打包产物，消除 direct `eval` 类警告背后的环境边界缺失。
- `picgo-product-library-boundary`: 从顶层区分 SiYuan 插件产品与可发布 PicGo/Siyuan lib，重建 package role、依赖方向、公共入口和构建目标。

### Modified Capabilities
- 无

## Impact

- 受影响代码主要集中在 `packages/`、`libs/` 和少量 `scripts/` 辅助工具；需要特别审计 `picgo-plugin-bootstrap`、`picgo-plugin-app`、`zhi-siyuan-picgo`、`universal-picgo`、`universal-picgo-store` 的依赖方向。
- 对外影响面包括插件入口、包级导出、设置页与上传/粘贴/菜单等现有运行时流程。
- 需要补充契约测试、构建验证、bundle 审计、package role 审计和宿主 smoke，确保重构不改变外部 API，且不再把 direct `eval`、`eval("require")`、`vm-browserify`、Vue/Element Plus UI helper、Electron-only helper 等错误层级能力带入不该出现的 lib 或 bundle。
