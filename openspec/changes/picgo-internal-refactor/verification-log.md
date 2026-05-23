# picgo-internal-refactor verification log

本日志记录本变更实施期间的基线、契约清单、架构证据和验证结果。除非另有新变更批准，下面列出的“不可变对外 API”不得被本次内部重构破坏。

## 2026-05-23 contract baseline

### Plugin manifest and product entry

- 根 manifest：`plugin.json`
  - `name`: `siyuan-plugin-picgo`
  - `version`: `1.12.1`
  - `minAppVersion`: `2.9.0`
  - `backends`: `windows`, `linux`, `darwin`, `docker`, `android`, `ios`
  - `frontends`: `desktop`, `desktop-window`, `mobile`, `browser-desktop`, `browser-mobile`
  - `displayName`, `description`, `readme`, `i18n`, `funding` 当前均视为 manifest-facing contract。
- 插件产品入口：`packages/picgo-plugin-bootstrap/src/index.ts`
  - default export `PicgoPlugin extends Plugin`
  - 运行时注册 topbar/statusbar/settings、`paste`、`open-menu-image`。
  - 构建目标由 `packages/picgo-plugin-bootstrap/vite.config.ts` 输出到 `artifacts/siyuan-plugin-picgo/dist/index.js`，格式 `cjs`。
- Vue app 入口：`packages/picgo-plugin-app/src/main.ts`
  - 由 bootstrap dialog iframe 打开 `/plugins/siyuan-plugin-picgo/#...`。
  - 构建目标由 `packages/picgo-plugin-app/vite.config.ts` 输出到同一个插件 artifacts 目录。

### Workspace package public exports

当前 package manifest 都只有 `main: ./dist/index.js` 和 `typings: ./dist/index.d.ts`，尚未定义 runtime-specific `exports`。因此下列源入口导出的符号是当前基线：

- `universal-picgo`（`libs/Universal-PicGo-Core/src/index.ts`）
  - runtime/classes: `UniversalPicGo`, `ExternalPicgo`, `picgoEventBus`
  - db: `ConfigDb`, `PluginLoaderDb`, `ExternalPicgoConfigDb`
  - enums/events: `PicgoTypeEnum`, `IBusEvent`
  - utils: `isFileOrBlob`, `calculateMD5`, `isSiyuanProxyAvailable`
  - runtime probes: `win`, `currentWin`, `parentWin`, `hasNodeEnv`
  - types: `IPicGo`, `IImgInfo`, `IPicgoDb`, `IConfig`, `IExternalPicgoConfig`, `IPicBedType`, `IUploaderConfigItem`, `IUploaderConfigListItem`, `IPluginConfig`, `IPicGoPlugin`
- `universal-picgo-store`（`libs/Universal-PicGo-Store/src/index.ts`）
  - `JSONStore`
  - `win`, `currentWin`, `parentWin`, `hasNodeEnv`
  - type `IJSON`
- `zhi-siyuan-picgo`（`libs/zhi-siyuan-picgo/src/index.ts`）
  - PicGo/Siyuan classes: `SiyuanPicGo`, `SiyuanPicgoPostApi`, `PicgoHelper`, `ImageItem`, `ImageParser`, `ParsedImage`
  - constants: `SIYUAN_PICGO_FILE_MAP_KEY`
  - helpers: `copyToClipboardInBrowser`, `generateUniqueName`, `handleConfigWithFunction`, `handleStreamlinePluginName`, `replaceImageLink`, `retrieveImageFromClipboardAsBlob`, `calculateMD5`, `isSiyuanProxyAvailable`
  - PicGo db/enums/runtime re-exports: `ConfigDb`, `ExternalPicgoConfigDb`, `PluginLoaderDb`, `PicgoTypeEnum`, `win`
  - types: `IConfig`, `IExternalPicgoConfig`, `IImgInfo`, `IPicGo`, `IPicGoPlugin`, `IPicgoDb`, `IPluginConfig`

### Persistent configuration and storage contract

- Siyuan/PicGo metadata:
  - `SIYUAN_PICGO_FILE_MAP_KEY = "custom-picgo-file-map-key"`。
  - 该 block attrs value 是 JSON 字符串，key 为 `ImageItem.hash`，value 为 `ImageItem` 形态。
- 设置页当前默认值：
  - `siyuan.waitTimeout ?? 2`
  - `siyuan.retryTimes ?? 5`
  - `siyuan.autoUpload ?? true`
  - `siyuan.replaceLink ?? true`
  - `siyuan.txtImageSwitch ?? false`
- 内置 PicGo 配置由 `ConfigDb(ctx)` 读写，外部 PicGo 配置由 `ExternalPicgoConfigDb(ctx)` 读写。
- 重要配置字段包括但不限于：
  - `picBed.current`, `picBed.uploader`, `picBed.list`, `picBed.<type>`
  - `uploader.<type>.configList`, `uploader.<type>.defaultId`
  - `picgoPlugins.<pluginName>`
  - `siyuan.proxy`
  - `extPicgoApiUrl`, `useBundledPicgo`, `picgoType`
- 当前 `UniversalPicGo` 默认基础目录为 `~/.universal-picgo`（浏览器 fallback 为 `universal-picgo`），默认配置文件为 `picgo.cfg.json`，插件生态状态使用 `package.json` / `package-lock.json` / `node_modules`。
- 兼容迁移路径：
  - legacy config folder: `[workspace]/data/storage/syp/picgo`
  - legacy plugin assets: `[workspace]/data/plugins/siyuan-plugin-picgo/libs/setup` 与 `libs/zhi-infra`

### User-visible runtime behavior baseline

- onload 初始化 topbar/statusbar，并写入状态栏消息。
- `openSetting()` 打开 Vue app 设置页。
- `paste` 事件当前在开启 `siyuan.autoUpload` 时尝试自动上传单张剪贴板图片。
- `open-menu-image` 当前为图片块右键菜单追加“上传到图床”动作；本地图片会拼接 Siyuan API base URL 后上传，远程图片会弹确认后强制上传。
- 设置页继续暴露内置/外部 PicGo 切换、图床配置、插件管理、Siyuan API 设置、粘贴轮询配置等入口。

## 2026-05-23 build and test baseline

当前工作区未安装 `node_modules`，且未发现现有 `dist/` 或 `artifacts/` 输出，因此本节记录可复现命令与静态基线；实际构建结果需在依赖安装后补充。

### Root scripts

- `pnpm clean` → `./scripts/clean.sh`
- `pnpm serve` → `turbo run serve`
- `pnpm dev` → `turbo run dev`
- `pnpm build` → `turbo run build`
- `pnpm lint` → `turbo run lint`
- `pnpm makeLink` → `python scripts/make_dev_link.py`
- `pnpm prepareRelease` → `pnpm syncVersion && pnpm parseChangelog`
- `pnpm package` → `python scripts/package.py`

### Package scripts

- `libs/Universal-PicGo-Core`
  - `pnpm --filter universal-picgo build`
  - `pnpm --filter universal-picgo test`
  - 无 package-level `lint` 脚本。
- `libs/Universal-PicGo-Store`
  - `pnpm --filter universal-picgo-store build`
  - `pnpm --filter universal-picgo-store test`
  - 无 package-level `lint` 脚本。
- `libs/zhi-siyuan-picgo`
  - `pnpm --filter zhi-siyuan-picgo build`
  - `pnpm --filter zhi-siyuan-picgo test`
  - 无 package-level `lint` 脚本。
- `packages/picgo-plugin-app`
  - `pnpm --filter picgo-plugin-app build`
  - `pnpm --filter picgo-plugin-app lint`
- `packages/picgo-plugin-bootstrap`
  - `pnpm --filter picgo-plugin-bootstrap build`
  - `pnpm --filter picgo-plugin-bootstrap test`
  - 无 package-level `lint` 脚本。

### Build graph baseline

- `turbo.json` 中 `build.dependsOn = ["^build"]`，lib 会先于依赖它们的 plugin packages 构建。
- 三个 lib 包均用 Vite lib mode，入口 `src/index.ts`，输出 `dist/index.js`，格式 `es`，并复制 README/package manifest。
- `Universal-PicGo-Core` 与 `Universal-PicGo-Store` 使用 `vite-plugin-node-polyfills`。
- 三个 lib build 的 `rollupOptions.external` 当前均为 `[]`，即倾向把依赖和 polyfill 打入 lib 产物。
- `picgo-plugin-bootstrap` 使用 Vite lib mode 输出 CJS `index.js`，`external: ["siyuan", "process"]`。
- `picgo-plugin-app` 是 Vue/Vite app 构建，输出到插件 artifacts 目录。

## 2026-05-23 eval / dynamic require warning baseline

历史构建告警需要作为架构症状处理，而不是以 alias/ignore 掩盖。当前源码与构建配置给出的引入链如下：

1. `Universal-PicGo-Core` / `Universal-PicGo-Store` 启用 `vite-plugin-node-polyfills` 且 lib build `external: []`。
2. `universal-picgo` 主入口转出 `win/currentWin/parentWin/hasNodeEnv`，内部多处 `win.require("path"|"os"|"fs"|...)`。
3. `zhi-siyuan-picgo` 主入口转出 `universal-picgo` 的 runtime/db/core 能力，并把自身构建为 opaque `dist/index.js`。
4. `picgo-plugin-bootstrap` 与 `picgo-plugin-app` 都消费 `zhi-siyuan-picgo`。
5. 当 bundler 解析到预构建或全量打包过的 `zhi-siyuan-picgo/dist/index.js` / node polyfill / stream fallback 时，会把 `vm-browserify` direct `eval`、`eval(this.code)`、`eval("require")("stream")` 等动态执行/动态 require 模式带入目标 bundle。

当前接受标准：后续构建必须证明目标 bundle 中的 direct `eval`、`new Function`、`eval("require")`、`vm-browserify`、非预期 Node polyfill 已消除或被显式隔离到允许目标；不能仅 suppress warning。

## 2026-05-23 package role baseline

| Package / path | Baseline role | Current boundary risk |
| --- | --- | --- |
| `packages/picgo-plugin-bootstrap` | SiYuan plugin product shell / host event integration | 直接调 `SiyuanPicGo`、深层 import `zhi-siyuan-picgo/src`、paste 补偿编排在入口中 |
| `packages/picgo-plugin-app` | Vue settings/upload UI app | UI store/组件直接持有 PicGo `ctx` 与 `PicgoHelper` |
| `libs/zhi-siyuan-picgo` | Siyuan integration library / current application facade | 同时转出 core/db/runtime，包含 UI helper、Electron menu、配置迁移、Siyuan block mutation、静态单例 |
| `libs/Universal-PicGo-Core` | PicGo domain core plus current plugin ecosystem runtime | 构造即初始化 db/request/builtins/plugin loader；npm 插件管理和 dynamic require 在 core 中 |
| `libs/Universal-PicGo-Store` | Store adapter / runtime probe | `win/hasNodeEnv` 以全局探测方式作为公共 API 暴露 |
| `scripts/*` | Build/release/link scripts | build/package 顺序依赖 artifacts 和 workspace dist 状态 |
| `packages/picgo-plugin-app/public/libs/zhi-infra` | Bundled host/npm helper | 被 `PluginHandler` 从 runtime path 动态 require |

## 2026-05-23 product/library conflict evidence

- 深层 import：`packages/picgo-plugin-bootstrap/src/index.ts` 当前从 `zhi-siyuan-picgo/src` import `replaceImageLink`，绕过 package public contract；同一 symbol 已经由 `zhi-siyuan-picgo` 主入口导出。
- UI 依赖进入 lib：`libs/zhi-siyuan-picgo/src/lib/utils/utils.ts` import `element-plus` 与 `vue`；`picgoHelper.ts` import `readonly` from `vue`。
- Electron/product helper 进入 lib：`PicgoHelper.buildPluginMenu()` 与 `importPlugin()` 通过 `win.require("@electron/remote")` 调菜单/对话框。
- Runtime probe 外泄：`universal-picgo-store` 导出 `win/hasNodeEnv`，`universal-picgo` 再转出，`zhi-siyuan-picgo` 再转出 `win`。
- 静态单例：`SiyuanPicGo.getInstance()` 缓存 `SiyuanPicgoPostApi`。
- Core 构造副作用：`UniversalPicGo` 构造时初始化 config path、zhi npm path、db、plugin handler、request wrapper、built-in uploaders/transformers、第三方 plugin loader。
- npm 插件管理进入 core：`PluginHandler` 通过 bundled `zhi-infra` 执行 npm install/uninstall/update。

## 2026-05-23 paste upload timing defect evidence

当前 `picturePasteEventListener` 没有调用 `detail.source.preventDefault()` 或等价默认行为阻断能力。自动粘贴主路径是：

1. 读取 `detail.files` / `detail.siyuanHTML` / `detail.textHTML` / `detail.textPlain`。
2. 检查 `siyuan.txtImageSwitch`、`siyuan.autoUpload`。
3. 创建 `ImageItem(generateUniqueName(), file, true, "", "")`。
4. 调 `uploadSingleImageToBed(pageId, attrs, imageItem, true, true)`，即 PicGo 先上传且 `ignoreReplaceLink=true`。
5. 进入 `handleAfterUpload()`，按 `siyuan.waitTimeout` / `siyuan.retryTimes` 使用 `JsTimer` 轮询。
6. 每次补偿调用 `siyuanApi.uploadAsset(formData)`，把同一文件上传到 SiYuan assets。
7. 根据 `succMap` 写 `custom-picgo-file-map-key`。
8. 用 `document.querySelector(img[src=...])` 从 DOM 反查 `data-node-id`。
9. `getBlockByID()` 后检查 markdown 包含本地 asset，再 `updateBlock()` 用图床 URL 替换。

该路径有 PicGo remote URL 和 SiYuan local asset 两个事实源，且文档插入依赖宿主默认行为/DOM 时序，不属于插件拥有的单事务。

## Immutable external API list

本次内部重构不得改变：

- 根 `plugin.json` 的 manifest-facing fields。
- 插件默认入口产物名和 SiYuan 加载形态：`index.js` / default plugin class。
- 三个 published package 的现有 package names、`main`、`typings` 和已列 public exports。
- 现有配置 key、默认值语义、存储位置与 legacy migration 兼容性。
- `custom-picgo-file-map-key` 的 block attrs key 与 JSON value 兼容性。
- 用户可见的设置入口、上传入口、右键菜单入口、内置/外部 PicGo 切换语义。

## 2026-05-23 architecture boundary decisions

### Package responsibility boundary

| Layer | Owner | Allowed responsibilities | Forbidden responsibilities |
| --- | --- | --- | --- |
| Product shell | `packages/picgo-plugin-bootstrap` | SiYuan plugin lifecycle, event registration, topbar/statusbar/dialog wiring, product-level application use cases | Deep import library `src`, direct bundle/runtime probing, long compensation scripts inside listeners |
| Vue app | `packages/picgo-plugin-app` | Settings/upload UI, user interaction, display state | Owning host filesystem/runtime probing directly as generic lib behavior |
| Siyuan adapter/application facade | `zhi-siyuan-picgo` plus product adapters | Siyuan API client coordination, PicGo upload facade, models, parser, product-facing helper compatibility | Generic lib main entry absorbing Vue/Element Plus UI helper, Electron remote menus, npm plugin operations, DOM polling |
| Domain core | `universal-picgo` | PicGo upload pipeline, uploader/transformer lifecycle, typed config contract | Product UI, SiYuan DOM, implicit host migration, unbounded npm install/update as constructor side effect |
| Store/ports | `universal-picgo-store` | JSON/local storage adapter and explicit storage port | Public generic runtime escape hatch as architecture boundary |
| Host adapter | bootstrap/app product code or future `host/*` entry | SiYuan/Electron/Node-only capabilities behind explicit adapter | Browser bundle resolving host powers through `eval("require")`, polyfills, or global probes |
| Build scripts | `scripts/*`, package Vite configs | Reproducible product/lib builds and audits | Hiding incompatible runtime behavior with warning suppression |

### Runtime capability matrix

| Target | Allowed | Forbidden |
| --- | --- | --- |
| Browser/plugin renderer bundle | DOM, fetch, File/Blob/FormData, Vue/Element Plus only in app UI, package public facades | `eval`, `new Function`, `eval("require")`, `vm-browserify`, opaque `dist` with Node fallback, direct `win.require` except product-owned host adapter |
| SiYuan/Electron host side | Explicit calls to SiYuan plugin API, kernel API, Electron/Node abilities via named adapter | Leaking host abilities from generic library main entry or static global probes used as public contract |
| Node build scripts | `fs/path/os`, Python scripts, Vite/Turbo tooling | Runtime product logic depending on build-only globals |
| Tests | jsdom mocks and contract fixtures; real host smoke for paste ownership | Claiming paste ownership complete with mock-only proof |

### Dependency input strategy

- Workspace consumers should prefer source during development, package public facade for product code, and future runtime-specific `exports` for published libs.
- Internal product code must not import `zhi-siyuan-picgo/src`; product helpers must be exposed by `zhi-siyuan-picgo` public entry or moved to product adapters.
- Opaque `dist/index.js` is a build artifact, not an architecture boundary. If used as a dependency input, bundle audit must prove it does not hide target-incompatible polyfills or dynamic execution.
- Product bundle and publishable lib bundle must be audited independently; they must not treat one undifferentiated fat lib entry as the only source of truth.

### Product/library layering

Desired dependency direction:

```text
picgo-plugin-bootstrap / picgo-plugin-app
        ↓
product application facade / Siyuan host adapters
        ↓
zhi-siyuan-picgo models/parser/upload facade
        ↓
universal-picgo domain core
        ↓
store ports/adapters
```

Disallowed reverse direction:

- `universal-picgo` importing product UI, SiYuan DOM, Electron remote menu, or plugin package assets.
- `zhi-siyuan-picgo` generic main entry requiring Vue/Element Plus/Electron helper as an unavoidable dependency for non-UI consumers.
- Product code reaching into lib `src` to bypass public contract.

### Capabilities that must not enter generic lib main entry

- Vue/Element Plus UI helper such as clipboard toast/copy helper.
- Electron remote menu/dialog construction.
- SiYuan DOM query and block lookup by rendered `<img src>`.
- npm plugin install/uninstall/update orchestration.
- Configuration migration side effects triggered by generic object construction.

### Lifecycle ownership strategy

- `SiyuanPicGo.getInstance()` remains for compatibility in this change, but owner is explicitly the plugin product. Future tests must be able to reset or isolate it before asserting runtime behavior.
- `picgoEventBus` remains public for compatibility, but UI event subscriptions must be bound/unbound by owning components.
- `UniversalPicGo` constructor side effects are documented risk; future cleanup should split pure construction from explicit `init/loadPlugins` lifecycle steps before changing external behavior.

### Bundle audit gate

Target artifacts must be scanned for:

- direct `eval(`
- `new Function`
- `eval("require")` / `eval('require')`
- `vm-browserify`
- unintended Node polyfill chunks or dynamic `require("stream")`

Any retained occurrence must name target, owner, reason, and containment boundary in this log.

### Package manifest/export strategy

- Preserve existing `main` and `typings` for published packages during this internal refactor.
- Add runtime-specific `exports` only as additive compatibility work unless a separate breaking change is proposed.
- Public contracts should separate future `core`, `store`, `siyuan`, `host`, and `ui`/product adapters instead of expanding a single generic entry.
- Product build may consume source/facade; lib release build must prove reusable generic entries do not include product-only abilities.

## 2026-05-23 paste upload ownership design and implementation notes

### Ownership rule

When a paste event is a candidate image paste and `siyuan.autoUpload` is enabled, the product listener must synchronously obtain ownership before starting upload:

1. inspect `detail.protyle`, `detail.files`, `textHTML`, `textPlain`, `siyuanHTML`;
2. reject non-image/non-supported cases without side effects;
3. call `CustomEvent.preventDefault()` and, when available, `detail.source.preventDefault()`;
4. call `detail.resolve({ textHTML: "", textPlain: "", siyuanHTML: "", files: empty-files-like })` so SiYuan plugin paste hook has no file payload left to pass to its default upload path;
5. start async PicGo upload only after the above ownership step.

### New paste boundaries

- `PasteEventAdapter` in `packages/picgo-plugin-bootstrap/src/paste/PasteEventAdapter.ts`
  - owns raw SiYuan paste event parsing and default-prevention/empty payload resolution.
  - creates `PasteInputSnapshot` with `transactionId`, `pageId`, `targetBlockId`, `File`, generated name, text fields, and prevention evidence.
- `PasteUploadTransaction` in `packages/picgo-plugin-bootstrap/src/paste/PasteUploadTransaction.ts`
  - is the only automatic paste upload use case.
  - performs PicGo upload, explicit document insertion, metadata commit, notification, and bounded failure reporting.
- `DocumentMutationPort`
  - writes final remote markdown with `/api/block/insertBlock` through `siyuanApi.insertBlock` if present or `siyuanApi.siyuanRequest("/api/block/insertBlock", ...)` fallback.
  - does not wait for default local asset or query rendered DOM.
- `MetadataRepository`
  - writes `custom-picgo-file-map-key` only after document insertion succeeds.
  - metadata item points to the same remote URL and inserted block returned by the transaction.

### Rollback / bounded failure states

- PicGo upload fails: default paste has already been blocked; no document write and no metadata write occur; user sees an explicit upload failure.
- Document mutation fails after remote upload: metadata is not written; user is told the remote upload succeeded but document insertion failed and must be handled manually.
- Metadata commit fails after document mutation: no retry timer, DOM polling, or second asset upload starts; user sees a metadata-sync failure.

### Legacy compensation deletion plan

- Automatic paste path no longer contains bootstrap `handleAfterUpload`, `doUpdatePictureMetadata`, `JsTimer`, `siyuanApi.uploadAsset(formData)`, or `document.querySelector(img[src])` compensation.
- `uploadSingleImageToBed(..., ignoreReplaceLink=true)` is retained only as a temporary PicGo upload primitive; `SiyuanPicgoPostApi` now skips its generic metadata write when `ignoreReplaceLink=true`, so the product transaction owns document mutation and metadata commit.
- The old `siyuan.waitTimeout` / `siyuan.retryTimes` settings remain readable for API compatibility but are no longer correctness requirements for automatic paste takeover.

### Host insertion API spike result

- Current repo has no local host automation harness.
- Official SiYuan API documentation confirms `/api/block/insertBlock` accepts `dataType`, `data`, `nextID`, `previousID`, and `parentID`, and returns the inserted block id in `doOperations[0].id`.
- The implementation uses `previousID = targetBlockId` and `parentID = pageId` as an explicit first product-owned insertion strategy. A real SiYuan smoke is still required before claiming final host verification.

## 2026-05-23 contract and boundary audit implementation

Added `scripts/picgo-internal-refactor-audit.cjs` and root script `pnpm audit:picgo-refactor`.

Implemented checks:

- `contract`
  - validates root `plugin.json` immutable fields;
  - validates baseline public export symbols in `universal-picgo`, `universal-picgo-store`, and `zhi-siyuan-picgo`;
  - validates `SIYUAN_PICGO_FILE_MAP_KEY`;
  - validates current settings defaults for `siyuan.waitTimeout`, `siyuan.retryTimes`, `siyuan.autoUpload`, `siyuan.replaceLink`, `siyuan.txtImageSwitch`.
- `boundaries`
  - fails on product code importing `zhi-siyuan-picgo/src`;
  - fails if bootstrap paste path reintroduces `uploadAsset(`, `JsTimer`, `handleAfterUpload`, or `doUpdatePictureMetadata`;
  - validates the new paste boundary names are present;
  - fails if paste transaction uses `uploadAsset(`, `document.querySelector`, or `JsTimer`;
  - validates `SiyuanPicgoPostApi` still gates generic metadata/link replacement by `ignoreReplaceLink`.
- `bundle`
  - scans existing artifacts for direct `eval`, `new Function`, `eval("require")`, `vm-browserify`, and dynamic `require("stream")`;
  - warns instead of passing final bundle evidence when no artifacts exist.

Initial run:

```bash
node scripts/picgo-internal-refactor-audit.cjs contract boundaries
# [audit] contract: ok
# [audit] boundaries: ok
```

## 2026-05-23 implementation and verification results

### Runtime / bundle boundary cleanup

Implemented boundary cleanup for browser-facing and reusable library bundles:

- Removed `file-type` from `universal-picgo`; S3 MIME detection now uses local data URL parsing plus small image-header sniffing in `libs/Universal-PicGo-Core/src/plugins/uploader/s3/utils.ts`.
- Removed the static `ali-oss` dependency from `universal-picgo`; Aliyun upload now uses the signed HTTP implementation through `ctx.request`, and the former internal `handleNode` name delegates to the same host-neutral path for compatibility.
- Replaced Node `url.URL` usage in S3 code with the standard global `URL`.
- Changed Core/Store Vite node polyfills from full implicit polyfill to explicit include lists with `vm` excluded.
- Removed `lodash-es` usage from Core path/config helpers by adding `getByPath`, `setByPath`, `unsetByPath`, and `deepMerge` in `libs/Universal-PicGo-Core/src/utils/pathObject.ts` and exporting them additively from `universal-picgo`.
- Replaced Store's `@commonify/lowdb`, `comment-json`, `lodash-es`, and `ts-localstorage` runtime dependency stack with a small synchronous JSON/localStorage adapter while preserving `JSONStore` method signatures.
- Kept JSON-with-comments read compatibility by stripping comments before `JSON.parse`; writes continue as standard pretty JSON.

### Product / library boundary cleanup

Implemented product/library separation without removing existing public symbols:

- Removed `zhi-siyuan-picgo/src` deep import from product code; product code now consumes the package public facade.
- Removed Vue/Element Plus dependencies from `libs/zhi-siyuan-picgo/src/lib/utils/utils.ts`; `copyToClipboardInBrowser` now returns `Promise<boolean>` and product UI owns success/failure messages in `UrlCopy.vue`.
- Removed Vue `readonly` usage from `PicgoHelper`; configuration access now uses plain object path helpers.
- Product app no longer depends directly on `lodash-es`; Element Plus' `lodash-unified` browser bundle input is aliased to `packages/picgo-plugin-app/src/lib/lodashUnifiedSafe.ts`, a local product-only helper subset that avoids lodash's `Function("return this")` fallback.
- `packages/picgo-plugin-app/scripts/build.py` now fails on `vue-tsc`/Vite errors and clears stale `assets/index-*.js/css` before app build, preventing obsolete artifacts from passing through bundle audit.
- PicGo npm helper dynamic code is retained only as the explicitly approved `zhi-infra` host helper under `artifacts/siyuan-plugin-picgo/dist/libs/zhi-infra/`; it is not used as an unqualified browser-bundle exception.

### Bundle audit exceptions

Approved exceptions are explicit and bounded:

| Exception | Owner | Reason | Containment |
| --- | --- | --- | --- |
| `eruda devtools runtime` | `picgo-plugin-app` dev HTML injection | Third-party debug console copied under public libs for dev-mode tooling; production HTML injects it only when `isDev` is true | `artifacts/siyuan-plugin-picgo/dist/libs/eruda/` |
| `zhi-infra host npm helper` | `UniversalPicGo PluginHandler` host adapter | CommonJS helper executed through SiYuan/Electron host `win.zhi.npm` for npm plugin management, not browser-facing app/bootstrap code | `artifacts/siyuan-plugin-picgo/dist/libs/zhi-infra/` |

### Verification commands and results

Dependency sync:

```bash
pnpm install
# ok; lockfile up to date after dependency removals
```

Builds:

```bash
pnpm --filter universal-picgo-store build
# ok; dist/index.js ~8.58 kB gzip ~3.01 kB
pnpm --filter universal-picgo build
# ok; dist/index.js ~1,521.96 kB gzip ~377.16 kB
pnpm --filter zhi-siyuan-picgo build
# ok; dist/index.js ~2,800.94 kB gzip ~721.43 kB
pnpm --filter picgo-plugin-bootstrap build
# ok; artifacts/siyuan-plugin-picgo/dist/index.js ~2,125.29 kB gzip ~637.48 kB
pnpm --filter picgo-plugin-app build
# ok; artifacts app bundle assets/index-CMgDeYZF.js ~3,635.04 kB gzip ~1,137.02 kB
```

Known non-fatal Vite warnings still observed during lib/product builds:

- `path` externalized for browser compatibility from `mime-types`.
- `fs`/`path` externalized from `@picgo/i18n` file-sync adapter.
- `http` externalized from `https-browserify`.
- `vm` externalized from `asn1.js`.

These warnings are tracked as runtime-boundary debt, but current generated target artifacts pass the forbidden-pattern bundle audit and do not include `vm-browserify` or dynamic code fallbacks.

Lint / tests:

```bash
pnpm --filter picgo-plugin-app lint
# ok; vue-tsc --noEmit
pnpm --dir libs/Universal-PicGo-Store exec vitest run
# ok; 2 files, 4 tests passed
pnpm --dir libs/Universal-PicGo-Core exec vitest run
# ok; 4 files, 5 tests passed
pnpm --dir libs/zhi-siyuan-picgo exec vitest run
# ok; 2 files, 8 tests passed
pnpm --dir packages/picgo-plugin-bootstrap exec vitest run
# no test files found; package currently has no committed test suite, so this remains a recorded baseline rather than a passing test gate
```

Added focused contract/regression tests:

- `libs/Universal-PicGo-Store/src/lib/JSONStore.spec.ts`
  - dotted-path get/set/has/unset;
  - localStorage invalid JSON fallback;
  - Node-like JSON-with-comments read and standard JSON write.
- `libs/Universal-PicGo-Core/src/utils/pathObject.spec.ts`
  - `getByPath`, `setByPath`, `unsetByPath`, `deepMerge`.
- `libs/Universal-PicGo-Core/src/plugins/uploader/s3/utils.spec.ts`
  - data URL MIME extraction;
  - PNG/JPEG/GIF/SVG header sniffing after removing `file-type`.

Contract / boundary / bundle audit:

```bash
pnpm audit:picgo-refactor
# [audit] contract: ok
# [audit] boundaries: ok
# [audit] bundle: ok
# approved warnings only: eruda devtools runtime, zhi-infra host npm helper
```

Direct artifact probe after final builds:

| Artifact | `eval(` | `new Function` | `Function("return this")` | `eval("require")` | `vm-browserify` | `require("stream")` |
| --- | --- | --- | --- | --- | --- | --- |
| `libs/Universal-PicGo-Core/dist/index.js` | no | no | no | no | no | no |
| `libs/Universal-PicGo-Store/dist/index.js` | no | no | no | no | no | no |
| `libs/zhi-siyuan-picgo/dist/index.js` | no | no | no | no | no | no |
| `artifacts/siyuan-plugin-picgo/dist/index.js` | no | no | no | no | no | no |
| `artifacts/siyuan-plugin-picgo/dist/assets/index-CMgDeYZF.js` | no | no | no | no | no | no |

### Public contract audit

`pnpm audit:picgo-refactor contract` confirms:

- root `plugin.json` immutable fields remain unchanged;
- baseline package export symbols remain present;
- `SIYUAN_PICGO_FILE_MAP_KEY` remains `custom-picgo-file-map-key`;
- settings defaults for `siyuan.waitTimeout`, `siyuan.retryTimes`, `siyuan.autoUpload`, `siyuan.replaceLink`, and `siyuan.txtImageSwitch` remain present.

No externally approved breaking API change was introduced. Additive exports from `universal-picgo` (`getByPath`, `setByPath`, `unsetByPath`, `deepMerge`) are non-breaking.

### Known remaining risk / not completed in this environment

Real SiYuan host smoke was not run in this environment. Therefore the following remain unverified and must not be marked complete until host-level evidence exists:

- default paste/internal upload is actually prevented by `preventDefault`/`detail.resolve` in a real SiYuan paste event;
- automatic image paste creates exactly one plugin-owned transaction and no unmanaged local asset;
- upload/document/metadata failure paths reach the designed bounded rollback states in a real host.

## 2026-05-23 externalized browser compatibility warnings eliminated

User validation treated the following Vite warnings as unacceptable for `universal-picgo` build output:

- `Module "path" has been externalized for browser compatibility`
- `Module "fs" has been externalized for browser compatibility`
- `Module "http" has been externalized for browser compatibility`
- `Module "vm" has been externalized for browser compatibility`

Follow-up cleanup:

- Replaced `@picgo/i18n` package main import with a local `simpleI18n` implementation used by `I18nManager`, avoiding the package's `adapters/index.js` re-export of `file-sync` (`fs`/`path`).
- Replaced `mime-types` imports with `lookupMimeType()` backed by `mime`, avoiding `mime-types` CommonJS `path.extname`.
- Removed direct `https` import and `https.Agent` construction from the S3 PicGo HTTP handler, avoiding `https-browserify -> http`.
- Replaced direct `crypto.createHash` / `crypto.createHmac` usage in Core uploaders and hash helpers with `cryptoUtil` backed by browser-safe `js-md5` and `hash.js`.
- Removed `crypto` from Core `nodePolyfills()` include list, avoiding the `asn1.js -> vm` polyfill chain.

Verification:

```bash
pnpm build -F universal-picgo
# ok; no path/fs/http/vm externalized browser compatibility warnings
```

Captured output check:

```text
ABSENT: Module "path" has been externalized
ABSENT: Module "fs" has been externalized
ABSENT: Module "http" has been externalized
ABSENT: Module "vm" has been externalized
```

Regression checks:

```bash
pnpm --dir libs/Universal-PicGo-Core exec vitest run
# ok; 4 files, 5 tests passed
pnpm --dir libs/Universal-PicGo-Store exec vitest run
# ok; 2 files, 4 tests passed
pnpm --dir libs/zhi-siyuan-picgo exec vitest run
# ok; 2 files, 8 tests passed
pnpm build -F zhi-siyuan-picgo
# ok
pnpm build -F picgo-plugin-app
# ok
pnpm build -F picgo-plugin-bootstrap
# ok
pnpm audit:picgo-refactor
# contract/boundaries/bundle ok
```
