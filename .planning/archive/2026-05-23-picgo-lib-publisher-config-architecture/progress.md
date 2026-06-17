# Progress

## 2026-05-23

- 发现当前活跃计划为 `2026-05-23-picgo-v2-config-path-split-apply`。
- 根据用户要求，新建独立计划 `2026-05-23-picgo-lib-publisher-config-architecture`，用于跟踪 PicGo lib / Publisher 配置能力分层讨论。
- 已将 `.planning/.active_plan` 切换到本讨论计划；旧计划目录保留，未归档、未修改。
- 下一步：先进行命名澄清，不做实现。

- 用户纠正讨论方向：不是先命名，而是先判断 Publisher 是否自写轻量 UI、是否脱离 PicGo 插件依赖。已更新 task_plan 阶段表和 findings。


- 用户纠正讨论方向：不是先命名，而是先判断 Publisher 是否自写轻量 UI、是否脱离 PicGo 插件依赖。已更新 task_plan 阶段表和 findings。

- 用户明确倾向方案 A：Publisher 自写轻量 UI，但配置模型和上传能力必须来自 PicGo lib，不能自造一套。下一步读取 PicGo lib 导出和 Publisher 当前图床接入代码，确认需要怎样的 SDK 契约。

- 用户补充发布顺序：先发版 PicGo lib，再去 Publisher 接新版 lib。已记录；后续讨论重点改为 PicGo lib 需要先稳定哪些 public contract。

- 已按用户要求在两个仓库分别创建互相引用的 OpenSpec：
  - PicGo：`picgo-headless-publisher-contract`，4/4 artifacts complete。
  - Publisher：`publisher-picgo-headless-ui`，4/4 artifacts complete。
- 已明确实施顺序：先 PicGo lib 发版/本地 link，再 Publisher 升级依赖并重写 V2 图床 UI。

## 2026-05-24 OpenSpec 语言规范修正

- 用户要求两个 OpenSpec 的关键正文必须使用中文，OpenSpec 关键字可以保留英文。
- 已修正 PicGo 仓库 `picgo-headless-publisher-contract`：`proposal.md`、`design.md`、两个 `spec.md`、`tasks.md` 的正文均改为中文表达；保留 `## ADDED Requirements`、`### Requirement:`、`#### Scenario:`、`SHALL`、`WHEN/THEN` 等 OpenSpec 格式关键字。
- 已修正 Publisher 仓库 `publisher-picgo-headless-ui`：`proposal.md`、`design.md`、`spec.md`、`tasks.md` 的正文均改为中文表达；保留 OpenSpec 格式关键字。
- 两个 change 均重新执行 `openspec status`，仍为 4/4 artifacts complete。
