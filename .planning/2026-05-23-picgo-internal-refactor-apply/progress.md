# 进度日志

## 2026-05-23

- 创建实施计划：`2026-05-23-picgo-internal-refactor-apply`。
- 已读取 OpenSpec apply instructions：schema 为 `spec-driven`，总任务 41，当前 0/41 完成。
- 已读取 proposal/design/specs/tasks 上下文。
- 下一步：完成任务 1.1-1.6 的基线记录，并创建持久化验证日志/证据文件。

## 2026-05-23 阶段 1 追加日志

- 已读取根 `package.json`、`plugin.json`、`pnpm-workspace.yaml`、`turbo.json` 和各 workspace `package.json`。
- 已确认当前公开 package：根插件 `siyuan-plugin-picgo@1.12.1`，libs 下 `universal-picgo`、`universal-picgo-store`、`zhi-siyuan-picgo`，packages 下 `picgo-plugin-app` 与 `picgo-plugin-bootstrap`。
- 已确认插件 manifest 合同：根 `plugin.json`，插件名 `siyuan-plugin-picgo`，版本 `1.12.1`，minAppVersion `2.9.0`，backends/frontends/displayName/description/readme/i18n/funding 当前不应变更。
- 已确认主要公共导出入口：三个 lib 的 `src/index.ts`；bootstrap 插件入口是 `packages/picgo-plugin-bootstrap/src/index.ts` 默认导出的 `PicgoPlugin extends Plugin`。
- 发现 `zhi-siyuan-picgo` 已经从主入口导出 `replaceImageLink`，因此 bootstrap 当前的 `zhi-siyuan-picgo/src` 深层 import 可用公共入口替代。

## 2026-05-23 阶段 1 完成日志

- 新增 `openspec/changes/picgo-internal-refactor/verification-log.md`，记录：
  - 插件 manifest/product entry 公共契约。
  - 三个 workspace published package 的当前 public exports。
  - 配置 key、默认值、metadata key、存储路径和 legacy migration 路径。
  - 各 package build/lint/test 可复现命令和 build graph。
  - direct `eval` / `eval("require")` 告警基线与引入链。
  - package role baseline、product/library 冲突证据、paste 双上传/轮询/DOM 补偿证据。
  - 不可变对外 API 清单。
- 已勾选 OpenSpec 任务 1.1、1.2、1.2.1、1.3、1.4、1.5、1.6。
- 当前进入阶段 2：架构边界设计与文档落地。

## 2026-05-23 阶段 2/3 部分完成日志

- 新增 `packages/picgo-plugin-bootstrap/src/paste/PasteEventAdapter.ts`：集中解析 SiYuan paste event，检查 `detail.files`/`protyle`/文本字段，负责 `preventDefault`/`detail.resolve(empty-paste-payload)` 以及 `PasteInputSnapshot`。
- 新增 `packages/picgo-plugin-bootstrap/src/paste/PasteUploadTransaction.ts`：集中编排自动粘贴上传事务，包含 `DocumentMutationPort`、`MetadataRepository`、PicGo 上传、文档写入、metadata commit、失败 bounded message。
- 重写 `packages/picgo-plugin-bootstrap/src/index.ts` 的 paste listener：只负责获取 `SiyuanPicGo`、调用 `PasteEventAdapter` 与 `PasteUploadTransaction`；已删除旧 paste 主路径中的 `handleAfterUpload`、`doUpdatePictureMetadata`、`JsTimer`、`siyuanApi.uploadAsset(formData)`、DOM asset 反查补偿。
- 修改 `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts`：`ignoreReplaceLink=true` 时不再写通用 fileMap metadata，改由调用方事务拥有文档写入和元数据提交。
- 更新 `openspec/changes/picgo-internal-refactor/verification-log.md`：补充 package boundary、runtime capability matrix、dependency input strategy、product/library layering、lifecycle ownership、bundle audit gate、package export strategy、paste ownership/rollback/host insertion spike。
- 已移除产品源码中的 `zhi-siyuan-picgo/src` 深层 import；`replaceImageLink` 不再在 bootstrap 中使用，右键上传仍走 `zhi-siyuan-picgo` 公共入口能力。
- 已勾选 OpenSpec 任务：2.1-2.2.0、2.3-2.3.1、2.4-2.14。
- 暂未勾选：2.2.1、2.3.2，因为需要进一步通过依赖方向/产物审计验证 Node/宿主能力与 UI/npm helper 是否已充分隔离。

## 2026-05-23 当前会话恢复日志

- 已恢复活跃计划与 OpenSpec 状态：`picgo-internal-refactor` schema 为 `spec-driven`，当前 29/41 任务完成。
- 已重新读取 proposal/design/specs/tasks；剩余重点为 2.2.1、2.3.2、3.2.x、3.3.x、4.x。
- 已确认本地已存在 paste 事务改造、审计脚本与部分任务勾选；当前 bundle audit 仍是主要阻塞，需继续定位 `file-type`、Node polyfill、`new Function`、dev-only eruda/zhi-infra 等产物来源。
- 决策：先修可控的 core S3/file-type 引入与审计误报/例外策略，再重跑构建与审计；真实 SiYuan 宿主 smoke 若本地无自动化证据则不勾选 3.3 系列。

## 2026-05-23 bundle audit 修复阶段启动

- 已按 `openspec-apply-change` 重新读取 proposal/design/specs/tasks；当前剩余任务仍为 2.2.1、2.3.2、3.2.x、3.3.x、4.x。
- 已检查 `scripts/picgo-internal-refactor-audit.cjs`、Core/Store/App Vite 配置、S3 uploader/utils、app i18n 入口。
- 当前可落地修复点：
  - 移除 `file-type`，避免 `eval("require")("stream")` 从 `strtok3/token-types` 进入 bundle。
  - `url.URL` 改为全局 `URL`，减少 Node `url` polyfill。
  - Core/Store `nodePolyfills()` 从全量改为 allowlist，禁止 `vm-browserify` 被默认引入。
  - app 使用 `vue-i18n` runtime-only 入口并关闭 message compiler，消除产品 app bundle 中 `new Function` message compiler 来源。
  - 审计脚本将 dev-only `eruda`、host-contained `zhi-infra` 作为显式例外，并减少字符串文本误报。

## 2026-05-23 本轮继续前的确认

- 已确认当前未完成项集中在 `2.2.1`、`2.3.2`、`3.2`、`3.2.1`、`3.2.2`、`4.1`、`4.2`、`4.3`。
- 已定位可直接修改的代码点：`libs/Universal-PicGo-Core/package.json`、`libs/Universal-PicGo-Core/src/plugins/uploader/s3/uploader.ts`、`libs/Universal-PicGo-Core/vite.config.ts`、`libs/Universal-PicGo-Store/vite.config.ts`、`packages/picgo-plugin-app/vite.config.ts`、`packages/picgo-plugin-app/src/i18n/index.ts`、`scripts/picgo-internal-refactor-audit.cjs`。
- 下一步：先做最小代码修复，再跑构建/测试/审计，把结果回写到 `progress.md` 和 `findings.md`。

## 2026-05-23 本轮代码修改日志

- 已完成初步 bundle/runtime 边界修复：
  - `libs/Universal-PicGo-Core/package.json` 删除 `file-type` 依赖，`pnpm install --lockfile-only` 同步锁文件。
  - `libs/Universal-PicGo-Core/src/plugins/uploader/s3/uploader.ts` 删除 Node `url` import，改用标准全局 `URL`。
  - Core/Store Vite `nodePolyfills` 改为显式 include，并排除 `vm`，避免全量 polyfill 自动带入 `vm-browserify`。
  - `packages/picgo-plugin-app/src/i18n/index.ts` 改用 `vue-i18n/dist/vue-i18n.runtime.mjs`，Vite define 增加 intlify flags。
  - `scripts/picgo-internal-refactor-audit.cjs` 增加带 owner/reason/containment 的 bundle 例外：`eruda` devtools 与 `zhi-infra` host npm helper。
- 已做 `zhi-siyuan-picgo` 主入口污染收敛：
  - `libs/zhi-siyuan-picgo/src/lib/utils/utils.ts` 去除 `vue` / `element-plus` 依赖，`copyToClipboardInBrowser` 改为返回 boolean，不直接弹 UI 消息。
  - `packages/picgo-plugin-app/src/components/home/controls/UrlCopy.vue` 在产品层补回 Element Plus 成功/失败消息。
  - `libs/zhi-siyuan-picgo/src/lib/picgoHelper.ts` 去除 `readonly` from `vue`，避免 lib helper 直接依赖 Vue。
- 下一步：运行分包 build/lint/test，处理类型或构建失败，再重跑 `pnpm audit:picgo-refactor`。

## 2026-05-23 依赖收敛追加日志

- `universal-picgo-store` 已去除 `@commonify/lowdb`、`comment-json`、`lodash-es`、`ts-localstorage` 运行时依赖，build 后 `dist/index.js` 从约 426KB 降到约 8.6KB，且不再命中 bundle audit 的 eval/Function 模式。
- 新增 `libs/Universal-PicGo-Core/src/utils/pathObject.ts`，替换 Core 与 `PicgoHelper` 中少量 `lodash-es` 的 `get/set/unset/merge` 用法。
- 发现一次 dts 类型错误：`deepMerge<T>` 内对 generic T 写索引触发 TS2862；已通过 `Record<string, any>` 局部 writable cast 修复。

## 2026-05-23 bundle audit 继续修复日志

- 复跑 `picgo-plugin-app build` 暴露脚本缺陷：`vue-tsc` 报错但 `scripts/build.py` 仍打印成功并返回 0；已改为遇到非零退出码立即 `sys.exit(exit_code)`，避免假成功。
- `vue-i18n/dist/vue-i18n.runtime.mjs` 缺少 TS declaration；已恢复源码 import `vue-i18n`，通过 Vite alias 指向 `vue-i18n/dist/vue-i18n.runtime.esm-bundler.js`，保留 runtime-only bundle 目标。
- 已将 Aliyun uploader 的 Node SDK 路径隔离：`index.ts` 不再静态导入 `./node` / `ali-oss`，内部 `node.ts` 保持 `handleNode` 名称但委托 `handleWeb`，避免 `ali-oss` 的 core-js/lodash 动态 global fallback 进入通用 bundle。
- 已从 Core package 删除 `ali-oss` 运行时依赖；从 app 删除 `lodash-es` 直接依赖并用局部 `debounce` / clone / unique 替代；从 Store 删除遗留 `@types/lodash-es` dev 依赖。
- 审计例外补全：`eruda` 隔离目录允许 `eval(require)`，仍带 owner/reason/containment warning。

## 2026-05-23 产品 bundle 继续收敛日志

- 刷新产品 artifact 后，旧 `index-BVaxH0su.js` 因 `emptyOutDir=false` 残留导致 bundle audit 继续失败；已在 app build 脚本中构建前清理 `artifacts/.../dist/assets/index-*.js/css`，保留非 app 静态资源。
- 最新 app bundle 只剩一个 `Function("return this")`，来源为 Element Plus 通过 `lodash-unified -> lodash-es` 引入的 legacy root fallback；已新增产品层 alias `lodash-unified -> src/lib/lodashUnifiedSafe.ts`，提供 Element Plus 运行所需的小型 helper 子集，避免浏览器产品 bundle 拉入 lodash-es root fallback。

## 2026-05-23 错误记录

- `picgo-plugin-app build` 第一次验证新 `lodashUnifiedSafe.ts` 失败：TS2538，`Reflect.ownKeys()` 返回 symbol 时不能直接用作普通索引；已改为 `Record<PropertyKey, any>` 局部 cast 后索引。

## 2026-05-23 bundle audit 通过日志

- `pnpm --filter picgo-plugin-app build` 通过，刷新 app artifact 为 `assets/index-CMgDeYZF.js` / `assets/index-D8I1eYGF.css`；构建前清除了旧 `index-*.js/css`，避免 stale artifact 误审。
- `pnpm --filter picgo-plugin-bootstrap build` 通过，刷新 `artifacts/siyuan-plugin-picgo/dist/index.js`。
- `pnpm audit:picgo-refactor bundle` 通过；输出仅保留两个 approved warning：`eruda devtools runtime` 与 `zhi-infra host npm helper`，均带 owner/reason/containment。

## 2026-05-23 契约测试补充日志

- 新增 `libs/Universal-PicGo-Store/src/lib/JSONStore.spec.ts`：覆盖 dotted path get/set/has/unset、localStorage JSON 损坏回退、Node-like JSON-with-comments 读取与标准 JSON 写入。
- 新增 `libs/Universal-PicGo-Core/src/utils/pathObject.spec.ts`：覆盖新增 path object helpers 的 get/set/unset/deepMerge 行为。
- 新增 `libs/Universal-PicGo-Core/src/plugins/uploader/s3/utils.spec.ts`：覆盖移除 `file-type` 后的 data URL 与 PNG/JPEG/GIF/SVG MIME sniff。
- 第一次 Node-like JSONStore spec 因 fake host 缺少 `win.process.pid` 触发 `writeFileAtomic` 错误；已补 fake `process/__filename/ArrayBuffer` 和同步 fs 原语，避免重复失败。

## 2026-05-23 验证错误记录

- 全量 build 后 `vite-plugin-dts` 报 `JSONStore.spec.ts` 中 `vi.fn(() => 1)` 被推断为零参数 mock，访问 `mock.calls[0][0]` 触发 TS2493；已把 fake `openSync/writeSync` 改为显式参数函数，并通过 `memfs.get("last-open")` 断言临时文件名，避免 dts 类型错误。

## 2026-05-23 OpenSpec 任务更新日志

- 已更新 `verification-log.md`，补充 runtime/bundle/product-library 修复、approved exceptions、最终 build/lint/test/audit 证据、直接 artifact probe 表和未完成 host smoke 风险。
- 已勾选 OpenSpec 任务：`2.2.1`、`2.3.2`、`3.2`、`3.2.1`、`3.2.2`、`4.1`、`4.2`、`4.3`。
- 保持未勾选：`3.3`、`3.3.1`、`3.3.2`、`3.3.3`，原因是当前环境未运行真实 SiYuan 宿主 smoke，不能用 mock 或静态审计代替。
## 2026-05-23 当前继续会话日志

- 已按 `openspec-apply-change` 恢复状态：`picgo-internal-refactor` schema=`spec-driven`，OpenSpec 当前 37/41，剩余仅 `3.3`、`3.3.1`、`3.3.2`、`3.3.3`。
- 已读取 proposal/design/spec/tasks 与当前计划文件。
- 本机存在运行中的 SiYuan 进程，`http://127.0.0.1:6806/api/system/getWorkspaces` 可访问，当前打开 workspace 为 `D:\Users\Administrator\Documents\mydocs\SiyuanWorkspace\public`，另有 closed 的 `test` workspace。
- 当前 workspace 已安装旧版 `data/plugins/siyuan-plugin-picgo`，不是指向本仓库 artifact 的符号链接；如要做真实宿主 smoke，需要先做备份/可逆部署，避免污染用户现有插件目录。
- 未勾选 3.3 系列；下一步优先设计最小、可回滚的宿主 smoke 路径，避免直接改用户文档或覆盖插件而无备份。
## 2026-05-23 宿主探测错误记录

- 为查找是否存在插件热加载 API，误把 `/api/system/reloadUI` 与 `/api/system/exit` 放进只读探测列表；`/api/system/exit` 返回 `code=0` 后停止了当前 SiYuan kernel，随后 `127.0.0.1:6806` 拒绝连接。
- 这是本轮错误；后续不再对未知 SiYuan API 做批量 POST 探测，尤其排除 reload/exit/uninstall/delete 类端点。若继续宿主 smoke，必须只使用已知最小 API 或人工 UI 步骤，并先备份现有插件目录。
## 2026-05-23 宿主 smoke 暂停日志

- 当前 `SiYuan.exe` UI 进程仍在，但 `SiYuan-Kernel.exe` 不在，`127.0.0.1:6806` 无监听；`/api/system/version` 拒绝连接。
- 尝试用 `SiYuan-Kernel.exe --port 6806 --workspace <public> --wd <resources>` 启动 kernel 未在 60 秒内恢复 HTTP API，且未获得可证明的宿主加载/粘贴行为证据。
- 因此 3.3 系列仍保持未完成；本轮不能继续自动化宿主 smoke，避免对真实 workspace/plugin 安装做不可逆覆盖或进一步 API 误操作。
- 若继续 smoke，建议用户先手动重启 SiYuan，确认 `http://127.0.0.1:6806/api/system/version` 恢复；然后在备份 `data/plugins/siyuan-plugin-picgo` 后再部署 artifact，并优先使用人工/浏览器观察粘贴行为证据。
## 2026-05-23 收尾验证日志

- 重新运行 `pnpm audit:picgo-refactor`：通过，输出为 `contract: ok`、`boundaries: ok`、`bundle: ok`。
- approved exceptions 仍只有 `eruda devtools runtime` 与 `zhi-infra host npm helper`，均带 owner/reason/containment。
- OpenSpec 仍为 37/41；未完成项仅真实宿主 smoke，不因静态审计或 mock 验证而勾选。
## 2026-05-23 文档判断与更新

- 已检查 `DEVELOPMENT.md`：原有构建流程仍可继续使用（install → build required packages → package），本次重构没有改变正常构建命令。
- 仅补充了验证周期建议：增加 `pnpm audit:picgo-refactor`，并注明真实 SiYuan 宿主 smoke 只能在 `test` 工作空间手工执行。
- 未改动构建脚本本身，避免把测试周期文档变化误当成流程破坏。
## 2026-05-23 外部分发说明补充

- 用户指出原 `DEVELOPMENT.md` 只覆盖思源本地开发，容易忘记外部发版路径。
- 已补充 release/external delivery 小节：
  - `pnpm package` 生成 `build/package.zip` 作为外部分发物；
  - `artifacts/siyuan-plugin-picgo/dist` 仅是本地 dev bundle；
  - `pnpm makeLink` 仅用于本地 SiYuan workspace 开发，不是发版；
  - 正式版本更新建议先 `pnpm prepareRelease` 再 `pnpm package`。
- 构建流程本身未改变，只是把“本地开发”和“外部分发”明确分开。
## 2026-05-23 artifacts structure 澄清

- 用户指出 `artifacts structure` 说明不清楚。
- 已把 `DEVELOPMENT.md` 中的结构改成明确分区：
  - `build/`：发布压缩包，包含 `package.zip` 与 `siyuan-plugin-picgo-<version>.zip`；
  - `artifacts/siyuan-plugin-picgo/dist/`：本地 dev/smoke bundle。
- 同时补充了三条注释：
  - `siyuan-plugin-picgo-<version>.zip` 是 `pnpm package` 生成的版本化归档；
  - `package.zip` 是同一发布包的便捷取名；
  - `artifacts/.../dist` 仅用于本地开发和宿主 smoke。
## 2026-05-23 文档重写：按三条链路拆分

- 用户明确要求不要把 SiYuan 测试、正式发版、外部 lib 发布混在一起。
- 已重写 `DEVELOPMENT.md`，改为三条清晰链路：
  - 本地调试：`makeLink` + `test` 工作空间；
  - 插件正式发版：`prepareRelease` → build 相关包 → `package`；
  - 外部 lib 发布：分别 build / publish `universal-picgo`、`universal-picgo-store`、`zhi-siyuan-picgo`。
- 已去掉单独的 `SiYuan smoke` 小节，改成“本地调试”里的手工验证步骤，避免把调试、测试、发版职责混写。
## 2026-05-23 文档结构再整理

- 用户指出问题不只是开头措辞，而是整份 `DEVELOPMENT.md` 的结构混乱。
- 已按功能重排为六节：
  1. 安装依赖
  2. 本地调试
  3. 插件正式发版
  4. 外部 lib 发布
  5. 产物结构
  6. 检查与清理
- 已去除“部署”类聊天式语气，改为纯操作说明与产物说明。
## 2026-05-23 外部 lib 发布命令直接化

- 用户要求外部库发布命令必须能从仓库根目录直接执行，不要再写“进入对应包目录”。
- 已把 `DEVELOPMENT.md` 的外部 lib 发布段改成 `pnpm --dir <path> build/publish` 的根目录直执行形式，避免额外切目录步骤。
## 2026-05-23 makeLink Python 3.12 兼容修复

- 用户执行 `pnpm makeLink` 失败：`ModuleNotFoundError: No module named 'distutils'`。
- 根因：当前 Python 版本不再内置 `distutils`，而 `scripts/scriptutils.py` 顶层 import 了 `distutils`。
- 已将 `cp_file`、`mv_file`、`mkdir` 改为标准库 `shutil.copy2`、`shutil.move`、`os.makedirs`。
- 已用 `python -c "import sys; sys.path.insert(0, 'scripts'); import scriptutils"` 验证 import 通过；未自动执行 `pnpm makeLink`，避免替用户选择/修改 SiYuan 工作空间。
## 2026-05-23 DEVELOPMENT 测试步骤补充

- 用户要求在修复 `makeLink` 后，把插件测试与外部 lib 测试步骤整理回 `DEVELOPMENT.md`。
- 已新增 `## 5. 测试步骤`：
  - `5.1 插件测试`：build app/bootstrap/lib、跑 `audit:picgo-refactor`、执行 `makeLink`、只选 `test` 工作空间、手工检查插件加载/设置页/粘贴/右键上传。
  - `5.2 外部 lib 测试`：三个库包分别执行 `vitest run`、`build`、`pack`。
  - `5.3 最小通过标准`：列出 audit、库测试、库构建、插件构建、`test` 工作空间手工验证。
## 2026-05-23 构建 warning 判定说明

- 用户贴出 `pnpm build -F universal-picgo` 输出，实际结果为 `Tasks: 2 successful`，不是测试失败。
- 输出中的 `Module "... " has been externalized for browser compatibility` 是已知 Vite warning，不等于命令失败。
- 已在 `DEVELOPMENT.md` 增加 `5.4 构建结果判定`，说明以 `Tasks: ... successful`、无 `ELIFECYCLE`/exit code 失败为通过，并以 `pnpm audit:picgo-refactor` 作为动态代码与边界检查依据。
## 2026-05-23 externalized warning 改为必须修复

- 用户明确要求 `path/fs/http/vm externalized for browser compatibility` 不能忽略。
- 已回滚文档中的“warning 不等于失败即可通过”表述，改为这些 warning 不应出现在最终验证输出中。
- 已完成代码修复：
  - `@picgo/i18n` 主入口替换为本地 `simpleI18n`，避免 `file-sync` 的 `fs/path` re-export 进入 bundle。
  - `mime-types` 改为 `lookupMimeType()` + `mime`，避免 CommonJS `path.extname`。
  - S3 request handler 去掉 `https.Agent` 静态 import，避免 `https-browserify -> http`。
  - Core hash/HMAC 从 Node `crypto` 改为 `cryptoUtil`，使用 `js-md5` + `hash.js`。
  - Core Vite `nodePolyfills` 移除 `crypto` include，避免 `asn1.js -> vm`。
- 验证：
- `pnpm build -F universal-picgo` 通过。
- 捕获日志检查显示四条均 absent：`path`、`fs`、`http`、`vm`。
- `pnpm --dir libs/Universal-PicGo-Core exec vitest run` 通过：4 files / 5 tests。
- `pnpm --dir libs/Universal-PicGo-Store exec vitest run` 通过：2 files / 4 tests。
- `pnpm --dir libs/zhi-siyuan-picgo exec vitest run` 通过：2 files / 8 tests。
- `pnpm build -F zhi-siyuan-picgo`、`pnpm build -F picgo-plugin-app`、`pnpm build -F picgo-plugin-bootstrap` 通过。
- `pnpm audit:picgo-refactor` 通过。

## 2026-05-23 MinIO / S3 403 排查结果

- 已用 `chrome-devtools` 登录 MinIO Console：账号 `admin` / `tyw123456`。
- Console 里 bucket `test` 存在，权限显示 `R/W`。
- 直接用 `@aws-sdk/client-s3` 对 `http://127.0.0.1:9000` 做本地验证时：
  - `region=auto` / 空 region 会报 `AuthorizationHeaderMalformed`，提示期望 region 为 `local-win-home`。
  - `region=local-win-home` 时，`ListObjectsV2` 与 `PutObject` 都成功。
- 结论：当前插件的 403 不是账号密码问题，主要是 **S3 region 配错**；需要把 PicGo 的 S3 配置里的 `region` 改成 `local-win-home`，再测 `endpoint=http://127.0.0.1:9000`、`pathStyleAccess=true`。

## 2026-05-23 MinIO 403 二次自证记录

- 已从真实运行配置读取 `C:\Users\Administrator\.universal-picgo\picgo.cfg.json`，而不是截图手抄：当前 `picBed.awss3` 的 `bucketName=test`、`region=local-win-home`、`endpoint=http://127.0.0.1:9000`、`acl=public-read`，AccessKeyID 长度 20，SecretAccessKey 长度 40。
- 用该真实配置直连当前 MinIO 做 SDK 测试：`GetBucketLocation`、`ListObjectsV2`、`PutObject(public-read)` 全部返回 `InvalidAccessKeyId` / HTTP 403。
- 用 root 凭据 `admin` / `tyw123456`、同一 `region=local-win-home`、同一 endpoint/bucket、同样 `ACL=public-read` 测试成功，证明 region、bucket、endpoint、public-read ACL 本身可用。
- Docker 容器 `portable-minio-minio-1` 的 `/data/.minio.sys/config/iam` 下没有 users/service-accounts 文件；MinIO Console API `/api/v1/service-accounts` 返回 `[]`。
- 因此前“主要是 region 配错”的判断已废弃；当前证据指向：插件配置里的 access key 不存在于当前 MinIO 实例。

## 2026-05-23 21:18:07 test 工作空间右键上传 smoke 成功

- 用户重启后只确认并操作 D:\Users\Administrator\Documents\mydocs\SiyuanWorkspace\test，当前 kernel 端口为 50077。
- Chrome 页面标题：未命名 - test - 思源笔记 v3.6.5。
- 已刷新 test 页面，使插件重新读取 localStorage['universal-picgo/picgo.cfg.json'] 中的 MinIO S3 配置。
- 右键现有图片 ssets/image-20260520214954-a17143g.png 并点击 上传到PicGo图床：
  - console：Uploading... Current uploader is [awss3]；
  - network：OPTIONS http://127.0.0.1:9000/test/... [204]、PUT http://127.0.0.1:9000/test/... [200]；
  - 页面图片链接替换为 http://127.0.0.1:9000/test/2026/05/ae44fa8b5be668d9235fdfa5d4989cbb.png；
  - 页面提示 🎉图片上传成功。

## 2026-05-23 21:25:24 真实粘贴 smoke 发现默认 asset 竞态并修复阻断时机

- 通过系统剪贴板向 	est 工作空间真实 Ctrl+V 粘贴 	mp/paste-smoke.png。
- 现象：插件进入 paste upload transaction started 并成功 wss3 上传、/api/block/insertBlock 写入远端 markdown，但网络同时出现 POST http://127.0.0.1:50077/upload [200]，页面也出现本地 ssets/image-20260523212039-k3kiexc.png。
- 结论：原实现等到 wait SiyuanPicGo.getInstance(...) 后才调用 	ryTakeover()，默认粘贴阻断太晚。
- 已修改：PasteEventAdapter 新增 	ryTakeoverWithConfig() 与 eadBrowserConfig()，bootstrap listener 在任何 wait 前同步读取 browser localStorage 配置并调用 prevent/resolve。

## 2026-05-23 21:26:09 bootstrap 重建

- 已执行 pnpm build -F picgo-plugin-bootstrap。
- 结果：4/4 tasks successful，刷新了 rtifacts/siyuan-plugin-picgo/dist/index.js，将同步阻断粘贴修复部署到 test 工作空间 symlink 目标。

## 2026-05-23 21:32:56 同步阻断修复复测通过

- 重建后刷新 	est 页面，重新设置系统剪贴板图片 	mp/paste-smoke-2.png 并执行真实 Ctrl+V。
- 结果：
  - console：paste upload transaction started、Uploading... Current uploader is [awss3]、paste image markdown inserted；
  - network：PUT http://127.0.0.1:9000/test/2026/05/83c797ab47b97bcf7de9afb43511a0f3.png [200]、/api/block/insertBlock [200]、/api/attr/setBlockAttrs [200]；
  - network 本轮没有新的 POST http://127.0.0.1:50077/upload；
  - DOM 新增图片为远端 MinIO URL http://127.0.0.1:9000/test/2026/05/83c797ab47b97bcf7de9afb43511a0f3.png，没有新增本地 ssets/image-*.png。
- 已把粘贴与右键上传的落地测试步骤补回 DEVELOPMENT.md。
- 已给 scripts/picgo-internal-refactor-audit.cjs 增加门禁：bootstrap paste listener 必须在 SiyuanPicGo.getInstance 前调用 	ryTakeoverWithConfig。

## 2026-05-23 21:34:51 验证命令补充

- pnpm audit:picgo-refactor 通过：contract/boundaries/bundle 均 ok。
- pnpm --dir libs/Universal-PicGo-Core exec vitest run 通过：4 files / 5 tests。
- pnpm --dir libs/Universal-PicGo-Store exec vitest run 通过：2 files / 4 tests。
- pnpm --dir libs/zhi-siyuan-picgo exec vitest run 通过：2 files / 8 tests。
- pnpm build -F universal-picgo 通过，path/fs/http/vm externalized 四类 warning 均 absent。
- pnpm build -F picgo-plugin-app 与 pnpm build -F picgo-plugin-bootstrap 通过。

## 2026-05-23 21:38:00 失败路径 smoke：PicGo 上传失败通过

- 临时把 browser PicGo S3 配置的 AccessKey 改成 INVALID_ACCESS_KEY_FOR_SMOKE，刷新 test 页面后真实 Ctrl+V 粘贴 	mp/paste-smoke-fail-upload.png。
- 结果：
  - network：MinIO PUT ...55efc727cb195be2b0aa91558eebce49.png [403]；
  - network：本轮没有新的 POST http://127.0.0.1:50077/upload，没有 /api/block/insertBlock，没有 /api/attr/setBlockAttrs；
  - UI/console：提示 图片上传失败，已阻断默认粘贴且未写入文档：Error: Request failed with status code 403。
- 结论：上传失败进入 bounded rollback：默认粘贴已阻断，未写入文档，未写 metadata。

## 2026-05-23 21:40:04 失败路径 smoke：文档写入失败通过

- 恢复正确 S3 key 后，用 DevTools 临时拦截 etch('/api/block/insertBlock')，返回 { code: -1, msg: 'SMOKE_INSERT_FAIL' }，再真实粘贴 	mp/paste-smoke-fail-insert.png。
- 结果：
  - MinIO PUT ...7a1e6eb6843cdd5a51134f3cbd274e2d.png [200] 成功，证明进入“已远端上传”阶段；
  - 拦截到 /api/block/insertBlock 后返回失败；
  - 本轮没有新的 SiYuan /upload，没有 /api/attr/setBlockAttrs；
  - DOM 没有新增对应远端图片；
  - UI 提示 图片已上传到图床，但写入文档失败；未写入元数据，请手动复制图床链接处理：Error: SMOKE_INSERT_FAIL。
- 结论：文档写入失败路径 bounded：远端对象可能已存在，但不写文档、不写 metadata，并明确提示用户手动处理远端链接。

## 2026-05-23 21:41:52 失败路径 smoke：元数据写入失败通过

- 用 DevTools 临时拦截 etch('/api/attr/setBlockAttrs')，返回 { code: -1, msg: 'SMOKE_ATTR_FAIL' }，再真实粘贴 	mp/paste-smoke-fail-attrs.png。
- 结果：
  - MinIO 上传成功，新增远端图片 http://127.0.0.1:9000/test/2026/05/4d531c1b1ef58cf1a4812e9bacbe4c88.png；
  - /api/block/insertBlock 成功，文档中插入远端图片；
  - /api/attr/setBlockAttrs 被拦截为失败；
  - 本轮没有新的 SiYuan /upload，没有轮询/二次上传；
  - UI 提示 图片已写入文档，但元数据同步失败；不会启动轮询或二次上传：Error: SMOKE_ATTR_FAIL。
- 结论：元数据失败路径 bounded：最终文档链接保留，metadata 未提交，明确提示且不进入旧补偿链路。

## 2026-05-23 21:44:11 OpenSpec 任务收尾

- 已将 openspec/changes/picgo-internal-refactor/tasks.md 中 3.3、3.3.1、3.3.2、3.3.3 勾选完成。
- 已将 erification-log.md 的旧“host smoke 未完成”风险段替换为真实 	est 工作空间 smoke 证据。
- 已更新计划状态：阶段 5 complete。

## 2026-05-23 22:08:18 移除设置页旧轮询配置

- 用户指出设置页仍显示“轮询间隔/重试次数”，这与新 paste transaction 不再依赖轮询相矛盾。
- 已从 packages/picgo-plugin-app/src/components/setting/PicgoSetting.vue UI 中移除 waitTimeout / etryTimes 两个表单项。
- 保留 onBeforeMount 中的默认值初始化，仅作为旧配置兼容，不再暴露给用户修改。
- 已给 scripts/picgo-internal-refactor-audit.cjs 增加门禁：若设置页再次出现 waitTimeout / etryTimes 的 -model，审计失败。
- 已更新 erification-log.md，明确旧轮询配置隐藏而非继续展示。

## 2026-05-23 22:10:44 设置页 UI 验证通过

- 已执行 pnpm audit:picgo-refactor：通过。
- 已执行 pnpm build -F picgo-plugin-app：通过并刷新 app artifact。
- 在 SiYuan 	est 工作空间打开插件设置页 #/setting?showBack=true，DevTools 读取 iframe 文本确认：
  - hasPolling=false，不再显示 轮询间隔；
  - hasRetry=false，不再显示 重试次数；
  - 仍显示 剪切板自动上传、替换本地连接、当剪切板同时有文字和图片时... 三个有效开关。
