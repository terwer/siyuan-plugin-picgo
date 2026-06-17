# siyuan-plugin-picgo 架构探索与 OpenSpec 补充计划

## 目标

全量探索当前仓库代码与配置，基于实际证据理解“插件产品”和“可打包复用 lib”双重身份打架的根本架构缺陷，并把结论写入 `openspec/changes/picgo-internal-refactor`。禁止凭印象或单点告警下结论。

## 当前阶段

阶段 8：OpenSpec 校验与汇总（complete）

## 阶段

- [x] 阶段 1：仓库拓扑与包职责全景梳理
  - 识别 workspace、packages/libs/scripts、入口文件、构建脚本、发布形态。
  - 产出包级职责和依赖关系初稿。
- [x] 阶段 2：插件产品链路探索
  - 跟踪 `plugin.json`、插件 bootstrap、SiYuan 入口、UI/app、用户可见流程。
  - 记录插件运行时依赖的宿主能力和边界。
- [x] 阶段 3：可打包 lib / 底层能力链路探索
  - 跟踪 core/store/zhi-siyuan-picgo 等库的导出、依赖、打包产物和消费方式。
  - 识别 lib API 与插件内部实现是否互相污染。
- [x] 阶段 4：构建与 bundle 边界探索
  - 跟踪 Vite/Rolldown/tsconfig/package exports/dependency alias。
  - 记录 eval/polyfill/dynamic require 类问题的依赖链作为架构证据。
- [x] 阶段 5：提炼根因并更新 OpenSpec
  - 将“插件与可打包 lib 身份冲突”写成顶层设计缺陷、需求、任务和验收门禁。
  - 避免单点修复措辞，强调职责分层、发布边界、运行时适配和公共契约。
- [x] 阶段 6：校验与汇总
  - 运行 OpenSpec 校验，整理本次修改和证据索引。
- [x] 阶段 7：粘贴上传时序缺陷与产品架构根因探索
  - 基于 `picgo-plugin-bootstrap`、`siyuanPicgoPostApi` 和全仓 preventDefault/paste 扫描，证明当前路径是双上传/后置补偿。
  - 将“必须阻断默认行为、插件唯一接管、单事务上传、禁止 mock 和 fallback”写入 OpenSpec。
- [x] 阶段 8：OpenSpec 校验与汇总
  - 运行 `openspec validate picgo-internal-refactor --strict`。
  - 汇总已写入的顶层设计、重写方向和验证门禁。

## 决策原则

- 先证据、后结论；优先以当前代码、配置、构建入口为准。
- 不修改实现代码；本轮只更新 OpenSpec 与规划记录。
- 把 `node_modules` 和生成产物视为证据来源之一，但不能替代源码架构判断。
- 每两次关键查看/搜索后同步 `findings.md` 或 `progress.md`。



