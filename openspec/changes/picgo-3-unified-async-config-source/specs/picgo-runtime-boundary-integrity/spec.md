## ADDED Requirements

### Requirement: 用户配置通过统一 runtime boundary 访问
PicGo 3.0 runtime SHALL 将 unified async configuration facade 作为 user configuration access boundary。

#### Scenario: Legacy user config access 被隔离到 migration
- **WHEN** production runtime code 在初始化后需要 user configuration
- **THEN** 它 SHALL 访问 unified facade 或由该 facade 支撑的 configuration object
- **AND** legacy localStorage 或 JSON readers SHALL 只限于 migration importers、test adapters、cache adapters 或明确 host adapters

#### Scenario: Kernel-backed runtime 暴露结构化错误
- **WHEN** Kernel-backed configuration read 或 write 失败
- **THEN** runtime SHALL 通过 UI/headless error handling 暴露失败
- **AND** failure SHALL 包含 config domain 和 owner file 信息

#### Scenario: Owner file storage 不绕过 SiyuanKernelApi
- **WHEN** owner file storage 运行在 Kernel-backed runtime
- **THEN** 它 SHALL 使用 `SiyuanKernelApi` wrapper
- **AND** 它 SHALL NOT 直接 `fetch`、拼接 `/api/file/*`，或调用 bare Kernel HTTP endpoints 访问 configuration files

## MODIFIED Requirements

### Requirement: Runtime capability boundaries 是明确的
插件 SHALL 定义并强制执行 runtime capability boundaries，而不是依赖隐式 Node/browser fallback behavior；user configuration access SHALL 通过 unified facade 和 storage adapter boundary。

#### Scenario: Browser target 排除 Node escape paths
- **WHEN** browser-facing plugin bundle 被构建
- **THEN** bundle SHALL NOT 包含未批准的 direct `eval`、`eval("require")`、`vm-browserify` 或 Node polyfill escape paths

#### Scenario: Host 或 Node capabilities 被有意注入
- **WHEN** code 需要 SiYuan、Electron 或 Node-only capabilities
- **THEN** 这些 capabilities SHALL 通过明确的 host adapters 或 facade options 访问
- **AND** user configuration storage SHALL NOT 由任意 dynamic global probing 选择

#### Scenario: 用户配置能力通过配置端口访问
- **WHEN** code 需要读取或保存 PicGo/plugin user configuration
- **THEN** 该 capability SHALL 由 unified async configuration facade 或其 repository/adapter 提供
- **AND** facade SHALL 按 domain 访问对应 owner file

#### Scenario: Pure browser fallback 保持显式
- **WHEN** runtime 是没有 Kernel API 的 pure browser
- **THEN** facade MAY 使用 localStorage-backed adapters 访问同一 logical keys
- **AND** 该 fallback SHALL 仍遵守 ready、migration、mask 和 owner-domain 规则
