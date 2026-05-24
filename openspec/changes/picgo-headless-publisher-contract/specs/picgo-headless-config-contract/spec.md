## ADDED Requirements

### Requirement: Headless 消费者可以在不依赖已安装插件产品的情况下创建 PicGo manager

`zhi-siyuan-picgo` SHALL 暴露面向 SiYuan 消费者的 public headless manager 或等价 facade。创建和使用该 facade MUST NOT 要求 `siyuan-plugin-picgo` 已经作为 SiYuan 插件安装，也不得要求 `/data/plugins/siyuan-plugin-picgo` 存在。

#### Scenario: Publisher 在未安装 PicGo 插件产品时创建 manager

- **WHEN** 外部消费者在 `/data/plugins/siyuan-plugin-picgo/plugin.json` 不存在的 SiYuan 工作空间中创建 headless manager
- **THEN** 只要 npm 包和运行时环境可用，manager 创建 SHALL 成功
- **AND** PicGo lib contract SHALL 不要求调用方执行插件安装检测

#### Scenario: 独立 PicGo 插件继续使用同一底层 contract

- **WHEN** `siyuan-plugin-picgo` 内部使用 PicGo 配置和上传行为
- **THEN** 它 SHALL 继续作为产品 shell 基于同一底层 lib contract 正常工作
- **AND** 该产品 shell SHALL NOT 成为外部消费者的必需运行依赖

### Requirement: Headless 消费者可以读取和保存 PicGo 配置

Headless manager SHALL 提供 public 方法读取当前 PicGo 配置，并保存有边界的配置更新；调用方不需要直接实例化内部 DB 类。

#### Scenario: 读取当前配置

- **WHEN** 外部消费者请求当前 PicGo 配置
- **THEN** manager SHALL 返回已经初始化默认 section 的持久化配置
- **AND** manager SHALL 保留未知字段，确保后续版本兼容

#### Scenario: 保存单个 uploader 配置且不覆盖未知字段

- **WHEN** 外部消费者保存某一个 uploader 的配置
- **THEN** manager SHALL 只更新目标 uploader 配置和必要的当前 uploader 元数据
- **AND** 无关 uploader 配置、插件配置和未知字段 SHALL 保持不变

### Requirement: Headless 消费者可以管理当前 uploader

Headless manager SHALL 暴露 public 方法读取和设置上传操作使用的当前 uploader。

#### Scenario: 设置当前 uploader

- **WHEN** 外部消费者把当前 uploader 设置为受支持的 uploader id
- **THEN** 后续基于同一持久化配置的上传 SHALL 使用该 uploader
- **AND** 配置 SHALL 使用 PicGo canonical config structure 记录所选 uploader

#### Scenario: 拒绝未知 uploader id

- **WHEN** 外部消费者尝试把当前 uploader 设置为未知 uploader id
- **THEN** manager SHALL 返回或抛出结构化校验错误
- **AND** 持久化的当前 uploader SHALL NOT 被修改

### Requirement: Headless 消费者可以列出受支持的内置 uploaders

Headless manager SHALL 提供当前运行时可用的内置 uploader 列表，其中包含可用于保存配置和执行上传的稳定 uploader id。

#### Scenario: 列出内置 uploaders

- **WHEN** 外部消费者请求 uploader 列表
- **THEN** manager SHALL 包含 `universal-picgo` 注册的内置 uploaders
- **AND** 每个条目 SHALL 至少包含 id、展示名称、是否内置、schema 是否可用

### Requirement: Headless 消费者可以获得 uploader 配置 schema

Headless manager SHALL 为受支持的内置 uploaders 暴露配置 schema。该 schema SHALL 提供足够元数据，让消费者可以在不导入 `picgo-plugin-app` UI 代码的情况下渲染轻量配置表单。

#### Scenario: 获取内置 uploader 的 schema

- **WHEN** 外部消费者请求受支持内置 uploader 的 schema
- **THEN** manager SHALL 返回字段元数据，包括字段名、字段类型、label 或 message key、是否必填、已知默认值、是否敏感字段、list 字段可选值

#### Scenario: Schema 不绑定 Vue 或 Element Plus

- **WHEN** 消费者读取 uploader schema
- **THEN** schema SHALL 是普通可序列化数据
- **AND** schema SHALL NOT 依赖 Vue 组件、Element Plus 组件或 `picgo-plugin-app` imports

### Requirement: Headless 消费者可以校验 uploader 配置

Headless manager SHALL 在保存和测试上传前暴露 uploader 配置校验能力。

#### Scenario: 校验有效 uploader 配置

- **WHEN** 外部消费者校验某个受支持 uploader 的完整配置
- **THEN** manager SHALL 返回成功校验结果
- **AND** 结果 SHALL 标识被校验的 uploader id

#### Scenario: 校验缺失必填字段

- **WHEN** 外部消费者校验缺少必填字段的配置
- **THEN** manager SHALL 返回结构化校验失败，包含字段名和提示信息
- **AND** 除非调用方显式使用被文档标为 unsafe 的 raw escape hatch，否则 manager SHALL NOT 持久化无效配置

### Requirement: Headless 消费者可以通过托管配置上传

Headless manager SHALL 提供使用同一托管配置和当前 uploader 状态的上传入口。

#### Scenario: 上传单张图片

- **WHEN** 外部消费者通过 headless manager 上传受支持的图片输入
- **THEN** manager SHALL 使用托管配置中的当前 uploader
- **AND** manager SHALL 返回 PicGo 图片输出，或返回与现有上传行为一致的结构化错误

#### Scenario: 上传 Markdown 图片

- **WHEN** 外部消费者通过 SiYuan facade 上传 Markdown 中引用的图片
- **THEN** facade SHALL 保留 `SiyuanPicGo` 已有的 Markdown 替换行为
- **AND** facade SHALL 使用与 headless manager 相同的配置来源

### Requirement: Headless contract 使用 canonical path resolution

Headless manager SHALL 使用与 `picgo-v2-config-path-split` 一致的路径解析规则，SHALL NOT 要求消费者手动构造 config/runtime/plugin 路径。

#### Scenario: 在 SiYuan workspace 中解析路径

- **WHEN** SiYuan 消费者使用 SiYuan config 创建 manager
- **THEN** `zhi-siyuan-picgo` SHALL 在内部解析 workspace config 和本地 runtime 路径
- **AND** 消费者 SHALL 不需要知道物理路径布局

#### Scenario: 保持设备本地 runtime 分离

- **WHEN** manager 初始化插件 runtime、日志、缓存、外部 PicGo 配置或依赖目录
- **THEN** 这些设备本地 artifact SHALL 遵循 v2 path split 规则
- **AND** 除非 path split contract 明确指定，否则它们 SHALL NOT 被保存到 workspace 同步的 `picgo.cfg.json` 位置
