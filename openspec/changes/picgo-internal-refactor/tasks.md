## 1. Contract baseline

- [ ] 1.1 记录当前公共 API 基线：插件入口、`plugin.json`、workspace package 导出、关键配置字段、存储路径和运行时行为。
- [ ] 1.2 记录当前构建与测试基线：各 package 的 build/lint/test 脚本与可复现命令。
- [ ] 1.2.1 记录 direct `eval` / `eval("require")` 构建告警基线，包括 `vm-browserify`、`zhi-siyuan-picgo/dist/index.js` 和 `stream` 动态 require 的引入链。
- [ ] 1.3 明确“不可变对外 API”清单，写入验证日志。

## 2. Internal architecture cleanup

- [ ] 2.1 梳理 `picgo-plugin-bootstrap`、`picgo-plugin-app`、`Universal-PicGo-Core`、`Universal-PicGo-Store`、`zhi-siyuan-picgo` 的职责边界。
- [ ] 2.1.1 设计运行时能力矩阵，明确浏览器 bundle、SiYuan/Electron 宿主侧、Node 构建期、测试环境的允许能力和禁止能力。
- [ ] 2.1.2 明确依赖输入策略：内部强耦合包优先走源码/条件导出/facade，禁止把 opaque dist bundle 作为架构边界。
- [ ] 2.2 收敛跨包深层 import，提炼稳定 facade / orchestrator。
- [ ] 2.2.1 将需要 Node/宿主能力的逻辑收敛到显式适配层，禁止浏览器目标通过 `eval("require")`、`vm-browserify` 或隐式 polyfill 获取能力。
- [ ] 2.3 清理重复逻辑与隐式状态依赖，避免外部行为变化。
- [ ] 2.4 制定并落地 bundle 审计门禁：目标产物不得出现未解释的 direct `eval`、`new Function`、动态 require、Node polyfill 泄漏。

## 3. Contract protection and verification

- [ ] 3.1 为公共导出与关键运行时行为补充契约测试。
- [ ] 3.2 跑各 package 的 build / lint / test 基线，并记录差异。
- [ ] 3.2.1 跑 Rolldown/Vite 等构建并检查产物审计结果，确认 direct `eval` 类告警不是被 ignore/alias 掩盖，而是通过运行时边界与依赖策略消除或被明确隔离。
- [ ] 3.3 运行 SiYuan 宿主或等价 smoke，确认对外 API 与用户可见行为未变化。

## 4. Review and closure

- [ ] 4.1 汇总内部重构结果、保留的 API 契约和已知风险。
- [ ] 4.2 审计是否存在任何对外 API 破坏；如有，拆分成新变更。
- [ ] 4.3 更新证据日志，准备后续 apply/archiving 流程。
