# picgo-internal-refactor verification log

This log records the baseline, contract list, architecture evidence, and verification results during implementation of this change. Unless another new change is approved, the "immutable external API" listed below must not be broken by this internal refactor.

## 2026-05-23 contract baseline

### Plugin manifest and product entry

- Root manifest: `plugin.json`
  - `name`: `siyuan-plugin-picgo`
  - `version`: `1.12.1`
  - `minAppVersion`: `2.9.0`
  - `backends`: `windows`, `linux`, `darwin`, `docker`, `android`, `ios`
  - `frontends`: `desktop`, `desktop-window`, `mobile`, `browser-desktop`, `browser-mobile`
  - `displayName`, `description`, `readme`, `i18n`, `funding` are all currently treated as manifest-facing contract.
- Plugin product entrypoint: `packages/picgo-plugin-bootstrap/src/index.ts`
  - default export `PicgoPlugin extends Plugin`
  - Runtime registers topbar/statusbar/settings, `paste`, and `open-menu-image`.
  - Build target is output by `packages/picgo-plugin-bootstrap/vite.config.ts` to `artifacts/siyuan-plugin-picgo/dist/index.js`, format `cjs`.
- Vue app entrypoint: `packages/picgo-plugin-app/src/main.ts`
  - Opened by the bootstrap dialog iframe at `/plugins/siyuan-plugin-picgo/#...`.
  - Build target is output by `packages/picgo-plugin-app/vite.config.ts` to the same plugin artifacts directory.

### Workspace package public exports

Current package manifests only have `main: ./dist/index.js` and `typings: ./dist/index.d.ts`, and runtime-specific `exports` are not defined yet. Therefore the symbols exported by the following source entrypoints are the current baseline:

- `universal-picgo` (`libs/Universal-PicGo-Core/src/index.ts`)
  - runtime/classes: `UniversalPicGo`, `ExternalPicgo`, `picgoEventBus`
  - db: `ConfigDb`, `PluginLoaderDb`, `ExternalPicgoConfigDb`
  - enums/events: `PicgoTypeEnum`, `IBusEvent`
  - utils: `isFileOrBlob`, `calculateMD5`, `isSiyuanProxyAvailable`
  - runtime probes: `win`, `currentWin`, `parentWin`, `hasNodeEnv`
  - types: `IPicGo`, `IImgInfo`, `IPicgoDb`, `IConfig`, `IExternalPicgoConfig`, `IPicBedType`, `IUploaderConfigItem`, `IUploaderConfigListItem`, `IPluginConfig`, `IPicGoPlugin`
- `universal-picgo-store` (`libs/Universal-PicGo-Store/src/index.ts`)
  - `JSONStore`
  - `win`, `currentWin`, `parentWin`, `hasNodeEnv`
  - type `IJSON`
- `zhi-siyuan-picgo` (`libs/zhi-siyuan-picgo/src/index.ts`)
  - PicGo/Siyuan classes: `SiyuanPicGo`, `SiyuanPicgoPostApi`, `PicgoHelper`, `ImageItem`, `ImageParser`, `ParsedImage`
  - constants: `SIYUAN_PICGO_FILE_MAP_KEY`
  - helpers: `copyToClipboardInBrowser`, `generateUniqueName`, `handleConfigWithFunction`, `handleStreamlinePluginName`, `replaceImageLink`, `retrieveImageFromClipboardAsBlob`, `calculateMD5`, `isSiyuanProxyAvailable`
  - PicGo db/enums/runtime re-exports: `ConfigDb`, `ExternalPicgoConfigDb`, `PluginLoaderDb`, `PicgoTypeEnum`, `win`
  - types: `IConfig`, `IExternalPicgoConfig`, `IImgInfo`, `IPicGo`, `IPicGoPlugin`, `IPicgoDb`, `IPluginConfig`

### Persistent configuration and storage contract

- Siyuan/PicGo metadata:
  - `SIYUAN_PICGO_FILE_MAP_KEY = "custom-picgo-file-map-key"`.
  - This block attrs value is a JSON string whose key is `ImageItem.hash` and whose value has the shape of `ImageItem`.
- Current settings page defaults:
  - `siyuan.waitTimeout ?? 2`
  - `siyuan.retryTimes ?? 5`
  - `siyuan.autoUpload ?? true`
  - `siyuan.replaceLink ?? true`
  - `siyuan.txtImageSwitch ?? false`
- Built-in PicGo configuration is read/written by `ConfigDb(ctx)`, and external PicGo configuration is read/written by `ExternalPicgoConfigDb(ctx)`.
- Important configuration fields include but are not limited to:
  - `picBed.current`, `picBed.uploader`, `picBed.list`, `picBed.<type>`
  - `uploader.<type>.configList`, `uploader.<type>.defaultId`
  - `picgoPlugins.<pluginName>`
  - `siyuan.proxy`
  - `extPicgoApiUrl`, `useBundledPicgo`, `picgoType`
- Current `UniversalPicGo` default base directory is `~/.universal-picgo` (browser fallback is `universal-picgo`), default configuration file is `picgo.cfg.json`, and plugin ecosystem state uses `package.json` / `package-lock.json` / `node_modules`.
- Compatible migration paths:
  - legacy config folder: `[workspace]/data/storage/syp/picgo`
  - legacy plugin assets: `[workspace]/data/plugins/siyuan-plugin-picgo/libs/setup` and `libs/zhi-infra`

### User-visible runtime behavior baseline

- onload initializes topbar/statusbar and writes the status bar message.
- `openSetting()` opens the Vue app settings page.
- The `paste` event currently attempts to automatically upload one clipboard image when `siyuan.autoUpload` is enabled.
- `open-menu-image` currently appends an "Upload to image host" action to the image block right-click menu; local images are uploaded after appending the Siyuan API base URL, and remote images show a confirmation before forced upload.
- The settings page continues to expose entrypoints for built-in/external PicGo switching, image-host configuration, plugin management, and Siyuan API settings; old paste polling configuration is defect evidence from before this refactor.

## 2026-05-23 build and test baseline

The current workspace has no `node_modules` installed and no existing `dist/` or `artifacts/` output was found, so this section records reproducible commands and static baseline; actual build results need to be supplemented after dependencies are installed.

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
  - No package-level `lint` script.
- `libs/Universal-PicGo-Store`
  - `pnpm --filter universal-picgo-store build`
  - `pnpm --filter universal-picgo-store test`
  - No package-level `lint` script.
- `libs/zhi-siyuan-picgo`
  - `pnpm --filter zhi-siyuan-picgo build`
  - `pnpm --filter zhi-siyuan-picgo test`
  - No package-level `lint` script.
- `packages/picgo-plugin-app`
  - `pnpm --filter picgo-plugin-app build`
  - `pnpm --filter picgo-plugin-app lint`
- `packages/picgo-plugin-bootstrap`
  - `pnpm --filter picgo-plugin-bootstrap build`
  - `pnpm --filter picgo-plugin-bootstrap test`
  - No package-level `lint` script.

### Build graph baseline

- `turbo.json` has `build.dependsOn = ["^build"]`, so libs build before plugin packages that depend on them.
- All three lib packages use Vite lib mode, entry `src/index.ts`, output `dist/index.js`, format `es`, and copy README/package manifest.
- `Universal-PicGo-Core` and `Universal-PicGo-Store` use `vite-plugin-node-polyfills`.
- The `rollupOptions.external` of all three lib builds is currently `[]`, meaning dependencies and polyfills tend to be bundled into lib artifacts.
- `picgo-plugin-bootstrap` uses Vite lib mode to output CJS `index.js`, with `external: ["siyuan", "process"]`.
- `picgo-plugin-app` is a Vue/Vite app build and outputs to the plugin artifacts directory.

## 2026-05-23 eval / dynamic require warning baseline

Historical build warnings need to be treated as architecture symptoms, not hidden with alias/ignore. The introduction chain shown by current source and build configuration is:

1. `Universal-PicGo-Core` / `Universal-PicGo-Store` enable `vite-plugin-node-polyfills`, and lib builds use `external: []`.
2. `universal-picgo` main entrypoint re-exports `win/currentWin/parentWin/hasNodeEnv`, with multiple internal `win.require("path"|"os"|"fs"|...)` calls.
3. `zhi-siyuan-picgo` main entrypoint re-exports runtime/db/core capabilities from `universal-picgo` and builds itself as opaque `dist/index.js`.
4. `picgo-plugin-bootstrap` and `picgo-plugin-app` both consume `zhi-siyuan-picgo`.
5. When the bundler resolves prebuilt or fully bundled `zhi-siyuan-picgo/dist/index.js` / node polyfill / stream fallback, dynamic execution/dynamic require patterns such as `vm-browserify` direct `eval`, `eval(this.code)`, and `eval("require")("stream")` are brought into target bundles.

Current acceptance standard: subsequent builds must prove that direct `eval`, `new Function`, `eval("require")`, `vm-browserify`, and unintended Node polyfills in target bundles have been eliminated or explicitly isolated to allowed targets; warnings must not merely be suppressed.

## 2026-05-23 package role baseline

| Package / path | Baseline role | Current boundary risk |
| --- | --- | --- |
| `packages/picgo-plugin-bootstrap` | SiYuan plugin product shell / host event integration | Directly calls `SiyuanPicGo`, deep-imports `zhi-siyuan-picgo/src`, and keeps paste compensation orchestration in the entrypoint |
| `packages/picgo-plugin-app` | Vue settings/upload UI app | UI stores/components directly hold PicGo `ctx` and `PicgoHelper` |
| `libs/zhi-siyuan-picgo` | Siyuan integration library / current application facade | simultaneously re-exports core/db/runtime, contains UI helpers, Electron menu, configuration migration, Siyuan block mutation, and static singleton |
| `libs/Universal-PicGo-Core` | PicGo domain core plus current plugin ecosystem runtime | constructor initializes db/request/builtins/plugin loader; npm plugin management and dynamic require are in core |
| `libs/Universal-PicGo-Store` | Store adapter / runtime probe | `win/hasNodeEnv` exposed as public API through global probing |
| `scripts/*` | Build/release/link scripts | build/package order depends on artifacts and workspace dist state |
| `packages/picgo-plugin-app/public/libs/zhi-infra` | Bundled host/npm helper | dynamically required by `PluginHandler` from runtime path |

## 2026-05-23 product/library conflict evidence

- Deep import: `packages/picgo-plugin-bootstrap/src/index.ts` currently imports `replaceImageLink` from `zhi-siyuan-picgo/src`, bypassing the package public contract; the same symbol is already exported by the `zhi-siyuan-picgo` main entrypoint.
- UI dependencies entering lib: `libs/zhi-siyuan-picgo/src/lib/utils/utils.ts` imports `element-plus` and `vue`; `picgoHelper.ts` imports `readonly` from `vue`.
- Electron/product helpers entering lib: `PicgoHelper.buildPluginMenu()` and `importPlugin()` call menus/dialogs through `win.require("@electron/remote")`.
- Runtime probe leakage: `universal-picgo-store` exports `win/hasNodeEnv`, `universal-picgo` then re-exports them, and `zhi-siyuan-picgo` then re-exports `win`.
- Static singleton: `SiyuanPicGo.getInstance()` caches `SiyuanPicgoPostApi`.
- Core constructor side effects: `UniversalPicGo` initializes config path, zhi npm path, db, plugin handler, request wrapper, built-in uploaders/transformers, and third-party plugin loader during construction.
- npm plugin management entering core: `PluginHandler` uses bundled `zhi-infra` to execute npm install/uninstall/update.

## 2026-05-23 paste upload timing defect evidence

Current `picturePasteEventListener` does not call `detail.source.preventDefault()` or any equivalent default-behavior blocking capability. The automatic paste main path is:

1. Read `detail.files` / `detail.siyuanHTML` / `detail.textHTML` / `detail.textPlain`.
2. Check `siyuan.txtImageSwitch` and `siyuan.autoUpload`.
3. Create `ImageItem(generateUniqueName(), file, true, "", "")`.
4. Call `uploadSingleImageToBed(pageId, attrs, imageItem, true, true)`, meaning PicGo uploads first and `ignoreReplaceLink=true`.
5. Enter `handleAfterUpload()`, using `JsTimer` polling according to `siyuan.waitTimeout` / `siyuan.retryTimes`.
6. Each compensation attempt calls `siyuanApi.uploadAsset(formData)`, uploading the same file to SiYuan assets.
7. Write `custom-picgo-file-map-key` according to `succMap`.
8. Use `document.querySelector(img[src=...])` to reverse-query `data-node-id` from the DOM.
9. `getBlockByID()` then checks whether markdown contains the local asset, and `updateBlock()` replaces it with the image-host URL.

This path has two sources of truth, PicGo remote URL and SiYuan local asset, and document insertion depends on host default behavior/DOM timing, so it is not a single transaction owned by the plugin.

## Immutable external API list

This internal refactor must not change:

- Manifest-facing fields of root `plugin.json`.
- Plugin default entry artifact name and SiYuan loading shape: `index.js` / default plugin class.
- Existing package names, `main`, `typings`, and listed public exports of the three published packages.
- Existing configuration keys, default value semantics, storage locations, and legacy migration compatibility.
- `custom-picgo-file-map-key` block attrs key and JSON value compatibility.
- User-visible settings entrypoint, upload entrypoint, right-click menu entrypoint, and built-in/external PicGo switching semantics.

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
- The old `siyuan.waitTimeout` / `siyuan.retryTimes` settings remain readable for API compatibility but are hidden from the settings UI and are no longer correctness requirements for automatic paste takeover.

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
  - validates config compatibility defaults for legacy `siyuan.waitTimeout` / `siyuan.retryTimes`, while ensuring those legacy polling controls are not exposed in the settings UI;
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
- config compatibility defaults for `siyuan.waitTimeout` and `siyuan.retryTimes` remain present, but their legacy polling controls are not exposed in the settings UI; active settings defaults for `siyuan.autoUpload`, `siyuan.replaceLink`, and `siyuan.txtImageSwitch` remain present.

No externally approved breaking API change was introduced. Additive exports from `universal-picgo` (`getByPath`, `setByPath`, `unsetByPath`, `deepMerge`) are non-breaking.

### Real SiYuan host smoke completion

Real SiYuan host smoke has now been run against the `test` workspace only:

- host: `http://127.0.0.1:50077/stage/build/desktop/?r=qfp6swh`
- title: `Untitled - test - SiYuan Notes v3.6.5`
- workspace: `D:\Users\Administrator\Documents\mydocs\SiyuanWorkspace\test`
- plugin link target: `artifacts/siyuan-plugin-picgo/dist`

Initial host paste smoke exposed a regression: the listener called `tryTakeover()` only after awaiting `SiyuanPicGo.getInstance(...)`, so SiYuan default paste had already posted a local asset through `POST http://127.0.0.1:50077/upload`. The fix moved takeover to the start of the listener: `PasteEventAdapter.tryTakeoverWithConfig()` now synchronously reads browser runtime config and calls `event.preventDefault()` / `detail.source.preventDefault()` / `detail.resolve(empty payload)` before any async PicGo initialization.

After rebuilding `picgo-plugin-bootstrap` and reloading the `test` host, real `Ctrl+V` image paste produced:

- console: `paste upload transaction started`, `Uploading... Current uploader is [awss3]`, `paste image markdown inserted`;
- network: MinIO `PUT http://127.0.0.1:9000/test/2026/05/83c797ab47b97bcf7de9afb43511a0f3.png [200]`;
- network: `/api/block/insertBlock [200]`, `/api/attr/getBlockAttrs [200]`, `/api/attr/setBlockAttrs [200]`;
- network: no new `POST http://127.0.0.1:50077/upload` for the successful paste;
- DOM: the new image link is the MinIO URL, with no new unmanaged `assets/image-*.png` intermediate.

Right-click image smoke also passed in the same `test` host:

- menu item: `Upload to PicGo image host`;
- console: `Uploading... Current uploader is [awss3]`;
- network: MinIO `PUT ... [200]`;
- DOM: image link replaced with `http://127.0.0.1:9000/test/2026/05/ae44fa8b5be668d9235fdfa5d4989cbb.png`.

Failure-path host smoke passed:

- PicGo upload failure: invalid S3 access key produced MinIO `PUT ... [403]`; there was no new SiYuan `/upload`, no `/api/block/insertBlock`, no `/api/attr/setBlockAttrs`; UI reported that default paste was blocked and no document write occurred.
- Document mutation failure: mocked `/api/block/insertBlock` returned `SMOKE_INSERT_FAIL` after a successful MinIO upload; there was no metadata write and no SiYuan `/upload`; UI reported the remote upload existed but document write failed.
- Metadata commit failure: mocked `/api/attr/setBlockAttrs` returned `SMOKE_ATTR_FAIL` after successful MinIO upload and block insert; no SiYuan `/upload`, polling, or second asset upload occurred; UI reported recoverable metadata-sync failure.

The audit script now also checks that the bootstrap paste listener calls `tryTakeoverWithConfig` before `SiyuanPicGo.getInstance`, preventing regressions to async-after-default behavior.

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


