## ADDED Requirements

### Requirement: 设置页 async 保存失败对用户可见
插件设置页 SHALL 在 PicGo 主配置使用 async/kernel storage 时，把自动保存后的 flush 结果反馈到界面，禁止保存失败时静默显示成功状态。

#### Scenario: 自动保存成功后配置落盘
- **WHEN** 用户在设置页修改图床配置
- **AND** 当前 PicGo storage mode 为 async
- **THEN** 设置页 SHALL 在 VueUse `useStorage` 写入后 debounce 调用 `flushConfig()`
- **AND** Kernel 文件写入成功后该配置 SHALL 可被其他设备读取

#### Scenario: 自动保存失败显示图床配置保存失败
- **WHEN** 用户在设置页修改图床配置且 Kernel 写入失败
- **THEN** 设置页 SHALL 显示明确的图床配置保存失败提示
- **AND** 设置页 SHALL NOT 静默假装该配置已成功同步到 workspace
