## ADDED Requirements

### Requirement: 无界面消费者支持 async/kernel PicGo 配置来源
无界面 PicGo 管理器或 SiYuan 门面 SHALL 使用与插件产品相同的 storage factory 和主配置事实源，并在 async/kernel 模式下提供刷新与 flush 语义。

#### Scenario: 无界面消费者读取 Docker/Web 共享配置
- **WHEN** 无界面消费者在 Docker/Web runtime 中请求当前 PicGo 配置
- **THEN** 管理器 SHALL 从 `data/storage/syp/picgo/picgo.cfg.json` 对应的 Kernel storage 读取配置
- **AND** 返回配置 SHALL 包含已经初始化的默认 section 且保留未知字段

#### Scenario: 无界面消费者保存配置后可等待落盘
- **WHEN** 无界面消费者保存 PicGo 上传器配置且当前 storage mode 为 async
- **THEN** 管理器 SHALL 提供 `flushConfig()` 或等价能力等待 Kernel 文件写入完成
- **AND** 写入失败 SHALL 作为调用错误暴露

#### Scenario: 无界面上传前刷新共享配置
- **WHEN** 无界面消费者准备通过托管配置上传图片且当前 storage mode 为 async
- **THEN** 管理器 SHALL 能够通过 `reloadConfigAsync()` 或等价入口刷新远端主配置
- **AND** 上传 SHALL 使用刷新后的当前上传器和上传器配置
