## ADDED Requirements

### Requirement: 设置界面通过统一 async facade 读写所有用户配置
PicGo 设置界面 SHALL 通过 ready `ReadyUnifiedPicGoConfigFacade` 读取和保存所有 PicGo/plugin user configuration。

#### Scenario: 设置页加载等待配置 ready
- **WHEN** 用户打开 PicGo 设置界面
- **THEN** 设置界面 SHALL await unified facade ready state，然后渲染 PicGo main、external/PicList、SiYuan connection、plugin 和 uploader configuration
- **AND** 设置界面 SHALL 展示来自对应 owner file 的值

#### Scenario: 设置页保存 flush 到对应 owner file
- **WHEN** 用户保存任意 PicGo/plugin user configuration
- **THEN** 设置界面 SHALL 通过 unified facade 保存并 await `flush`
- **AND** facade SHALL 只写入发生变化的 domain owner file，并保留其他 owner files 中的 unknown fields

#### Scenario: 敏感字段摘要必须 mask
- **WHEN** 设置页展示只读摘要、错误详情、migration report 或 diagnostic export
- **THEN** `password`、`cookie`、`picListApiKey`、uploader token/secret/password/key fields 和 `uploader.lsky.token` SHALL 显示为 `******`
- **AND** mask output SHALL NOT 作为 saved config 写回

### Requirement: external/PicList 设置全量进入 unified config
设置页 SHALL 将 bundled PicGo、local external PicGo App 和 remote PicList settings 视为同一个可同步 user configuration domain，并归属 `external-picgo-cfg.json`。

#### Scenario: external/PicList 字段通过 facade 保存
- **WHEN** 用户修改 local external PicGo App URL、remote PicList URL、remote PicList API key 或 route selection
- **THEN** 设置页 SHALL 通过 `updateExternalPicGoConfig` 或等价 facade operation 保存变更
- **AND** 结果 SHALL 持久化到当前 storage backend 的 `external-picgo-cfg.json`

## MODIFIED Requirements

### Requirement: 配置迁移只在需要时执行
PicGo 3.0 配置迁移和初始化检查 SHALL 具备幂等性，并由 v3 migration marker lifecycle 状态驱动。

#### Scenario: 已完成迁移后打开主界面
- **WHEN** owner files 和 `siyuan.picgoMigration.version` 表明 `v3.0-unified-async-config-source` 已完成
- **AND** 用户打开 PicGo 主界面
- **THEN** 插件 SHALL 复用已完成的 migration state
- **AND** 插件 SHALL 显示正常 settings content

#### Scenario: 迁移正在运行时打开主界面
- **WHEN** v3 migration task 已经在运行中
- **AND** 用户打开 PicGo 主界面
- **THEN** 插件 SHALL 复用当前 migration promise/state
- **AND** 它 SHALL NOT 为同一个 instanceKey 启动第二个 migration

#### Scenario: 迁移失败后允许明确重试
- **WHEN** domain migration 失败
- **THEN** 插件 SHALL 在 v3 migration state 中记录 failed status 和 error
- **AND** 插件 SHALL 暴露调用 `retryMigration(domains?)` 的明确 retry path
- **AND** successful domains SHALL 保持 successful 标记

### Requirement: 既有上传和设置能力保持可用
shell UX change SHALL 在把配置读写迁移到 unified facade 后，保留当前 PicGo settings、upload、Markdown image replacement behavior 和 bundled/external/PicList choices。

#### Scenario: 设置页功能保持可用
- **WHEN** 用户通过新的 shell 打开 PicGo 设置
- **THEN** 用户 SHALL 能够查看和保存现有 PicGo、SiYuan connection、external/PicList、plugin 和 uploader settings
- **AND** 保存结果 SHALL 写入对应 owner files

#### Scenario: 既有产品界面上传保持可用
- **WHEN** 用户通过 `siyuan-plugin-picgo` 既有产品界面上传图片
- **THEN** upload SHALL await unified facade 并使用当前 PicGo config snapshot
- **AND** Markdown image link replacement behavior SHALL 保持可用

#### Scenario: external/PicList 设置语义保持可用
- **WHEN** 用户在设置页选择 bundled PicGo、local external PicGo App 或 remote PicList
- **THEN** 该选择 SHALL 通过 unified facade 保存到 `external-picgo-cfg.json`
- **AND** 设置页 SHALL 展示与 upload dispatch 一致的 external/PicList route values
