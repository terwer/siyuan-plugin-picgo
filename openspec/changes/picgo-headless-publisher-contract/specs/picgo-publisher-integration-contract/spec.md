## ADDED Requirements

### Requirement: PicGo lib 发版先于 Publisher headless UI 集成

PicGo 仓库 SHALL 将本 change 视为 Publisher change `publisher-picgo-headless-ui` 的上游依赖。Publisher 实现 SHALL 面向已经发布或明确本地链接的新 PicGo lib contract，而不是旧 `zhi-siyuan-picgo` 包行为。

#### Scenario: Publisher change 引用 PicGo contract

- **WHEN** Publisher 实现 `publisher-picgo-headless-ui`
- **THEN** 它的 design SHALL 引用本 PicGo change 作为上游依赖
- **AND** 它 SHALL NOT 把当前旧 Publisher PicGo bridge 行为视为目标 contract

#### Scenario: Publisher 升级依赖前 PicGo lib 已可用

- **WHEN** Publisher 升级 `zhi-siyuan-picgo` 以使用新的 headless contract
- **THEN** PicGo packages SHALL 已经构建并可通过正式 release 或明确 local-link workflow 使用
- **AND** Publisher change SHALL 记录使用的版本或 link 来源

### Requirement: 跨仓库职责边界明确

PicGo 仓库 SHALL 拥有上传核心行为、配置持久化语义、uploader schema、校验和 SiYuan 路径解析。Publisher SHALL 只拥有自己的轻量 UI 和平台级发布偏好。

#### Scenario: Publisher 渲染自己的 UI 但不重定义 PicGo 配置语义

- **WHEN** Publisher 渲染 PicGo 驱动的图床设置
- **THEN** 字段定义和保存格式 SHALL 来自 PicGo lib contract
- **AND** Publisher 专属选择，例如 per-platform `picbedService`，SHALL 保留在 Publisher 配置中

#### Scenario: PicGo 插件产品保持可选

- **WHEN** 用户安装 Publisher 但没有安装 `siyuan-plugin-picgo`
- **THEN** PicGo lib contract SHALL 仍允许 Publisher 配置并使用 PicGo 驱动的 uploaders
- **AND** 缺失能力 SHALL 被报告为 lib/runtime/config 问题，而不是要求安装 PicGo 插件产品
