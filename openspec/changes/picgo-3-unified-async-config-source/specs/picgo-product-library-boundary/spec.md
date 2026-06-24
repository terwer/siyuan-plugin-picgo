## ADDED Requirements

### Requirement: 统一配置 facade 是 shared library contract
PicGo 3.0 SHALL 将 unified async configuration facade 定义为 shared contract，供 product shell、UI app、Siyuan adapter、headless facade、upload dispatch、paste/bootstrap 和 uploader code 共同使用。

#### Scenario: Product 和 library 调用方共享 ready facade
- **WHEN** product UI、bootstrap、headless manager、upload service 或 uploader code 需要 user configuration
- **THEN** 它 SHALL 依赖 shared ready config facade/repository contract
- **AND** facade SHALL 按 domain 路由到各自 owner file

#### Scenario: Repository lifecycle owner 明确
- **WHEN** PicGo runtime 被创建
- **THEN** facade initialization、ready barrier、migration、reload、save 和 reset behavior 的 owner SHALL 在代码结构中明确
- **AND** config migration SHALL 只能由明确 lifecycle step 启动

### Requirement: PC-only runtime artifacts 与同步配置值分离
PicGo 3.0 SHALL 保持 PC-only executable/runtime artifacts 本机化，同时把 user configuration values 写入其 owner files。

#### Scenario: Plugin values 同步但 plugin packages 保持本机化
- **WHEN** 读取第三方 PicGo plugin enablement 或 plugin options
- **THEN** enable/config values SHALL 来自 unified facade 和 owner files
- **AND** plugin package files、npm folders 和 helper runtime files SHALL 保持在 PC-local artifact locations

#### Scenario: Web runtime 读取配置值但不执行 PC artifacts
- **WHEN** Web/Docker runtime 加载 unified facade
- **THEN** 它 MAY 展示或保留 plugin enable/config values
- **AND** PC-only plugin packages SHALL 只在 PC/Electron runtime artifacts 可用时加载

### Requirement: External/PicList 配置不是 PC-only artifact
External/PicList route configuration SHALL 被视为可同步 user configuration，即使 local external PicGo App URL 指向设备本地服务。

#### Scenario: External route config 归属 owner file
- **WHEN** upload dispatch 需要 `extPicgoApiUrl`、`picListApiUrl` 或 `picListApiKey`
- **THEN** 它 SHALL 从 ready facade 读取这些值
- **AND** 这些值 SHALL 归属 `external-picgo-cfg.json`

## MODIFIED Requirements

### Requirement: Domain core 对 UI 和 host 中立
PicGo domain core SHALL 避免直接依赖 product UI frameworks、SiYuan DOM state、Electron-only UI helpers、隐式 global runtime detection，以及分散的 user configuration storage。

#### Scenario: UI framework 不泄漏进 lib core
- **WHEN** reusable library main entry 被构建
- **THEN** Vue、Element Plus、product components 和 product-only UI helpers SHALL NOT 存在，除非该 entrypoint 被明确文档化为 UI adapter

#### Scenario: Host capabilities 通过 ports 访问
- **WHEN** code 需要 filesystem、clipboard、Electron remote、SiYuan kernel API、npm plugin management 或 localStorage behavior
- **THEN** 该 capability SHALL 通过明确的 port/adapter boundary 提供
- **AND** 任意层 SHALL NOT 直接探测 `win.require`、`SiyuanDevice.siyuanWindow` 或 global `hasNodeEnv` 来决定 user configuration storage

#### Scenario: 用户配置不由 domain core 自行持久化
- **WHEN** domain core 或 uploader code 需要 user configuration、token 或 plugin enable state
- **THEN** 它 SHALL 通过注入的 unified config facade 获取或更新该数据
- **AND** facade SHALL 把数据写入对应 owner file

### Requirement: Lifecycle ownership 是明确的
本次重构 SHALL 文档化并约束 PicGo context、Siyuan API clients、unified configuration facade、configuration migration、event bus subscriptions 和 plugin loader state 的 ownership。

#### Scenario: Singleton state 被证明合理或被移除
- **WHEN** 使用 `SiyuanPicGo`、`picgoEventBus`、`UniversalPicGo` 或 unified config facade lifecycle state
- **THEN** owner、initialization timing、reset behavior 和 test strategy SHALL 被文档化
- **AND** instanceKey SHALL 包含足够的 storage 与 workspace identity，避免不同 owner files 之间共享 stale facade state

#### Scenario: Core construction 有边界副作用
- **WHEN** library consumer 构造 PicGo core object
- **THEN** construction SHALL NOT 隐式执行无关 product operations，例如 UI setup、host migration、npm plugin installation、third-party plugin loading 或第二套 config migration
- **AND** 这些副作用 SHALL 需要明确 lifecycle steps
