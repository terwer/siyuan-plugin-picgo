# picgo-public-contract-stability 规范

## Purpose
待定 - 由归档变更 picgo-internal-refactor 创建。归档后更新 Purpose。
## Requirements
### Requirement: 内部重构期间 public API 保持稳定
插件 SHALL 在内部 modules 被重构时保持其 public API surface。

#### Scenario: 现有 plugin entry 保持稳定
- **WHEN** 插件被构建并由 SiYuan 加载
- **THEN** 现有 plugin entry 和 manifest-facing contract 与当前 release behavior 保持兼容

#### Scenario: Public exports 保持稳定
- **WHEN** downstream code imports 已发布的 workspace packages
- **THEN** 构成 public API 的 exported symbols 和 module paths 保持可用，除非单独明确提出 breaking change

### Requirement: 持久化数据兼容
插件 SHALL 继续读取和写入现有用户 configuration、cache 和 storage data，而不要求会破坏当前安装的 migration。

#### Scenario: 现有数据仍可读取
- **WHEN** 用户在重构后打开现有安装
- **THEN** 当前 runtime 仍可读取之前存储的 configuration 和 metadata

#### Scenario: 现有数据仍可写入
- **WHEN** 用户修改 settings 或上传 images
- **THEN** 插件继续按相同的外部兼容 contract 写入数据，除非单独明确批准 migration

### Requirement: 用户可见行为保持等价
插件 SHALL 保持当前 bootstrap、settings、upload 和 Siyuan integration flows 的可观察行为。

#### Scenario: 核心流程行为相同
- **WHEN** 用户打开 settings、上传 image 或与 Siyuan integration surface 交互
- **THEN** 用户可见流程与当前 release 在功能上保持等价

### Requirement: 重构完成需要 contract verification
内部重构 SHALL NOT 在 contract checks 和 runtime validation 确认外部行为未改变之前被视为完成。

#### Scenario: Verification gates 通过
- **WHEN** 重构准备 review
- **THEN** contract tests、build checks 和 host smoke 提供 public API 与用户可见行为已被保留的证据

