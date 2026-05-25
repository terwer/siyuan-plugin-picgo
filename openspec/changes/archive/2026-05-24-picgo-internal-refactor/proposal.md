## Why

The historical baggage of `siyuan-plugin-picgo` has clearly affected maintainability: packages are deeply coupled, internal responsibilities are mixed, and implementation details leak into cross-package calls. After reading the current code in full, a more fundamental problem is visible: this repository simultaneously acts as a "SiYuan plugin product" and as a "publishable/package-reusable lib", but architecturally it does not separate the product shell, Siyuan adapter, PicGo domain core, runtime adapter, UI helper, and package public contract. The so-called "shared underlying capability" is actually reused through fat libs, global runtime probing, deep imports, static singletons, and full-bundle reuse, causing the plugin and lib to fight each other long-term. The direct `eval` / `eval("require")` warnings during build are not single-line code problems, but architectural signals that runtime boundaries, dependency inputs, prebuilt artifact consumption, and bundling strategy have not been constrained at the top level. It is now appropriate to reorganize the internal structure once, but the external API must be frozen, and product/library layering, runtime/bundle boundaries, and paste-upload transaction boundary design must be completed from the root so that maintenance cost and breakage risk are not passed on to later features.

## What Changes

- Reorganize the internal responsibility boundaries of `picgo-plugin-bootstrap`, `picgo-plugin-app`, `Universal-PicGo-Core`, `Universal-PicGo-Store`, and `zhi-siyuan-picgo`.
- Clarify that the plugin product and publishable lib are two different consumers: the plugin product can only compose capabilities through product facades/host adapters; the publishable lib must provide stable, target-specific public entrypoints without product UI leakage.
- Replace cross-package deep imports and implementation-detail leakage with stable package-level facades, and forbid source penetration such as `zhi-siyuan-picgo/src` from becoming a long-term contract.
- Define runtime capability boundaries for browser, SiYuan host, Node build-time, and test environments at the top level, and forbid hiding environment mixing through local replacement of direct `eval`.
- Govern the design defects that bring opaque dependencies such as `vm-browserify`, prebuilt `zhi-siyuan-picgo/dist`, and dynamic `require` probing into target bundles.
- Govern the fat-lib design where `zhi-siyuan-picgo` simultaneously exposes core/db/runtime, includes Vue/Element Plus/Electron helpers, and owns SiYuan configuration migration and plugin-management orchestration.
- Rebuild paste image upload ownership: once automatic upload is enabled, the plugin must block SiYuan default paste/internal upload at the event source and act as the only transaction handler for upload, insert/replace, and metadata write.
- Deprecate the main path of "double upload + SiYuan `uploadAsset` + DOM/block polling + post-hoc link stealing"; this is not an acceptable fallback, but a wrong and uncontrollable design direction.
- Completely rewrite paste upload from the compensation script inside the event handler into product-level `PasteUploadTransaction`: synchronous decision and default behavior blocking, PicGo upload, explicit document write, metadata commit, and failure rollback are each owned by clear application services / ports / adapters.
- Converge duplicated state, storage, upload orchestration, and SiYuan adapter logic to reduce coupling between modules.
- Add public contract and runtime regression verification to lock down existing plugin entrypoints, exports, data compatibility, and user-visible behavior.
- **Do not change external API**: do not change public export names, required configuration fields, manifest structure, or existing storage contract unless a separate follow-up change is proposed.

## Capabilities

### New Capabilities
- `picgo-public-contract-stability`: keep existing public entrypoints, exported symbols, plugin manifest, storage contract, and user-visible behavior stable during internal refactor.
- `picgo-runtime-boundary-integrity`: constrain runtime capabilities, dependency inputs, and build artifacts at the architecture layer, eliminating the missing environment boundary behind direct `eval` warnings.
- `picgo-product-library-boundary`: distinguish the SiYuan plugin product from publishable PicGo/Siyuan libs at the top level, rebuilding package roles, dependency direction, public entrypoints, and build targets.
- `picgo-paste-upload-ownership`: paste image upload must be taken over by the plugin as a single transaction after blocking default behavior at the source, and double upload, polling, and post-hoc compensation must not become runtime paths.

### Modified Capabilities
- None

## Impact

- Affected code is mainly concentrated in `packages/`, `libs/`, and a small number of helper tools under `scripts/`; the dependency direction of `picgo-plugin-bootstrap`, `picgo-plugin-app`, `zhi-siyuan-picgo`, `universal-picgo`, and `universal-picgo-store` needs special audit.
- External impact includes plugin entrypoints, package-level exports, settings page, and existing runtime flows such as upload/paste/menu; automatic paste image upload is a high-risk core flow and must be verified against real host behavior, proving that it no longer depends on SiYuan default local asset as an intermediate source of truth.
- Contract tests, build verification, bundle audit, package role audit, real host paste smoke, and host behavior regression need to be added to ensure the refactor does not change external API and no longer brings wrong-layer capabilities such as direct `eval`, `eval("require")`, `vm-browserify`, Vue/Element Plus UI helpers, or Electron-only helpers into libs or bundles where they should not appear; paste takeover must not be proven with mocks instead of the real host.
