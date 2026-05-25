# picgo-plugin-shell-ux 规范

## Purpose
定义 PicGo 插件产品 shell 交互、一次性初始化/迁移行为，以及配置变化后的运行时刷新提示。

## Requirements
### Requirement: 插件主界面使用轻量挂载式 shell

`siyuan-plugin-picgo` SHALL provide a lightweight mounted plugin shell for the main PicGo UI instead of requiring the normal entry path to open a SiYuan dialog.

#### Scenario: 从插件入口打开挂载式界面

- **WHEN** 用户点击 PicGo 插件入口打开主界面
- **THEN** 插件 SHALL 在当前 SiYuan 页面中挂载受控 DOM popup shell
- **AND** popup SHALL 显示在 PicGo 顶栏按钮附近
- **AND** 该 shell SHALL 能够承载现有 PicGo 设置和操作界面

#### Scenario: 重复点击入口不会创建多个 shell

- **WHEN** 用户重复点击 PicGo 插件入口
- **THEN** 插件 SHALL 复用、聚焦或切换同一个 shell 实例
- **AND** 页面中 SHALL NOT 留下多个重复挂载容器

#### Scenario: shell 可以安全关闭和卸载

- **WHEN** 用户关闭 PicGo shell 或插件被卸载/禁用
- **THEN** 插件 SHALL 清理 shell DOM、事件监听和相关状态
- **AND** 后续再次打开 SHALL 创建干净实例

### Requirement: 配置迁移只在需要时执行

PicGo 配置迁移和初始化检查 SHALL be idempotent and SHALL NOT run again merely because the main UI is opened.

#### Scenario: 已完成迁移后打开主界面

- **WHEN** 当前 config path 和迁移版本已经完成迁移
- **AND** 用户打开 PicGo 主界面
- **THEN** 插件 SHALL NOT 再次执行同一迁移任务
- **AND** 插件 SHALL NOT 显示正在迁移的误导性状态

#### Scenario: 迁移正在运行时打开主界面

- **WHEN** 迁移任务已经在运行中
- **AND** 用户打开 PicGo 主界面
- **THEN** 插件 SHALL 复用当前迁移状态
- **AND** 插件 SHALL NOT 启动第二个并发迁移任务

#### Scenario: 迁移失败后允许明确重试

- **WHEN** 迁移任务失败
- **THEN** 插件 SHALL 记录失败状态并提供明确重试路径
- **AND** 插件 SHALL NOT 在每次打开主界面时无限自动重试

### Requirement: 配置变化后提示运行时刷新需求

When a saved configuration change affects SiYuan plugin menus, commands, status bar entries, or runtime registration state, the UI SHALL tell the user that a plugin reload or equivalent refresh is required.

#### Scenario: 保存需要重载的配置

- **WHEN** 用户保存会影响菜单、命令、状态栏、宿主文档粘贴事件或运行时注册状态的配置
- **THEN** 设置界面 SHALL 显示明确的重载提示文案
- **AND** 文案 SHALL 说明当前菜单或文档粘贴行为可能不会立即更新
- **AND** 文案 SHALL 说明这不是设置保存失败，而是插件和思源笔记运行周期导致的刷新问题

#### Scenario: 不使用自动刷新时显示手动步骤

- **WHEN** 插件无法安全地自动重载或刷新菜单状态
- **THEN** 设置界面 SHALL 显示手动重载插件或重启 SiYuan 的步骤
- **AND** 插件 SHALL NOT 静默假装菜单已即时更新

#### Scenario: 修改粘贴上传相关设置

- **WHEN** 用户修改剪切板自动上传、替换本地链接或粘贴图片和文字混合内容上传设置
- **THEN** 设置界面 SHALL 显示 reload-required 提示
- **AND** 提示 SHALL 说明已经打开的文档或宿主粘贴事件可能需要重载插件或重启 SiYuan 后才按新设置执行

#### Scenario: 手动刷新完成后清除提示

- **WHEN** 用户已经按提示手动重载插件或重启 SiYuan
- **THEN** 设置界面 SHALL 提供清除 reload-required 提示状态的入口
- **AND** 插件 SHALL NOT 调用未确认安全的自动 reload API

### Requirement: 既有上传和设置能力保持可用

The shell UX change SHALL preserve existing PicGo settings, upload, and Markdown image replacement behavior.

#### Scenario: 设置页功能保持可用

- **WHEN** 用户通过新的 shell 打开 PicGo 设置
- **THEN** 用户 SHALL 能够查看和保存现有 PicGo 设置
- **AND** 保存格式 SHALL 与当前配置契约兼容

#### Scenario: 既有产品界面上传保持可用

- **WHEN** 用户通过 `siyuan-plugin-picgo` 既有产品界面上传图片
- **THEN** 上传 SHALL 继续使用当前 PicGo 配置
- **AND** 成功后 Markdown 图片链接替换行为 SHALL 保持可用
