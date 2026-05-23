## 1. Contract baseline

- [x] 1.1 记录当前公共 API 基线：插件入口、`plugin.json`、workspace package 导出、关键配置字段、存储路径和运行时行为。
- [x] 1.2 记录当前构建与测试基线：各 package 的 build/lint/test 脚本与可复现命令。
- [x] 1.2.1 记录 direct `eval` / `eval("require")` 构建告警基线，包括 `vm-browserify`、`zhi-siyuan-picgo/dist/index.js` 和 `stream` 动态 require 的引入链。
- [x] 1.3 明确“不可变对外 API”清单，写入验证日志。
- [x] 1.4 记录 package role 基线：区分插件产品入口、Vue app、Siyuan integration lib、PicGo core、store、host adapter、build script。
- [x] 1.5 记录当前 product/lib 冲突证据：`zhi-siyuan-picgo/src` 深层 import、UI 依赖进入 lib、`win/hasNodeEnv` 转出口、静态单例、core 构造副作用、npm 插件管理进入 core。
- [x] 1.6 记录当前粘贴上传时序缺陷：paste 事件未阻断默认行为、PicGo 先上传、SiYuan `uploadAsset` 二次上传、`JsTimer` 轮询、DOM 查询、block markdown 后置替换。

## 2. Internal architecture cleanup

- [x] 2.1 梳理 `picgo-plugin-bootstrap`、`picgo-plugin-app`、`Universal-PicGo-Core`、`Universal-PicGo-Store`、`zhi-siyuan-picgo` 的职责边界。
- [x] 2.1.1 设计运行时能力矩阵，明确浏览器 bundle、SiYuan/Electron 宿主侧、Node 构建期、测试环境的允许能力和禁止能力。
- [x] 2.1.2 明确依赖输入策略：内部强耦合包优先走源码/条件导出/facade，禁止把 opaque dist bundle 作为架构边界。
- [x] 2.1.3 设计 product/library 分层：product shell、Siyuan adapter、application facade、domain core、store port、host adapter 的职责与依赖方向。
- [x] 2.1.4 明确哪些能力不得进入 lib 主入口：Vue/Element Plus UI helper、Electron remote 菜单、SiYuan DOM 查询、npm 插件安装、配置迁移副作用。
- [x] 2.2 收敛跨包深层 import，提炼稳定 facade / orchestrator。
- [x] 2.2.0 移除或隔离 `zhi-siyuan-picgo/src` 深层 import，补齐 `replaceImageLink` 等被产品使用能力的正式公共入口或内部 adapter。
- [x] 2.2.1 将需要 Node/宿主能力的逻辑收敛到显式适配层，禁止浏览器目标通过 `eval("require")`、`vm-browserify` 或隐式 polyfill 获取能力。
- [x] 2.3 清理重复逻辑与隐式状态依赖，避免外部行为变化。
- [x] 2.3.1 梳理 `SiyuanPicGo` 静态单例、`picgoEventBus`、`UniversalPicGo` 构造初始化副作用，定义显式 ownership/lifecycle/reset 策略。
- [x] 2.3.2 将 UI 设置 helper、PicGo 插件商店/npm 管理、Siyuan 配置迁移从通用 lib 主入口中隔离到 product 或 host adapter 层。
- [x] 2.4 制定并落地 bundle 审计门禁：目标产物不得出现未解释的 direct `eval`、`new Function`、动态 require、Node polyfill 泄漏。
- [x] 2.5 制定 package manifest/export 策略：明确 public/internal exports、条件入口、禁止深层 `src` import、插件产品构建与 lib 发布构建的输入差异。
- [x] 2.6 设计粘贴上传 ownership：启用自动上传时必须先调用真实宿主事件的默认行为阻断能力（如 `source.preventDefault()`），再由插件单事务处理上传和文档写入。
- [x] 2.7 移除粘贴自动上传主路径中的双上传/后置补偿设计：不得继续依赖 SiYuan `uploadAsset`、等待默认 asset 出现、DOM 查询和 markdown 偷换作为正常路径。
- [x] 2.8 设计粘贴失败回滚语义：PicGo 上传失败、文档写入失败、元数据写入失败时必须有明确用户可理解结果，禁止半成功状态。
- [x] 2.9 设计 `PasteEventAdapter`：集中解析真实 SiYuan paste event、同步判断 takeover 条件、在任何异步上传前调用 `source.preventDefault()` 或等价阻断能力。
- [x] 2.10 设计 `PasteUploadTransaction`：作为粘贴自动上传唯一 use case，串联输入快照、PicGo 上传、文档写入、元数据提交、通知和回滚。
- [x] 2.11 设计 `DocumentMutationPort`：阻断默认粘贴后通过明确编辑器/块事务写入最终图床链接，不依赖默认本地 asset、DOM 查询或 markdown 后置偷换推导目标块。
- [x] 2.12 设计 `MetadataRepository` 与提交顺序：只基于同一个 transaction result 写 `custom-picgo-file-map-key`，文档写入失败时不得提交远端/本地混合映射。
- [x] 2.13 明确旧剪贴板补偿路径删除计划：`ignoreReplaceLink=true` 旁路、`siyuanApi.uploadAsset(formData)` 二次上传、`JsTimer` 轮询、`document.querySelector(img[src])` 在自动粘贴主路径中必须移除而不是包裹。
- [x] 2.14 做真实宿主插入 API spike：验证阻断默认粘贴后如何把最终图床 markdown/DOM 插入当前光标或目标块；未验证成功前不得回退到默认 asset 中转设计。

## 3. Contract protection and verification

- [x] 3.1 为公共导出与关键运行时行为补充契约测试。
- [x] 3.1.1 增加 package role/依赖方向检查：lib 主入口不得 import 产品 UI、Electron-only helper 或 SiYuan DOM；product 代码不得深层 import lib `src`。
- [x] 3.2 跑各 package 的 build / lint / test 基线，并记录差异。
- [x] 3.2.1 跑 Rolldown/Vite 等构建并检查产物审计结果，确认 direct `eval` 类告警不是被 ignore/alias 掩盖，而是通过运行时边界与依赖策略消除或被明确隔离。
- [x] 3.2.2 分别验证插件产品 bundle 与可发布 lib bundle：两者不得依赖同一份未区分 target 的胖入口作为唯一事实来源。
- [ ] 3.3 运行 SiYuan 宿主或等价 smoke，确认对外 API 与用户可见行为未变化。
- [ ] 3.3.1 运行真实 SiYuan 粘贴 smoke：证明 `source.preventDefault()` 或等价机制实际阻断默认粘贴/内部上传，不能只用 mock。
- [ ] 3.3.2 验证粘贴图片只产生一个插件-owned 事务：不产生未管理的默认本地 asset，不需要轮询等待，不需要后置偷换链接，元数据与最终文档链接一致。
- [ ] 3.3.3 验证粘贴失败路径：PicGo 上传失败、文档写入失败、元数据提交失败分别进入设计好的 bounded rollback 状态，不留下本地 asset/远端 URL/metadata 半成功混合状态。

## 4. Review and closure

- [x] 4.1 汇总内部重构结果、保留的 API 契约和已知风险。
- [x] 4.2 审计是否存在任何对外 API 破坏；如有，拆分成新变更。
- [x] 4.3 更新证据日志，准备后续 apply/archiving 流程。
