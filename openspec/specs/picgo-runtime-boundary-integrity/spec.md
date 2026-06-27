# picgo-runtime-boundary-integrity 规范

## Purpose
待定 - 由归档变更 picgo-internal-refactor 创建。归档后更新 Purpose。
## Requirements
### Requirement: Runtime capability boundaries 是明确的
插件 SHALL 定义并强制执行明确的 runtime capability boundaries，而不是依赖隐式 Node/browser fallback behavior。

#### Scenario: Browser target 排除 Node escape paths
- **WHEN** browser-facing plugin bundle 被构建
- **THEN** bundle 不包含未批准的 direct `eval`、`eval("require")`、`vm-browserify` 或 Node polyfill escape paths

#### Scenario: Host 或 Node capabilities 被有意注入
- **WHEN** code 需要 SiYuan/Electron/Node-only capabilities
- **THEN** 这些 capabilities 通过明确的 host adapter 或 facade 访问，而不是 dynamic global probing

### Requirement: Direct eval warnings 被视为 architecture failures
本次重构 SHALL 将 direct `eval` warnings 视为 runtime-boundary 或 dependency-design defects 的证据，而不是孤立的 code-style findings。

#### Scenario: Eval warning root cause 被追踪
- **WHEN** build output 报告 direct `eval` 或 `eval("require")`
- **THEN** dependency path、target runtime 和 architectural cause 在接受任何 local implementation change 前被文档化

#### Scenario: Single-line suppression 被拒绝
- **WHEN** proposed change 仅 alias、ignore、patch `node_modules` 或重写报告的 `eval` occurrences，而不改变允许它们进入 bundle 的 boundary
- **THEN** 该 change 对本次重构不充分

### Requirement: Dependency inputs 由 target runtime 控制
插件 SHALL 通过适合 target runtime 的 source、conditional exports 或 stable facades 消费 dependencies，而不是使用隐藏不兼容 fallback code 的 opaque pre-bundled artifacts。

#### Scenario: Opaque dist bundle 被识别
- **WHEN** workspace 或 tightly coupled dependency 从 prebuilt `dist` artifact 被消费
- **THEN** 本次重构在将其视为可接受前，记录该 artifact 是否包含 bundled polyfills、dynamic require 或 generated eval paths

#### Scenario: Runtime-specific entrypoints 被选择
- **WHEN** 一个 package 同时被 browser-facing 和 Node/host-facing code 使用
- **THEN** 它的 public contract 暴露 runtime-specific entrypoints 或 adapters，使每个 target 只接收自己可以安全执行的 capabilities

### Requirement: Bundle verification 是 architecture completion gate
内部重构 SHALL NOT 在 bundle verification 证明 forbidden runtime capabilities 未泄漏到错误 target 之前被视为完成。

#### Scenario: Bundle audit 通过
- **WHEN** 重构准备 review
- **THEN** build verification 包含对 target artifacts 中 direct `eval`、`new Function`、`eval("require")`、`vm-browserify` 和 unintended Node polyfills 的 audit

#### Scenario: Approved exception 是明确的
- **WHEN** dynamic-code 或 Node-polyfill pattern 被有意保留给特定 target
- **THEN** exception 命名 target、owner、reason 和 containment boundary，并且不用于证明 browser-bundle leakage 合理

