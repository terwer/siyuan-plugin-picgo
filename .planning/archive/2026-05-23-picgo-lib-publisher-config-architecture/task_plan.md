# PicGo lib / Publisher 配置能力分层讨论计划

## 目标

讨论并澄清 `siyuan-plugin-picgo` 作为 lib 提供给外部插件（当前主要是 `siyuan-plugin-publisher`）时的命名、分层、配置 UI、配置所有权和发布/集成边界。

核心问题：Publisher 用户不应为了使用图片上传/PicGo 能力而被强制安装完整 `siyuan-plugin-picgo` 插件；需要把“上传内核 / 配置存储 / 可嵌入配置界面 / 独立 PicGo 插件产品 / 消费者插件”拆清楚。

## 边界

- 当前阶段只探索、讨论、梳理，不实现代码。
- 不外部搜索。
- 允许读取当前项目和本地 Publisher 项目用于验证现状。
- 不干扰正在进行的 `picgo-v2-config-path-split` 实施计划；如需修改其 proposal/design/tasks，先征求用户确认。
- SiYuan 相关验证仍只允许使用 `test` 工作空间。

## 阶段

- [x] 阶段 1：澄清集成模型：Publisher 自写轻量 UI；不复刻完整 PicGo UI；不依赖完整 PicGo 插件；底层配置/上传契约来自 PicGo lib
- [x] 阶段 2：现状盘点：PicGo 当前包边界、导出入口、Publisher 当前接入方式
- [x] 阶段 3：确定 SDK 契约：headless 上传、配置读写、配置 schema/校验、迁移能力应该由哪个包提供
- [ ] 阶段 4：确定 Publisher 轻量 UI 范围：只覆盖常用图床，还是覆盖所有 PicGo uploader/plugin 配置
- [ ] 阶段 5：配置所有权：Publisher 独立配置、共享配置、迁移/导入策略
- [x] 阶段 6：形成可落地方案，并决定是否创建/更新 OpenSpec change

## 当前状态

已创建独立讨论计划。用户纠正：重点不是命名，而是 Publisher 到底应该自写轻量级 UI、复用抽取出来的配置 UI，还是继续依赖 PicGo 插件。下一步应先讨论集成模型。



