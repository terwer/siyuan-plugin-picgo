## ADDED Requirements

### Requirement: Storage runtime capability 判定不跨 realm 复用隐式全局状态
PicGo storage runtime capability SHALL 通过当前入口显式创建的 factory 或当前 JS realm 独立探测获得，不得由另一个 realm 中的隐式全局状态决定。

#### Scenario: iframe 设置页不复用 bootstrap singleton
- **WHEN** 设置页 iframe 初始化 PicGo 配置 UI
- **THEN** 它 SHALL 在 iframe runtime 内独立解析 storage adapter factory
- **AND** 它 SHALL NOT 依赖 bootstrap 中的 static singleton 判断当前 storage mode

#### Scenario: top window 探测失败不会破坏 browser fallback
- **WHEN** browser runtime 尝试读取 `window.top.siyuan` 且访问失败或抛出跨域异常
- **THEN** 探测 SHALL 被安全捕获
- **AND** 当前 runtime SHALL 继续按纯浏览器 localStorage fallback 初始化

#### Scenario: Host capability 通过 factory 注入 core
- **WHEN** PicGo core 需要 filesystem、Kernel storage 或 localStorage 能力
- **THEN** 这些能力 SHALL 由 storage adapter factory 注入
- **AND** core SHALL NOT 通过隐式 global probing 获取 host capability
