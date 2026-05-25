## Context

`siyuan-plugin-picgo` is currently a multi-package workspace containing the plugin bootstrap, frontend app, core library, and Siyuan adapter layer. Historically there have been deep direct dependencies between packages, and some implementation details leak to external call surfaces through cross-package imports, shared utilities, and implicit contracts, causing high maintenance and extension cost.

Recent build output exposed deeper design problems: direct `eval` in `vm-browserify`, inherited/inlined `eval(this.code)` in `zhi-siyuan-picgo/dist/index.js`, and dynamic require escapes such as `eval("require")("stream")` were brought into the current bundling chain. These warnings cannot be treated as defects that are fixed by "replacing three eval occurrences"; they show that the current architecture does not clearly distinguish browser runtime, SiYuan/Electron host capabilities, Node build-time capabilities, and test-double capabilities, nor does it constrain whether dependency inputs are source code, public APIs, conditional exports, or opaque dist bundles.

After reading the code further in full, another more fundamental defect is that the "plugin product" and the "publishable/packageable lib" are not separated. `picgo-plugin-bootstrap` is the SiYuan plugin entrypoint, and `picgo-plugin-app` is the Vue settings/upload UI; both output to the plugin artifact. However, both directly depend on `zhi-siyuan-picgo`, and bootstrap even deep-imports `zhi-siyuan-picgo/src`. `zhi-siyuan-picgo` itself is not just a narrow Siyuan facade: it re-exports db/core/runtime capabilities from `universal-picgo`, contains Vue/Element Plus utilities, Electron remote menus, Siyuan configuration migration, PicGo plugin management, and a `SiyuanPicGo` static singleton. The underlying `universal-picgo`/`universal-picgo-store` also expose `win`, `hasNodeEnv`, filesystem, npm plugin installation, dynamic require, and node polyfills as generic capabilities. The result is mutual contamination between product shell, UI, host adapter, domain core, store, third-party plugin ecosystem, and published lib.

Another critical defect that cannot be ignored is in the paste-upload flow. After `picgo-plugin-bootstrap` listens to SiYuan `paste` events, it does not block default paste/internal upload at the event source. Instead, it first calls PicGo upload, then calls `siyuanApi.uploadAsset(formData)` to let SiYuan create a local asset, then polls DOM and block markdown according to `siyuan.waitTimeout`/`siyuan.retryTimes`, and finally replaces the local link with the image-host link and writes `custom-picgo-file-map-key`. This is not an implementation that is "complex but usable"; it has wrong ownership. The same user paste is jointly handled by SiYuan default behavior and plugin compensation logic, turning upload order, DOM appearance time, block attrs, succMap, local asset, and image-host URL into races. The fact that this path sometimes works does not make it acceptable; once it fails, users see hard-to-explain duplicate uploads, link inconsistency, replacement failure, or metadata disorder, and rollback is difficult to control. The correct direction must be that the plugin obtains unique ownership at the paste event source, for example by calling the host event `source.preventDefault()` to block default behavior, and then the plugin alone completes upload, insertion/replacement, and metadata write.

At a deeper level, the paste-upload problem is not "one missing preventDefault line in a listener", but that the product architecture puts "user input takeover", "upload business", "document mutation", "metadata consistency", and "failure rollback" all into one compensation-style event handler, while allowing SiYuan default behavior to change the document first and then making the plugin chase host state to patch it. This model cannot be deterministic from the root: the transaction start is not owned by the plugin, document write is not owned by the plugin, and the rollback object is not owned by the plugin. A complete rewrite must invert the design: upload may start only after the plugin has synchronously obtained paste event ownership; there may be only one source of truth, namely the remote image result produced by the plugin transaction and the corresponding metadata; document write must be one step of the transaction, not link stealing after waiting for a default asset to appear.

The goal of this change is not to redo features, but to organize the internal structure into more stable layers while freezing the external API and existing plugin behavior. The refactor must answer at the top level "which code belongs to the plugin product, which belongs to the publishable lib, which is only a runtime adapter, and which is pure domain capability"; otherwise any local fix will continue to defer maintenance risk to the next build or dependency upgrade.

## Current Code Evidence

- `packages/picgo-plugin-bootstrap/src/index.ts` simultaneously depends on SiYuan `Plugin`, the `zhi-siyuan-picgo` main entrypoint, and the deep source entrypoint `zhi-siyuan-picgo/src`.
- `packages/picgo-plugin-app/src/components/setting/PicgoSetting.vue` gets `SiyuanPicGoClient.getInstance()` and passes `ctx` directly to settings components; `useBundledPicGoSetting.ts` / `useExternalPicGoSetting.ts` directly call `new ConfigDb(ctx)` / `new ExternalPicgoConfigDb(ctx)`.
- `libs/zhi-siyuan-picgo/src/index.ts` re-exports db, types, runtime `win`, and utilities from `universal-picgo`; `src/lib/utils/utils.ts` depends on `element-plus` and `vue`; `src/lib/picgoHelper.ts` depends on Vue `readonly`, Electron remote, PicGo plugin handler, and the global `picgoEventBus`.
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgo.ts` uses a static singleton to store `SiyuanKernelApi` and `SiyuanPicgoPostApi`; `siyuanPicgoPostApi.ts` simultaneously handles Siyuan block attrs, document link replacement, configuration migration, file moving, and PicGo upload.
- `libs/Universal-PicGo-Core/src/core/UniversalPicGo.ts` constructor immediately initializes configuration, paths, db, plugin handler, request wrapper, built-in plugins, and third-party plugin loader; `PluginLoader.ts` / `PluginHandler.ts` are responsible for `node_modules` plugin loading and npm install/update.
- `libs/Universal-PicGo-Store/src/lib/utils.ts` infers `win` and `hasNodeEnv` through `window`/`parent`/`fs.rm`, and is re-exported or consumed by core and the Siyuan lib.
- The three publishable libs only have `main: ./dist/index.js` / `typings` and no runtime-specific `exports`; multiple Vite lib builds use `external: []`, and Core/Store also enable `vite-plugin-node-polyfills`.
- `picturePasteEventListener` in `packages/picgo-plugin-bootstrap/src/index.ts` reads `detail.files`, `siyuanHTML`, `textHTML`, and `textPlain`, but does not call `source.preventDefault()` or any default-behavior blocking.
- The clipboard path first uploads to PicGo via `uploadSingleImageToBed(..., forceUpload=true, ignoreReplaceLink=true)`, then enters `handleAfterUpload()` / `JsTimer()`, and finally calls `siyuanApi.uploadAsset(formData)`, `getBlockAttrs()`, `setBlockAttrs()`, `document.querySelector()`, `getBlockByID()`, and `updateBlock()` in `doUpdatePictureMetadata()` for post-hoc compensation.
- `siyuan.waitTimeout` / `siyuan.retryTimes` are exposed in the settings page, showing that the current paste flow turns timing races into user-facing configuration instead of eliminating the race architecturally.
- A full-repo scan only found commented browser paste `e.preventDefault()` in `packages/picgo-plugin-app/src/components/home/controls/DragUpload.vue`; the production `eventBus.on("paste")` path has no default-behavior blocking code.
- The right-click/menu image upload path assigns `ImageItem.blockId` in `doSelectedPictureUpload()` and calls `uploadSingleImageToBed(..., ignoreReplaceLink=false)` to directly replace an existing block; the clipboard path passes `ignoreReplaceLink=true` and then uses private bootstrap polling compensation, showing that the current architecture has turned paste into a special bypass rather than a unified upload transaction.

## Goals / Non-Goals

**Goals:**
- Reduce cross-package coupling and establish clearer internal layering.
- Treat public entrypoints and exports as stable contracts and forbid unintentional breakage.
- Improve future extension and debugging capability so upload, storage, adapters, and UI orchestration can evolve independently.
- Use contract/regression verification to ensure the refactor does not change external behavior.
- Establish runtime/bundle boundaries from the root: clearly define which packages may use Node capabilities, which packages must be browser-safe code, and which capabilities must be exposed through injection or facades.
- Treat direct `eval`, dynamic `require`, and accidental Node polyfills entering browser bundles as architecture gate failures rather than local warning fixes.
- Separate the responsibilities of "plugin product shell" and "publishable lib" from the root: UI, SiYuan host side effects, configuration migration, plugin store/npm management must not continue polluting domain core or generic store.
- Establish package roles and dependency direction: product shell → Siyuan adapter → PicGo application facade → domain core/ports; forbid reverse dependencies and UI technology stack entering lower-level libs.
- Automatic paste image upload must block SiYuan default paste/internal upload at the source and be uniquely taken over by the plugin; upload, insert/replace, and metadata write must belong to the same verifiable transaction.
- Paste upload must be rewritten as a product-level use case, establishing explicit boundaries such as `PasteEventAdapter`, `PasteUploadTransaction`, `DocumentMutationPort`, `MetadataRepository`, and `RollbackPolicy`, instead of wrapping and reusing the old compensation chain.

**Non-Goals:**
- Do not change external API in this change.
- Do not refactor into a brand-new product form, and do not replace existing image-host capability.
- Do not change the user-visible semantics of plugin manifest, readme, or default configuration format.
- Do not introduce functional breaking changes under the name of "cleaning historical debt".
- Do not do single-point `eval` replacement or patch `node_modules`/prebuilt artifacts to make the surface quiet; dependency entrypoints, runtime ownership, and bundling strategy must be solved first.
- Do not interpret "continue sharing underlying capabilities" as continuing to share the same fat object/fat lib; this change solves reuse boundary design rather than moving existing coupling to another directory.
- Do not package Vue/Element Plus/Electron helpers, SiYuan DOM queries, npm plugin installation, configuration migration, or other product/host responsibilities as generic lib APIs.
- Do not allow double upload, polling waits, DOM lookup, or post-hoc block markdown link stealing to be fallback, compatibility path, or acceptable main path for paste upload.
- Do not use mocks to prove paste takeover correctness; real SiYuan host events must prove that default behavior is blocked.
- Do not treat `source.preventDefault()` as a single-point patch while keeping the original `uploadAsset`/`JsTimer`/DOM query compensation architecture; blocking is only the entry condition for transaction ownership, not the complete design.

## Future Paste Upload Architecture

Paste image upload needs to be rewritten from a "compensation script after host default behavior" into a "plugin-exclusive product-level transaction". Target structure:

```text
SiYuan paste event
      │
      ▼
PasteEventAdapter
  - read detail.files / protyle / pageId / textHTML / textPlain
  - synchronously decide whether it matches automatic upload takeover conditions
  - call source.preventDefault() before starting async upload
      │
      ▼
PasteUploadTransaction
  - create transactionId / input snapshot
  - chain upload, document write, metadata commit, notification, rollback
      │
      ├── PicGoUploadService
      │     only uploads File/Blob to the target image host and returns remote image result
      │
      ├── DocumentMutationPort
      │     only writes the final image-host link to the current edit position or target block
      │     does not wait for SiYuan default asset or steal block id through DOM query
      │
      ├── MetadataRepository
      │     writes custom-picgo-file-map-key using the final remote result and document write result as source of truth
      │
      └── RollbackPolicy
            clearly defines whether to insert a placeholder, undo document mutation, notify the user, or keep a manual handling entry on failure
```

Design constraints:

- `PasteEventAdapter` is the only layer allowed to touch the raw SiYuan paste event object; it must complete takeover decision and default-behavior blocking before any `await` upload action.
- `PasteUploadTransaction` is the only orchestration entrypoint for automatic paste upload; the bootstrap listener can only call this use case and must not directly perform PicGo upload, SiYuan `uploadAsset`, polling, DOM query, or `updateBlock`.
- `PicGoUploadService` should not know about SiYuan default asset, block markdown, DOM, or `custom-picgo-file-map-key`; it only returns the remote upload result.
- `DocumentMutationPort` must write final image-host markdown or DOM based on an explicit editor/block transaction; if the host has no reliable API, a real-host spike is required first and returning to "double upload and wait for default asset" is not allowed.
- `MetadataRepository` must commit after document write succeeds and based on the same transaction result; on failure it must not leave stale mappings pointing to nonexistent document links or local assets.
- `RollbackPolicy` must be defined before implementation. Acceptable states are only: nothing inserted and failure clearly reported, an explicit failure placeholder inserted with retry capability, or fully successful. Unacceptable states are mixed states where local asset is inserted, remote URL is uploaded, metadata is half-written, and a timer keeps retrying.

The old flow can only be used as negative evidence and migration deletion target:

- The clipboard special bypass `uploadSingleImageToBed(..., ignoreReplaceLink=true)` should not become the core of the new transaction.
- `siyuanApi.uploadAsset(formData)` must not be the compensation main path for automatic paste upload; only if another explicit requirement needs "also save to SiYuan assets" can a separate change design it as an explicit user option, and it must not affect the default takeover transaction.
- `waitTimeout`, `retryTimes`, `JsTimer`, `document.querySelector(img[src=...])`, `getBlockByID()` post-hoc markdown judgment, and then `updateBlock()` cannot be correctness foundations.
- If `source.preventDefault()` or an equivalent mechanism cannot be proven to take effect in time in the real host, that version cannot claim that the automatic paste upload refactor is complete.

## Decisions

1. **Freeze external contracts and reorder internals first.**
   Treat public exports, plugin entrypoint, configuration keys, storage paths, and host interaction behavior as stable boundaries first, then gradually refactor internal implementation.
   The alternative is changing API and internal structure together, but that would significantly amplify migration risk.

2. **Unify cross-package calls through facade / orchestrator.**
   Let `picgo-plugin-bootstrap`, `picgo-plugin-app`, `Universal-PicGo-Core`, `Universal-PicGo-Store`, and `zhi-siyuan-picgo` collaborate through fewer and more stable entrypoints.
   The alternative is continuing to allow deep imports; rejected because that would make the refactor only "surface cleanup".

3. **Prioritize state and storage boundaries.**
   Stabilize configuration, persistence, runtime context, plugin loading, and upload orchestration first, then handle UI details.
   The alternative is starting from UI; rejected because UI changes can easily hide underlying contract problems.

4. **Use contract tests to lock API.**
   Establish executable verification for external exports, manifest, configuration fields, and key runtime behavior to prevent internal refactor from accidentally hurting users.
   The alternative is relying only on manual smoke; rejected because the maintenance surface is too large.

5. **Treat runtime capabilities as first-class architecture boundaries.**
   Define allowed capabilities separately for browser bundle, SiYuan/Electron host side, Node build-time scripts, and test environment: browser targets must not implicitly carry escape paths such as `vm-browserify`, `eval("require")`, or Node stream dynamic probing; Node capabilities must be explicitly injected through host adapters/facades.
   The alternative is string replacement, aliasing, or ignoring warnings for the current three `eval` occurrences; rejected because the problem will recur on the next dependency upgrade or prebuilt bundle change, and runtime security boundaries cannot be explained.

6. **Forbid opaque dist bundles as internal dependency foundations.**
   For workspace-internal or tightly coupled packages, prefer source, conditional exports, or controlled facade instead of directly depending on files such as `zhi-siyuan-picgo/dist/index.js` that already contain polyfills, dynamic require, and bundler artifacts.
   The alternative is continuing to adapt backward from dist; rejected because dist is an output, not a boundary, and cannot be the basis for top-level architecture design.

7. **Build gates must prove "no wrong runtime capability leakage".**
   Build verification must not only check success, but also audit whether direct `eval`, `new Function`, `eval("require")`, `vm-browserify`, accidental Node polyfills, and cross-environment fallbacks enter target packages.
   The alternative is accepting Rolldown warnings and judging manually; rejected because that periodically defers architecture defects to release time.

8. **Treat the plugin product and publishable lib as two first-class consumers.**
   `picgo-plugin-bootstrap`/`picgo-plugin-app` are product shells and may compose UI, Dialog, status bar, SiYuan event bus, and host APIs; the published entrypoints of `universal-picgo`, `universal-picgo-store`, and `zhi-siyuan-picgo` must declare their target consumers and runtime, rather than re-exporting all internal objects to serve all scenarios at once.
   The alternative is continuing to let app/bootstrap consume the fat `zhi-siyuan-picgo` entrypoint directly; rejected because every lib change would become a plugin product regression risk.

9. **Domain core may only depend on ports, not host globals.**
   PicGo upload orchestration, configuration model, image parsing, and image-host plugin protocol should sink into UI/host-neutral core; filesystem, clipboard, Electron remote, SiYuan kernel API, npm plugin installation, localStorage, and similar capabilities must be injected through explicit adapters/ports.
   The alternative is continuing to branch on `win`/`hasNodeEnv` in arbitrary layers; rejected because runtime judgment becomes implicit global state and cannot be stably verified by build and tests.

10. **Siyuan integration facade is not the plugin product implementation.**
    `zhi-siyuan-picgo` can be a Siyuan integration package, but it must separate public facade, host adapter, product UI helper, configuration migration tasks, and third-party PicGo plugin management; product helpers such as Vue/Element Plus/Electron menus should not leak from the lib main entrypoint.
    The alternative is continuing to put `PicgoHelper`, `SiyuanPicGo` static singleton, configuration migration, and plugin store UI behavior into one package-level entrypoint; rejected because this is the core cause of current maintainability problems.

11. **Published package entrypoints must express targets, not only one `dist/index.js`.**
    Publishable packages need clear public exports, internal exports, browser/node/host conditional entrypoints, and a forbidden deep-import strategy; product builds should consume controlled source/facade, not opaque dist or `src` deep paths.
    The alternative is continuing to rely on `main: ./dist/index.js` and `external: []`; rejected because it cannot simultaneously satisfy plugin bundle, library release, tree-shaking, and runtime isolation.

12. **Paste upload must obtain event ownership before upload.**
    When `siyuan.autoUpload` decides that the PicGo plugin should take over a pasted image, the plugin must block SiYuan default paste/internal upload at the event source, for example by verifying and calling host `source.preventDefault()`; then the plugin acts as the only handler for PicGo upload, document insertion/replacement, and metadata write.
    The alternative is allowing SiYuan default upload first and then using `uploadAsset`, polling, DOM query, and markdown replacement to steal the link into an image-host link; rejected because this creates uncontrollable races, random success is still unacceptable, and failure is inexplicable to users and hard to roll back.

13. **Paste-upload regression must be based on real host behavior.**
    Paste-flow verification must cover the real SiYuan paste event, `detail.source`/`source.preventDefault()`, whether default assets are not produced, whether the final document link is written once by the plugin, and whether metadata is consistent.
    The alternative is only using unit mocks, only checking function calls, or only checking the final URL; rejected because the current defect is fundamentally a real timing race between host default behavior and plugin compensation logic.

14. **Paste upload must be thoroughly rewritten around transaction boundaries, not by wrapping the old compensation flow.**
    The new design must use `PasteUploadTransaction` or an equivalent use case as the only entrypoint, chaining event takeover, upload, document mutation, metadata, notification, and rollback into an auditable flow; the old `uploadAsset` second upload, `ignoreReplaceLink=true` bypass, `JsTimer` polling, and DOM lookup can only be deleted or isolated as historical compatibility code and must not remain as fallback in the automatic upload path.
    The alternative is retaining the old flow as "fallback when blocking fails" or "compatibility when occasionally works"; rejected because it reintroduces double sources of truth and uncontrollable rollback.

15. **Document writes must go through an explicit port.**
    After default paste is blocked, the plugin must write the final image-host link into the current editing context through a clear `DocumentMutationPort` or equivalent adapter and obtain a deterministic result for metadata association; it must not infer the block by waiting for the host to insert a local asset first and then reverse-querying the DOM.
    The alternative is continuing to rely on `document.querySelector` and block markdown containment inference; rejected because DOM render timing is not a transaction boundary.

16. **Failure rollback must be designed before implementation.**
    The paste-upload rewrite must first define the user-visible state and recovery strategy after each stage fails, then implement it; it must not continue relying on background timers, repeated `uploadAsset`, or half-written metadata to hope for later self-healing.
    The alternative is "show a toast on upload failure and let users retry on replacement failure"; rejected because the core defect is that half-success states are incomprehensible and not reliably recoverable for users.

## Risks / Trade-offs

- [Risk] Internal refactor may introduce behavior drift → Mitigation: freeze the public contract first, then prove compatibility with tests and smoke.
- [Risk] Over-abstraction increases short-term change cost → Mitigation: abstract only stable boundaries that are truly reused across packages.
- [Risk] Old code has many implicit dependencies → Mitigation: converge gradually, first identifying high-coupling entrypoints before changing them.
- [Risk] Not changing API may limit ideal architecture implementation → Mitigation: prioritize stable maintainability in this change; open separate changes for necessary breaking adjustments.
- [Risk] direct `eval` warnings may be mishandled as local code replacements → Mitigation: classify them as runtime-boundary and dependency-entry design defects; establish boundaries and gates before allowing local implementation adjustments.
- [Risk] Node compatibility polyfills or opaque dist bundles may keep flowing back periodically → Mitigation: clarify dependency consumption strategy, conditional export strategy, and bundle audit rules; forbid wrong runtime capabilities from implicitly entering browser targets.
- [Risk] Plugin product and publishable lib continue constraining each other → Mitigation: establish package role matrix, dependency direction gates, and public/internal exports; products can only compose capabilities through facades/adapters.
- [Risk] UI/host capabilities continue entering lib main entrypoints → Mitigation: classify Vue/Element Plus/Electron remote/Siyuan DOM/npm management as product or host adapter capabilities and forbid leakage in lib bundle audits.
- [Risk] Static singletons and global event bus hide lifecycle problems → Mitigation: define explicit ownership and reset/test strategy for `SiyuanPicGo`, `picgoEventBus`, configuration migration, and PicGo ctx.
- [Risk] Paste upload continues using double-upload compensation and appears randomly usable → Mitigation: make `source.preventDefault()`/default-behavior blocking a hard gate; do not keep automatic upload main path before blocking is proven.
- [Risk] Real host event behavior differs from mock behavior → Mitigation: paste flow must run SiYuan host smoke proving no default local asset or post-hoc link stealing is produced.
- [Risk] Only patching `preventDefault` without changing transaction boundaries keeps old races in another form → Mitigation: use `PasteUploadTransaction`, explicit document write port, and rollback policy as acceptance targets; old compensation path must not be fallback.
- [Risk] No stable insertion API is found after blocking default paste → Mitigation: run a real-host spike to verify `DocumentMutationPort`; do not allow fallback to default asset relay before proof.

## Migration Plan

1. Establish baseline first: inventory public exports, plugin entrypoint, configuration keys, storage paths, and key runtime flows.
2. Establish package role matrix: label product shell, UI app, Siyuan adapter, PicGo application facade, domain core, store, host adapter, and build-only script.
3. Establish runtime matrix: define allowed capabilities for browser bundle, SiYuan/Electron host side, Node build-time scripts, and test doubles.
4. Trace dependency chains for direct `eval` warnings, recording how `vm-browserify`, `zhi-siyuan-picgo/dist/index.js`, `eval("require")("stream")`, and similar items enter bundles and why.
5. Trace product/lib conflict chains: record app/bootstrap direct dependency on `zhi-siyuan-picgo`, `zhi-siyuan-picgo/src` deep import, `PicgoHelper` UI dependency, `win/hasNodeEnv` re-export, `UniversalPicGo` constructor side effects, and core npm plugin management.
6. Trace paste-upload timing chain: record paste event detail/source, default-behavior blocking point, PicGo upload, document write, metadata write, and failure rollback boundary; prove the old double-upload compensation path is moved out of the main path.
7. Extract internal facades, reduce cross-package deep imports, and converge Node/host capabilities into explicit adapter layers.
8. Adjust implementation structure while preserving external API, manifest, and runtime semantics.
9. Add contract tests, build tests, package role audit, bundle audit, and real paste host smoke.
10. If a breaking API change is discovered as necessary, open a separate new change and do not mix it into this case.

## Open Questions

- Which exports are real public API and which are only accidentally exposed internal implementation?
- Which layer should be decomposed first: storage, upload orchestration, or UI composition?
- Are there historical compatibility entrypoints that must remain, or can they be fully converged internally and then kept through thin adapters?
- Which Node capabilities are truly required at runtime, and which are just fallbacks introduced by dependencies for old environments?
- What source/conditional export/facade should `zhi-siyuan-picgo` provide long-term to avoid consumers depending on opaque dist bundles?
- Is an allowlist needed for bundle artifacts to define which dynamic-code capabilities may exist in which targets?
- Is the long-term positioning of `zhi-siyuan-picgo` a public integration lib, a plugin-internal facade, or should the two be split into separate packages?
- Which capabilities in `PicgoHelper` are UI helpers, which are application services, and which are domain configuration rules?
- Should configuration initialization, plugin loading, and third-party plugin registration in the `UniversalPicGo` constructor be split into explicit lifecycle stages?
- Should `win`/`hasNodeEnv` be removed from public exports or downgraded to internal adapter details?
- Does the package manifest need `exports`/conditional exports/internal subpath blocking to prevent deep `src` imports?
- What is the real availability and call timing of SiYuan paste event `detail.source`/`source.preventDefault()` across frontend/backend combinations?
- After default paste is blocked, which SiYuan API or editor transaction should the plugin use to insert the final image-host link and avoid local asset relay?
- How should paste-upload failure roll back: insert nothing, insert the original local image, prompt the user for manual handling, or preserve clipboard content?
