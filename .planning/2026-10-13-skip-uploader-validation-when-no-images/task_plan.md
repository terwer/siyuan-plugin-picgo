# 任务计划：无本地图片时跳过 uploader 配置校验（Publisher issue #2050 上游根治）

## 目标
修复 `zhi-siyuan-picgo` 的 `SiyuanPicGoHeadlessManager.uploadMarkdownImages`：文章没有本地图片时不再前置校验当前 uploader 配置，直接走底层 `uploadPostImagesToBed` 的「文章中没有图片」短路；随后构建、本地集成验证并 npm 发版，供 Publisher（siyuan-plugin-publisher）升级依赖。

## 背景（下游联动）
- 下游问题：`siyuan-plugin-publisher` issue #2050——无图片文章在源码模式/发布时误报
  `文档可能已经成功发布，但是 PicGo 图床内核上传失败，详细信息=>Uploader "smms" config is invalid`
- 下游排查结论（Publisher 仓库 `.planning/2026-10-13-issue-2050-no-image-picgo/`）：
  - 本库 `uploadMarkdownImages` 无图片时仍校验 uploader 配置（本计划修）
  - Publisher 的 SourceMode 绕过 `picbedService` 分流（Publisher 侧修）
- 契约约束：`openspec/specs/picgo-publisher-integration-contract`
  - 「PicGo 库发版先于 Publisher 无界面集成」
  - uploader 校验职责在 PicGo 库（本修复属上游职责）

## 实现路径
库内直接修复：实现（U1）→ 单测 → 构建 → 本地 tgz 集成验证 → 发版。本修复为既有行为修正，无契约变更，不涉及 OpenSpec change。

## 范围
- `libs/zhi-siyuan-picgo/src/lib/SiyuanPicGoHeadlessManager.ts`（`uploadMarkdownImages`）
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts`（抽取 `parsePostLocalImages`）
- 对应单测
- 构建 → 本地 tgz 验证（Publisher 安装本地包回归 issue #2050 场景）→ npm 发版

## 阶段
1. [complete] 根因确认（证据见 findings.md）
2. [complete] 方案定稿：U1 精确版
3. [complete] 实现 + 单测（vitest 7 文件 / 31 用例通过）
4. [in_progress] 构建 + 本地 tgz 验证：构建✓、产物运行时三场景验证✓、tgz 已打包；Publisher 安装回归待做
5. [pending] 发版（build → pack → publish，按 DEVELOPMENT_zh_CN.md「库包发布」；发版动作需作者确认）
6. [pending] Publisher 升级依赖（在 Publisher 仓库执行，见其计划）

> 当前阶段：**4（验证）**。

## 待办
- Publisher 侧安装本地 tgz 做端到端回归（需 Publisher 插件侧改动就绪后一起）
- 发版版本号策略待定（建议 3.0.3 → 3.0.4 patch），发版前确认

## 已做决策
| 决策 | 理由 |
|------|------|
| 上游先行（先改先发版，Publisher 后升级依赖） | 契约「PicGo 库发版先于 Publisher 集成」+ 作者指示 |
| 修复目标语义：无本地图片 ⇒ 不校验 uploader 配置 | 与底层既有「文章中没有图片」短路对齐；校验只在确有图片要上传时才有意义 |
| 采用 U1（抽取 `parsePostLocalImages` 复用） | 精确判定「无本地图片」；检测逻辑单点复用无漂移 |

## 错误记录
（暂无）
