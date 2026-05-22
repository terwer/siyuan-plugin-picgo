## 1. Contract baseline

- [ ] 1.1 记录当前公共 API 基线：插件入口、`plugin.json`、workspace package 导出、关键配置字段、存储路径和运行时行为。
- [ ] 1.2 记录当前构建与测试基线：各 package 的 build/lint/test 脚本与可复现命令。
- [ ] 1.2.1 记录 direct `eval` / `eval("require")` 构建告警基线，包括 `vm-browserify`、`zhi-siyuan-picgo/dist/index.js` 和 `stream` 动态 require 的引入链。
- [ ] 1.3 明确“不可变对外 API”清单，写入验证日志。
- [ ] 1.4 记录 package role 基线：区分插件产品入口、Vue app、Siyuan integration lib、PicGo core、store、host adapter、build script。
- [ ] 1.5 记录当前 product/lib 冲突证据：`zhi-siyuan-picgo/src` 深层 import、UI 依赖进入 lib、`win/hasNodeEnv` 转出口、静态单例、core 构造副作用、npm 插件管理进入 core。

## 2. Internal architecture cleanup

- [ ] 2.1 梳理 `picgo-plugin-bootstrap`、`picgo-plugin-app`、`Universal-PicGo-Core`、`Universal-PicGo-Store`、`zhi-siyuan-picgo` 的职责边界。
- [ ] 2.1.1 设计运行时能力矩阵，明确浏览器 bundle、SiYuan/Electron 宿主侧、Node 构建期、测试环境的允许能力和禁止能力。
- [ ] 2.1.2 明确依赖输入策略：内部强耦合包优先走源码/条件导出/facade，禁止把 opaque dist bundle 作为架构边界。
- [ ] 2.1.3 设计 product/library 分层：product shell、Siyuan adapter、application facade、domain core、store port、host adapter 的职责与依赖方向。
- [ ] 2.1.4 明确哪些能力不得进入 lib 主入口：Vue/Element Plus UI helper、Electron remote 菜单、SiYuan DOM 查询、npm 插件安装、配置迁移副作用。
- [ ] 2.2 收敛跨包深层 import，提炼稳定 facade / orchestrator。
- [ ] 2.2.0 移除或隔离 `zhi-siyuan-picgo/src` 深层 import，补齐 `replaceImageLink` 等被产品使用能力的正式公共入口或内部 adapter。
- [ ] 2.2.1 将需要 Node/宿主能力的逻辑收敛到显式适配层，禁止浏览器目标通过 `eval("require")`、`vm-browserify` 或隐式 polyfill 获取能力。
- [ ] 2.3 清理重复逻辑与隐式状态依赖，避免外部行为变化。
- [ ] 2.3.1 梳理 `SiyuanPicGo` 静态单例、`picgoEventBus`、`UniversalPicGo` 构造初始化副作用，定义显式 ownership/lifecycle/reset 策略。
- [ ] 2.3.2 将 UI 设置 helper、PicGo 插件商店/npm 管理、Siyuan 配置迁移从通用 lib 主入口中隔离到 product 或 host adapter 层。
- [ ] 2.4 制定并落地 bundle 审计门禁：目标产物不得出现未解释的 direct `eval`、`new Function`、动态 require、Node polyfill 泄漏。
- [ ] 2.5 制定 package manifest/export 策略：明确 public/internal exports、条件入口、禁止深层 `src` import、插件产品构建与 lib 发布构建的输入差异。

## 3. Contract protection and verification

- [ ] 3.1 为公共导出与关键运行时行为补充契约测试。
- [ ] 3.1.1 增加 package role/依赖方向检查：lib 主入口不得 import 产品 UI、Electron-only helper 或 SiYuan DOM；product 代码不得深层 import lib `src`。
- [ ] 3.2 跑各 package 的 build / lint / test 基线，并记录差异。
- [ ] 3.2.1 跑 Rolldown/Vite 等构建并检查产物审计结果，确认 direct `eval` 类告警不是被 ignore/alias 掩盖，而是通过运行时边界与依赖策略消除或被明确隔离。
- [ ] 3.2.2 分别验证插件产品 bundle 与可发布 lib bundle：两者不得依赖同一份未区分 target 的胖入口作为唯一事实来源。
- [ ] 3.3 运行 SiYuan 宿主或等价 smoke，确认对外 API 与用户可见行为未变化。

## 4. Review and closure

- [ ] 4.1 汇总内部重构结果、保留的 API 契约和已知风险。
- [ ] 4.2 审计是否存在任何对外 API 破坏；如有，拆分成新变更。
- [ ] 4.3 更新证据日志，准备后续 apply/archiving 流程。
