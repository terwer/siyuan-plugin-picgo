# 进度日志

## 2026-05-22

- 创建计划：`2026-05-22-picgo-architecture-exploration`。
- 用户要求：全量探索代码，禁止凭空判断；重点分析“插件”和“打包 lib”打架的根本架构缺陷，并写入 `picgo-internal-refactor` OpenSpec。

## 2026-05-22 阶段 1 执行日志

- 已读取根 `package.json`、`pnpm-workspace.yaml`、`turbo.json`、`plugin.json` 和各 workspace `package.json`。
- 记录错误：尝试读取根 `plugin.js` 失败，原因是根目录当前不存在该文件。这不是结论，后续需追踪构建产物生成路径。
- 下一步：扫描各包源码入口、vite/tsconfig/scripts，建立实际依赖与入口图。

## 2026-05-22 阶段 1 补充执行日志

- 已读取所有包的 `vite.config.ts`、`tsconfig*.json` 和 app 构建脚本。
- 发现 lib 包默认 `external: []`、Core/Store 使用 `vite-plugin-node-polyfills`，这是插件/lib 打架与 eval/polyfill 泄漏的重要候选根因。
- 下一步改用 Python 提取 import 图，并阅读各包入口文件。

## 2026-05-22 阶段 1/2 执行日志

- 已用 Python 提取 import 图，避免重复 PowerShell 正则失败。
- 已阅读关键入口：`Universal-PicGo-Core/src/index.ts`、`UniversalPicGo.ts`、`nodePolyfill.ts`、`nodeUtils.ts`、`Universal-PicGo-Store/src/index.ts`、`JSONStore.ts`、`zhi-siyuan-picgo/src/index.ts`、`siyuanPicgo.ts`、`picgo-plugin-bootstrap/src/index.ts`、`picgo-plugin-app/src/main.ts`。
- 下一步：深入读取 `zhi-siyuan-picgo` 的 post/upload/helper/parser，以及 app composables/stores，确认插件产品逻辑和 lib API 如何互相缠绕。

## 2026-05-22 阶段 2/3 执行日志

- 已分段读取 `siyuanPicGoUploadApi.ts` 与 `picgoHelper.ts`，避免依据截断输出判断。
- 已确认 `zhi-siyuan-picgo` 混入 Vue、Element Plus、Electron remote、Siyuan API、UniversalPicGo 生命周期、配置迁移和插件管理职责。
- 下一步：阅读 Core plugin loader/handler、uploaders、store runtime 探测，以及 app settings/stores，继续补全构建与 runtime 边界证据。

## 2026-05-22 阶段 3/4 执行日志

- 已读取 `PluginLoader.ts`、`PluginHandler.ts`、clipboard electron/browser、部分 uploader import 分支。
- 记录错误：一次 Python 文件列表脚本漏写 `for` 冒号导致 SyntaxError；已改写后成功读取。
- 记录限制：当前工作区未发现用户日志中的 `node_modules/.pnpm/...` 路径，无法本地读取对应 published dist；后续 OpenSpec 仍以用户提供的构建告警和当前源码配置作为证据来源。
- 下一步：重新运行更聚焦的 runtime/deep import scan，随后更新 OpenSpec。

## 2026-05-22 阶段 3/4 补充执行日志

- 已完成全仓 runtime/deep import/pattern 扫描。
- 已确认当前 git 变更只有 `.planning/` 未跟踪，以及之前 OpenSpec 修改仍在工作区；无实现代码修改。
- 下一步：读取 app settings/stores、bootstrap 辅助入口、发布/version 脚本，补齐插件产品链路证据；随后更新 OpenSpec。

## 2026-05-22 阶段 2/3/4 完成日志

- 已完成仓库拓扑、插件产品链路、可打包 lib 链路、构建/bundle 边界的证据探索。
- 已将核心证据写入 `findings.md`。
- 当前进入阶段 5：基于证据更新 `openspec/changes/picgo-internal-refactor`。

## 2026-05-22 阶段 5/6 完成日志

- 已更新 `openspec/changes/picgo-internal-refactor/proposal.md`：加入插件产品/lib 双身份冲突、胖 lib、深层 import、UI/宿主能力泄漏的顶层问题描述。
- 已更新 `openspec/changes/picgo-internal-refactor/design.md`：加入 `Current Code Evidence`、新增决策 8-11、风险、迁移计划与开放问题。
- 已更新 `openspec/changes/picgo-internal-refactor/tasks.md`：加入 package role 基线、product/lib 冲突证据、分层设计、深层 import 隔离、lifecycle ownership、manifest/export 策略与依赖方向检查。
- 已新增 `openspec/changes/picgo-internal-refactor/specs/picgo-product-library-boundary/spec.md`。
- 已校验 OpenSpec：通过。

## 2026-05-22 追加需求：粘贴上传时序缺陷

用户补充事实：之前为了避开思源笔记已有的“粘贴即触发内部 API/上传”行为，采用了 hack 式上传两次/后置替换方案；这被认为是最差设计，导致上传时序非常混乱。用户认为正确方向是在上传接管时调用 `source.preventDefault()`，从源头阻止思源默认粘贴处理。

本阶段要求：不能直接按用户结论写；必须先深度阅读当前 paste/upload 链路，搞懂事件对象、默认行为、插件上传、轮询替换、元数据更新之间的关系，再写 OpenSpec。

## 2026-05-22 阶段 7 执行日志

- 已分段阅读 `packages/picgo-plugin-bootstrap/src/index.ts` 的 paste listener、`handleAfterUpload`、`doUpdatePictureMetadata`、菜单上传路径。
- 已阅读 `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts` 的 `uploadSingleImageToBed`、`ignoreReplaceLink` 分支、`setBlockAttrs` 和链接替换逻辑。
- 已确认当前源码中生产 paste 链路没有 `preventDefault`；唯一 `preventDefault` 是 `DragUpload.vue` 中已注释的浏览器 paste 旧代码。
- 已确认当前剪贴板主路径包含 PicGo 上传 + SiYuan `uploadAsset` + 定时轮询 + DOM 查询 + block markdown 替换。
- 下一步：把“paste ownership / default behavior interception / single transaction”写入 OpenSpec。

## 2026-05-22 阶段 7 OpenSpec 强化日志

- 已按用户要求把粘贴问题从“补一行 preventDefault”提升为产品级架构缺陷：旧链路事务起点、文档写入和回滚对象都不属于插件，因此不可控。
- 已更新 `openspec/changes/picgo-internal-refactor/proposal.md`：补充 `PasteUploadTransaction`，明确要证明不再依赖 SiYuan 默认本地 asset 作为中转事实源。
- 已更新 `openspec/changes/picgo-internal-refactor/design.md`：新增 `Future Paste Upload Architecture`，定义 `PasteEventAdapter`、`PasteUploadTransaction`、`PicGoUploadService`、`DocumentMutationPort`、`MetadataRepository`、`RollbackPolicy`，并写明旧链路只能删除/隔离，不能 fallback。
- 已更新 `openspec/changes/picgo-internal-refactor/tasks.md`：新增 2.9-2.14 与 3.3.3，要求真实宿主插入 API spike、删除旧补偿路径和验证失败回滚。
- 已更新 `openspec/changes/picgo-internal-refactor/specs/picgo-paste-upload-ownership/spec.md`：新增“按事务边界重写”“旧补偿路径删除而非包裹”“先设计回滚再实现”需求。
- 未修改任何实现代码。

## 2026-05-22 阶段 8 校验日志

- 已运行：`openspec validate picgo-internal-refactor --strict`
- 结果：`Change 'picgo-internal-refactor' is valid`
- 已将阶段 7/8 标记完成。
