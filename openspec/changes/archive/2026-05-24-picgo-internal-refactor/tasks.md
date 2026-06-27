## 1. Contract baseline

- [x] 1.1 Record the current public API baseline: plugin entrypoint, `plugin.json`, workspace package exports, key configuration fields, storage paths, and runtime behavior.
- [x] 1.2 Record the current build and test baseline: build/lint/test scripts and reproducible commands for each package.
- [x] 1.2.1 Record the direct `eval` / `eval("require")` build warning baseline, including the introduction chains for `vm-browserify`, `zhi-siyuan-picgo/dist/index.js`, and `stream` dynamic require.
- [x] 1.3 Clarify the "immutable external API" list and write it into the verification log.
- [x] 1.4 Record package role baseline: distinguish plugin product entrypoint, Vue app, Siyuan integration lib, PicGo core, store, host adapter, and build script.
- [x] 1.5 Record current product/lib conflict evidence: `zhi-siyuan-picgo/src` deep import, UI dependencies entering lib, `win/hasNodeEnv` re-export, static singleton, core constructor side effects, and npm plugin management entering core.
- [x] 1.6 Record current paste-upload timing defects: paste event does not block default behavior, PicGo uploads first, SiYuan `uploadAsset` uploads a second time, `JsTimer` polling, DOM query, and post-hoc block markdown replacement.

## 2. Internal architecture cleanup

- [x] 2.1 Clarify the responsibility boundaries of `picgo-plugin-bootstrap`, `picgo-plugin-app`, `Universal-PicGo-Core`, `Universal-PicGo-Store`, and `zhi-siyuan-picgo`.
- [x] 2.1.1 Design the runtime capability matrix, clarifying allowed and forbidden capabilities for browser bundle, SiYuan/Electron host side, Node build-time, and test environment.
- [x] 2.1.2 Clarify dependency input strategy: tightly coupled internal packages should prefer source/conditional exports/facade, and opaque dist bundles are forbidden as architecture boundaries.
- [x] 2.1.3 Design product/library layering: responsibilities and dependency direction for product shell, Siyuan adapter, application facade, domain core, store port, and host adapter.
- [x] 2.1.4 Clarify which capabilities must not enter the lib main entrypoint: Vue/Element Plus UI helpers, Electron remote menu, SiYuan DOM query, npm plugin installation, and configuration migration side effects.
- [x] 2.2 Converge cross-package deep imports and extract stable facades / orchestrators.
- [x] 2.2.0 Remove or isolate `zhi-siyuan-picgo/src` deep imports, and add official public entrypoints or internal adapters for product-used capabilities such as `replaceImageLink`.
- [x] 2.2.1 Converge logic requiring Node/host capabilities into explicit adapter layers, forbidding browser targets from obtaining capabilities through `eval("require")`, `vm-browserify`, or implicit polyfills.
- [x] 2.3 Clean up duplicated logic and implicit state dependencies while avoiding external behavior changes.
- [x] 2.3.1 Clarify `SiyuanPicGo` static singleton, `picgoEventBus`, and `UniversalPicGo` constructor initialization side effects, defining explicit ownership/lifecycle/reset strategy.
- [x] 2.3.2 Isolate UI settings helpers, PicGo plugin store/npm management, and Siyuan configuration migration from the generic lib main entry into product or host adapter layers.
- [x] 2.4 Design and implement the bundle audit gate: target artifacts must not contain unexplained direct `eval`, `new Function`, dynamic require, or Node polyfill leakage.
- [x] 2.5 Design package manifest/export strategy: clarify public/internal exports, conditional entrypoints, forbidden deep `src` imports, and input differences between plugin product builds and lib release builds.
- [x] 2.6 Design paste-upload ownership: when automatic upload is enabled, the real host event's default-behavior blocking capability, such as `source.preventDefault()`, must be called before the plugin handles upload and document write as a single transaction.
- [x] 2.7 Remove the double-upload/post-hoc compensation design from the main automatic paste-upload path: do not continue depending on SiYuan `uploadAsset`, waiting for default assets to appear, DOM query, and markdown stealing as the normal path.
- [x] 2.8 Design paste failure rollback semantics: PicGo upload failure, document write failure, and metadata write failure must each have a clear, user-understandable result, forbidding half-success states.
- [x] 2.9 Design `PasteEventAdapter`: centralize parsing of the real SiYuan paste event, synchronous takeover decision, and calling `source.preventDefault()` or equivalent blocking capability before any async upload.
- [x] 2.10 Design `PasteUploadTransaction`: the only use case for automatic paste upload, chaining input snapshot, PicGo upload, document write, metadata commit, notification, and rollback.
- [x] 2.11 Design `DocumentMutationPort`: after default paste is blocked, write the final image-host markdown/DOM through an explicit editor/block transaction without relying on default local asset, DOM query, or post-hoc markdown replacement to infer the target block.
- [x] 2.12 Design `MetadataRepository` and commit order: write `custom-picgo-file-map-key` only from the same transaction result; do not commit remote/local mixed mapping if document write fails.
- [x] 2.13 Clarify the deletion plan for the old clipboard compensation path: `ignoreReplaceLink=true` bypass, `siyuanApi.uploadAsset(formData)` second upload, `JsTimer` polling, and `document.querySelector(img[src])` must be removed from the automatic paste main path rather than wrapped.
- [x] 2.14 Do a real-host insertion API spike: verify how to insert final image-host markdown/DOM at the current cursor or target block after blocking default paste; do not fall back to default asset relay design before successful verification.

## 3. Contract protection and verification

- [x] 3.1 Add contract tests for public exports and key runtime behavior.
- [x] 3.1.1 Add package role/dependency direction checks: lib main entrypoints must not import product UI, Electron-only helpers, or SiYuan DOM; product code must not deep-import lib `src`.
- [x] 3.2 Run build / lint / test baselines for each package and record differences.
- [x] 3.2.1 Run Rolldown/Vite and other builds and check artifact audit results, confirming direct `eval` warnings are not hidden by ignore/alias but eliminated or explicitly isolated through runtime boundaries and dependency strategy.
- [x] 3.2.2 Separately verify plugin product bundles and publishable lib bundles: they must not rely on the same target-undifferentiated fat entry as the only source of truth.
- [x] 3.3 Run SiYuan host or equivalent smoke to confirm external API and user-visible behavior are unchanged.
- [x] 3.3.1 Run real SiYuan paste smoke: prove that `source.preventDefault()` or equivalent actually blocks default paste/internal upload, not only through mocks.
- [x] 3.3.2 Verify pasted image creates only one plugin-owned transaction: no unmanaged default local asset is produced, no polling wait is needed, no post-hoc link stealing is needed, and metadata is consistent with the final document link.
- [x] 3.3.3 Verify paste failure paths: PicGo upload failure, document write failure, and metadata commit failure each enter designed bounded rollback states without leaving mixed local asset/remote URL/metadata half-success states.

## 4. Review and closure

- [x] 4.1 Summarize internal refactor results, preserved API contracts, and known risks.
- [x] 4.2 Audit whether there is any external API breakage; if yes, split it into a new change.
- [x] 4.3 Update the evidence log and prepare the follow-up apply/archiving workflow.
