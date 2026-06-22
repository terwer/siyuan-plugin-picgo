## MODIFIED Requirements

### Requirement: 无界面消费者可以读取和保存 PicGo 配置
无界面管理器 SHALL 提供 async public methods，用于通过 unified async facade 读取当前 PicGo config snapshots，并保存有边界的配置更新。

#### Scenario: 异步读取当前配置
- **WHEN** 外部消费者请求当前 PicGo 配置
- **THEN** 管理器 SHALL await unified config facade ready state，然后返回已初始化默认 section 的持久化 config snapshot
- **AND** 管理器 SHALL 保留 unknown fields 以支持后续版本兼容

#### Scenario: 保存单个上传器配置且不覆盖未知字段
- **WHEN** 外部消费者保存某一个上传器的配置
- **THEN** 管理器 SHALL 通过 unified async facade 只更新目标 uploader config 和必要的 current-uploader metadata
- **AND** 无关 uploader config、plugin config 和 unknown fields SHALL 保持不变

#### Scenario: 调用方使用 async 配置方法
- **WHEN** downstream code 使用 PicGo 3.0 headless config contract
- **THEN** 它 SHALL 调用 async configuration methods 并处理 Promise failures
- **AND** sync getters 只能在明确文档化为 snapshot-only 且已有 ready snapshot 时返回数据

### Requirement: 无界面消费者可以管理当前上传器
无界面管理器 SHALL 暴露 async public methods，用于读取和设置 upload operations 使用的 uploader。

#### Scenario: 设置当前上传器
- **WHEN** 外部消费者把当前上传器设置为受支持的 uploader id
- **THEN** 后续基于同一持久化配置的上传 SHALL 使用该 uploader
- **AND** 配置 SHALL 通过 facade 使用 PicGo 标准配置结构记录所选 uploader

#### Scenario: 拒绝未知上传器 id
- **WHEN** 外部消费者尝试把当前上传器设置为未知 uploader id
- **THEN** 管理器 SHALL 返回或抛出结构化 validation error
- **AND** 持久化的当前上传器 SHALL 保持不变

### Requirement: 无界面消费者可以通过托管配置上传
无界面管理器 SHALL 提供 upload entrypoints，并使用 unified-facade 托管的配置和当前 uploader state。

#### Scenario: 上传单张图片
- **WHEN** 外部消费者通过无界面管理器上传受支持的图片输入
- **THEN** 管理器 SHALL await unified config facade ready；backend 为 async 时刷新相关 config snapshot；并使用托管的当前 uploader
- **AND** 管理器 SHALL 返回 PicGo image output，或返回与现有上传行为一致的 structured error

#### Scenario: 上传 Markdown 图片
- **WHEN** 外部消费者通过 SiYuan 门面上传 Markdown 中引用的图片
- **THEN** 门面 SHALL 保留现有 `SiyuanPicGo` Markdown replacement behavior
- **AND** 门面 SHALL 使用与 headless manager 相同的 unified config source

### Requirement: 无界面契约使用标准路径解析
无界面管理器 SHALL 使用 PicGo 3.0 unified configuration facade resolution rules，并在内部完成 config/runtime/plugin path resolution。

#### Scenario: 在 SiYuan 工作空间中解析路径
- **WHEN** SiYuan consumers 使用 SiYuan config 创建 manager
- **THEN** `zhi-siyuan-picgo` SHALL 在内部解析 workspace owner file paths 和 local runtime artifact paths
- **AND** consumers SHALL 不需要知道物理 path layout

#### Scenario: 保持设备本地运行时分离
- **WHEN** 管理器初始化 plugin runtime、logs、caches 或 dependency directories
- **THEN** PC-only runtime artifacts SHALL 遵循本机 artifact boundaries
- **AND** user configuration values，包括 external/PicList 和 SiYuan connection config，SHALL 通过 unified facade 保存到各自 owner files
