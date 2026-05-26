# Findings

## 已知背景

- `siyuan-plugin-picgo` 目前提供 lib 给外部使用，主要消费者是 `D:\Users\Administrator\Documents\mydocs\siyuan-plugins\siyuan-plugin-publisher`。
- 现有体验问题：Publisher 用户为了使用 PicGo/图床能力，被迫额外安装完整 `siyuan-plugin-picgo` 插件。
- 用户认为底层能力已经可以脱离独立 PicGo 插件，当前主要缺的是可复用的配置界面/配置管理边界。
- Publisher 当前 v2 对这块理解错误，需要重新梳理。
- 讨论重点优先是命名与层次，不急于实现。

## 初始分层草图

```text
universal-picgo-core       = 上传内核 / uploader pipeline
universal-picgo-store      = 配置存储能力 / adapter
zhi-siyuan-picgo           = SiYuan 环境适配 + PicGo facade
picgo-config-ui ?          = 可嵌入配置界面（待命名）
siyuan-plugin-picgo        = 独立 PicGo 插件产品 shell
siyuan-plugin-publisher    = 消费者插件，内嵌配置 UI 并调用 lib
```

## 待澄清

- Publisher 用户界面上应该叫“图床设置”、“图片上传设置”还是“PicGo 设置”。
- 可嵌入配置 UI 是否应继续带 PicGo 名称。
- Publisher 配置是否与独立 PicGo 插件共享，还是各自拥有。

## 2026-05-23 用户纠正

- 用户指出：当前关键不是名字问题，而是层次/集成模型问题。
- 需要讨论 Publisher 是否应该自己写一个轻量级配置 UI，不再依赖完整 `siyuan-plugin-picgo` 插件。
- 应避免把“可嵌入配置 UI”和“独立 PicGo 插件”作为默认同一层来理解。

## 2026-05-23 方案倾向

- 用户倾向方案 A：Publisher 自己写轻量级 UI，不再依赖完整 `siyuan-plugin-picgo` 插件。
- 轻量 UI 不需要复刻完整 PicGo 插件配置页。
- 但 Publisher 不能自己另造一套图床配置模型；应基于 PicGo lib 暴露的核心能力读取/保存/校验配置。
- Publisher 需要围绕发布场景支持：列出图床、新增图床、管理图床配置，以及 Publisher 自己的个性化设置。

## 2026-05-23 发布顺序约束

- 用户强调：`siyuan-plugin-publisher` 当前依赖的是旧版 `zhi-siyuan-picgo` lib。
- 后续真实流程不是直接改 Publisher，而是：先在 `siyuan-plugin-picgo` 侧完成并发布新版 lib，再回到 Publisher 接入新版 lib。
- 因此当前读取 Publisher 代码只能作为“旧消费者问题样本”和“未来接入点参考”，不能按旧 lib 现状倒推最终架构。

## 2026-05-23 OpenSpec 已创建

### PicGo 仓库

- Change: `picgo-headless-publisher-contract`
- 路径：`openspec/changes/picgo-headless-publisher-contract/`
- 目的：在 PicGo 仓库先定义并实现新版 headless lib contract，供 Publisher 后续升级依赖。
- 关键内容：外部消费者不需要安装 `siyuan-plugin-picgo` 插件；配置模型、uploader schema、校验、上传和 SiYuan 路径解析由 lib 提供。
- Artifacts：proposal/design/specs/tasks 全部完成。

### Publisher 仓库

- Change: `publisher-picgo-headless-ui`
- 路径：`D:\Users\Administrator\Documents\mydocs\siyuan-plugins\siyuan-plugin-publisher\openspec\changes\publisher-picgo-headless-ui/`
- 目的：Publisher 升级新版 PicGo lib 后，自写轻量图床 UI，不再依赖完整 PicGo 插件。
- 关键内容：当前 V2 图床实现属于错误遗留；移除 PicGo 插件安装检测/iframe 设置入口；保留平台级 `None/Bundled/PicGo`，其中 `PicGo` 表示 PicGo lib 能力。
- Artifacts：proposal/design/specs/tasks 全部完成。
