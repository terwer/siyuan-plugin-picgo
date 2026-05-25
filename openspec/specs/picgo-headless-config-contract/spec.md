# picgo-headless-config-contract Specification

## Purpose
TBD - created by archiving change picgo-headless-publisher-contract. Update Purpose after archive.
## Requirements
### Requirement: 无界面消费者可以在不依赖已安装插件产品的情况下创建 PicGo 管理器

`zhi-siyuan-picgo` SHALL 暴露面向 SiYuan 消费者的公共无界面管理器或等价门面。创建和使用该门面 MUST NOT 要求 `siyuan-plugin-picgo` 已经作为 SiYuan 插件安装，也不得要求 `/data/plugins/siyuan-plugin-picgo` 存在。

#### Scenario: Publisher 在未安装 PicGo 插件产品时创建管理器

- **WHEN** 外部消费者在 `/data/plugins/siyuan-plugin-picgo/plugin.json` 不存在的 SiYuan 工作空间中创建无界面管理器
- **THEN** 只要 npm 包和运行时环境可用，管理器创建 SHALL 成功
- **AND** PicGo 库契约 SHALL 不要求调用方执行插件安装检测

#### Scenario: 独立 PicGo 插件继续使用同一底层契约

- **WHEN** `siyuan-plugin-picgo` 内部使用 PicGo 配置和上传行为
- **THEN** 它 SHALL 继续作为产品外壳基于同一底层库契约正常工作
- **AND** 该产品外壳 SHALL NOT 成为外部消费者的必需运行依赖

### Requirement: 无界面消费者可以读取和保存 PicGo 配置

无界面管理器 SHALL 提供公共方法读取当前 PicGo 配置，并保存有边界的配置更新；调用方不需要直接实例化内部数据库类。

#### Scenario: 读取当前配置

- **WHEN** 外部消费者请求当前 PicGo 配置
- **THEN** 管理器 SHALL 返回已经初始化默认 section 的持久化配置
- **AND** 管理器 SHALL 保留未知字段，确保后续版本兼容

#### Scenario: 保存单个上传器配置且不覆盖未知字段

- **WHEN** 外部消费者保存某一个上传器的配置
- **THEN** 管理器 SHALL 只更新目标上传器配置和必要的当前上传器元数据
- **AND** 无关上传器配置、插件配置和未知字段 SHALL 保持不变

### Requirement: 无界面消费者可以管理当前上传器

无界面管理器 SHALL 暴露公共方法读取和设置上传操作使用的当前上传器。

#### Scenario: 设置当前上传器

- **WHEN** 外部消费者把当前上传器设置为受支持的上传器 id
- **THEN** 后续基于同一持久化配置的上传 SHALL 使用该上传器
- **AND** 配置 SHALL 使用 PicGo 标准配置结构记录所选上传器

#### Scenario: 拒绝未知上传器 id

- **WHEN** 外部消费者尝试把当前上传器设置为未知上传器 id
- **THEN** 管理器 SHALL 返回或抛出结构化校验错误
- **AND** 持久化的当前上传器 SHALL NOT 被修改

### Requirement: 无界面消费者可以列出受支持的内置上传器

无界面管理器 SHALL 提供当前运行时可用的内置上传器列表，其中包含可用于保存配置和执行上传的稳定上传器 id。

#### Scenario: 列出内置上传器

- **WHEN** 外部消费者请求上传器列表
- **THEN** 管理器 SHALL 包含 `universal-picgo` 注册的内置上传器
- **AND** 每个条目 SHALL 至少包含 id、展示名称、是否内置、配置模式是否可用

### Requirement: 无界面消费者可以获得上传器配置模式

无界面管理器 SHALL 为受支持的内置上传器暴露配置模式。该配置模式 SHALL 提供足够元数据，让消费者可以在不导入 `picgo-plugin-app` 界面代码的情况下渲染轻量配置表单。

#### Scenario: 获取内置上传器的配置模式

- **WHEN** 外部消费者请求受支持内置上传器的配置模式
- **THEN** 管理器 SHALL 返回字段元数据，包括字段名、字段类型、label 或 message key、是否必填、已知默认值、是否敏感字段、list 字段可选值

#### Scenario: 配置模式不绑定 Vue 或 Element Plus

- **WHEN** 消费者读取上传器配置模式
- **THEN** 配置模式 SHALL 是普通可序列化数据
- **AND** 配置模式 SHALL NOT 依赖 Vue 组件、Element Plus 组件或 `picgo-plugin-app` imports

### Requirement: 无界面消费者可以校验上传器配置

无界面管理器 SHALL 在保存和测试上传前暴露上传器配置校验能力。

#### Scenario: 校验有效上传器配置

- **WHEN** 外部消费者校验某个受支持上传器的完整配置
- **THEN** 管理器 SHALL 返回成功校验结果
- **AND** 结果 SHALL 标识被校验的上传器 id

#### Scenario: 校验缺失必填字段

- **WHEN** 外部消费者校验缺少必填字段的配置
- **THEN** 管理器 SHALL 返回结构化校验失败，包含字段名和提示信息
- **AND** 除非调用方显式使用被文档标为 unsafe 的原始逃逸口，否则管理器 SHALL NOT 持久化无效配置

### Requirement: 无界面消费者可以通过托管配置上传

无界面管理器 SHALL 提供使用同一托管配置和当前上传器状态的上传入口。

#### Scenario: 上传单张图片

- **WHEN** 外部消费者通过无界面管理器上传受支持的图片输入
- **THEN** 管理器 SHALL 使用托管配置中的当前上传器
- **AND** 管理器 SHALL 返回 PicGo 图片输出，或返回与现有上传行为一致的结构化错误

#### Scenario: 上传 Markdown 图片

- **WHEN** 外部消费者通过 SiYuan 门面上传 Markdown 中引用的图片
- **THEN** 门面 SHALL 保留 `SiyuanPicGo` 已有的 Markdown 替换行为
- **AND** 门面 SHALL 使用与无界面管理器相同的配置来源

### Requirement: 无界面契约使用标准路径解析

无界面管理器 SHALL 使用与 `picgo-v2-config-path-split` 一致的路径解析规则，SHALL NOT 要求消费者手动构造 config/runtime/plugin 路径。

#### Scenario: 在 SiYuan 工作空间中解析路径

- **WHEN** SiYuan 消费者使用 SiYuan config 创建管理器
- **THEN** `zhi-siyuan-picgo` SHALL 在内部解析工作空间配置和本地运行时路径
- **AND** 消费者 SHALL 不需要知道物理路径布局

#### Scenario: 保持设备本地运行时分离

- **WHEN** 管理器初始化插件运行时、日志、缓存、外部 PicGo 配置或依赖目录
- **THEN** 这些设备本地 artifact SHALL 遵循 v2 路径拆分规则
- **AND** 除非路径拆分契约明确指定，否则它们 SHALL NOT 被保存到工作空间同步的 `picgo.cfg.json` 位置

