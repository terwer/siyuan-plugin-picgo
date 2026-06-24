## REMOVED Requirements

### Requirement: 内部重构期间 public API 保持稳定
**Reason**: PicGo plugin 3.0 明确批准 configuration API breaking changes；旧 public API surface 稳定要求会阻碍全链路 async 化和调用方同步改造。

**Migration**: Downstream callers SHALL 在采用 PicGo 3.0 时迁移到新的 async configuration facade 和更新后的 package contracts。数据兼容由 v3 migration service 提供，migration 目标为现有 owner files。

## MODIFIED Requirements

### Requirement: 持久化数据兼容
插件 SHALL 使用一次 PicGo 3.0 migration 读取现有 user configuration 和 storage data，并写入对应 owner files。

#### Scenario: 现有数据仍可迁移读取
- **WHEN** 用户在 PicGo 3.0 中打开现有安装
- **THEN** migration service SHALL 将受支持的 legacy user configuration sources 导入对应 owner files
- **AND** runtime SHALL 通过 unified async facade 读取 migration results

#### Scenario: v2 main-config-only state 是 migration baseline
- **WHEN** 用户存在由 `docker-picgo-storage-persistence` 生成的数据
- **THEN** PicGo 3.0 SHALL 将该数据视为有效 v2 source 用于 migration
- **AND** PicGo 3.0 SHALL NOT 将 v2 main-config-only scope 继续作为自身 persistence boundary

#### Scenario: 现有数据写入迁移到统一 facade contract
- **WHEN** 用户在 PicGo 3.0 初始化后修改 settings 或上传 images
- **THEN** 插件 SHALL 通过 unified async facade 写入 user configuration changes
- **AND** facade SHALL 将每个 domain 写入对应 owner file

### Requirement: 用户可见行为保持等价
插件 SHALL 保持当前 bootstrap、settings、upload、external/PicList 和 Siyuan integration flows 的核心用户能力，同时允许 PicGo 3.0 中 configuration API 发生 breaking changes。

#### Scenario: 核心流程行为相同
- **WHEN** 用户打开 settings、上传 image、使用 paste upload，或与 SiYuan integration surfaces 交互
- **THEN** 用户可见流程 SHALL 与当前 release 在功能上保持等价
- **AND** bundled PicGo、local external PicGo App 和 remote PicList choices SHALL 仍可表达并生效

#### Scenario: Sensitive summaries 必须 mask
- **WHEN** public 或 diagnostic surfaces 报告 configuration status
- **THEN** sensitive fields SHALL 以 `******` 形式 mask
- **AND** raw values SHALL 只存在于 owner file persistence 和 API calls 所需的 runtime memory 中

### Requirement: 重构完成需要 contract verification
PicGo 3.0 configuration refactor SHALL 在 contract checks、migration checks、runtime validation 和 consistency audit 全部确认后才视为完成。

#### Scenario: Verification gates 通过
- **WHEN** refactor 准备 review
- **THEN** contract tests、build checks、migration tests 和 host smoke SHALL 提供 public API migration、user data migration、external/PicList semantics 和 user-visible behavior 的证据
- **AND** audit SHALL 证明 user config reads/writes 通过 unified async facade 进入对应 owner files

#### Scenario: Grep gates 通过
- **WHEN** final audit 运行 grep checks
- **THEN** production legacy reads of `window.localStorage.getItem("universal-picgo/picgo.cfg.json")`、direct Lsky token localStorage access 和 direct `ExternalPicgoConfigDb` config decisions SHALL 在 migration/test fixtures 之外不存在
- **AND** owner file storage SHALL 不得在 Kernel-backed runtime 中绕过 `SiyuanKernelApi` wrapper
