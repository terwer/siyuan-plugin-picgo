# picgo-product-library-boundary 规范

## Purpose
待定 - 由归档变更 picgo-internal-refactor 创建。归档后更新 Purpose。
## Requirements
### Requirement: 插件产品和 library 角色是明确的
本次重构 SHALL 为 SiYuan 插件产品和可复用 PicGo/Siyuan libraries 定义分离的架构角色。

#### Scenario: Package role matrix 被文档化
- **WHEN** 重构基线被记录
- **THEN** 每个 workspace package 被分类为 product shell、UI app、Siyuan adapter、application facade、domain core、store/port、host adapter 或 build-only script

#### Scenario: 依赖方向是单向的
- **WHEN** packages 依赖共享能力
- **THEN** product code 依赖 facades/adapters 和 domain libraries，而 domain libraries 不依赖 product UI、SiYuan DOM、Electron menus 或插件打包关注点

### Requirement: 可复用 library entrypoints 不是产品兜底入口
可复用 library packages SHALL 暴露稳定、面向特定目标的 public entrypoints，而不是一个混合 UI、host、runtime 和 domain 关注点的单一不透明 `dist/index.js`。

#### Scenario: Public exports 是有意设计的
- **WHEN** downstream code imports `universal-picgo`、`universal-picgo-store` 或 `zhi-siyuan-picgo`
- **THEN** 被导入的 entrypoint 表示面向该目标 runtime 的已文档化 public contract

#### Scenario: 深层 source imports 被阻止
- **WHEN** plugin product code 需要当前位于 library source tree 内部的 helper
- **THEN** 该 helper 通过有意设计的 facade 暴露或移动到 product layer，并且 product code 不直接 import library `src` paths

### Requirement: Domain core 对 UI 和 host 中立
PicGo domain core SHALL 避免直接依赖 product UI frameworks、SiYuan DOM state、Electron-only UI helpers 和隐式全局 runtime detection。

#### Scenario: UI framework 不泄漏进 lib core
- **WHEN** reusable library main entry 被构建
- **THEN** Vue、Element Plus、product components 和 product-only UI helpers 不存在，除非该 entrypoint 被明确文档化为 UI adapter

#### Scenario: Host capabilities 通过 ports 访问
- **WHEN** code 需要 filesystem、clipboard、Electron remote、SiYuan kernel API、npm plugin management 或 localStorage behavior
- **THEN** 该 capability 通过明确的 port/adapter boundary 提供，而不是从任意层直接 `win.require`、`SiyuanDevice.siyuanWindow` 或全局 `hasNodeEnv` probing

### Requirement: Lifecycle ownership 是明确的
本次重构 SHALL 明确 PicGo context、Siyuan API clients、configuration migration、event bus subscriptions 和 plugin loader state 的 ownership。

#### Scenario: Singleton state 被证明合理或被移除
- **WHEN** 使用 `SiyuanPicGo`、`picgoEventBus` 或 `UniversalPicGo` lifecycle state
- **THEN** owner、initialization timing、reset behavior 和 test strategy 被文档化

#### Scenario: Core construction 有边界副作用
- **WHEN** library consumer 构造 PicGo core object
- **THEN** construction 不会隐式执行无关 product operations，例如 UI setup、host migration、npm plugin installation 或 third-party plugin loading，除非 lifecycle step 明确请求

### Requirement: Product 和 library builds 被独立验证
本次重构 SHALL 将 plugin product bundles 和 publishable library bundles 作为具有独立约束的独立输出进行验证。

#### Scenario: Product bundle 使用 product facade
- **WHEN** SiYuan plugin artifact 被构建
- **THEN** bootstrap 和 app code 使用 product-level facades/adapters，而不是 library internals 或 prebuilt opaque library bundles

#### Scenario: Library bundle 保持可复用
- **WHEN** publishable library artifacts 被构建
- **THEN** 它们不包含 product-only UI dependencies、plugin packaging assets、SiYuan DOM assumptions 或 generic entrypoints 中无边界的 Node/Electron escape paths

