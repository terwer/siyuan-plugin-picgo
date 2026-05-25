## Why

Since 1.6.0, the PicGo plugin has moved all PicGo state to `~/.universal-picgo`, solving the old problem where heavy files such as `node_modules`, cache, and scripts were placed in the SiYuan workspace and slowed down sync. However, this also moved the built-in PicGo main configuration `picgo.cfg.json` out of workspace sync, breaking the experience of reusing the same image-host configuration across multiple devices.

v2.0.0 allows a breaking storage-contract cleanup to settle historical debt: v2 includes the already completed internal refactor and this path split. The goal is to let the adapted built-in PicGo main configuration sync with the SiYuan workspace, while keeping device-bound, PC-only, and heavy runtime files in the local machine directory.

## What Changes

- **BREAKING**: v2.0.0 changes the default read/write location of the built-in PicGo main configuration `picgo.cfg.json` to `[workspace]/data/storage/syp/picgo/picgo.cfg.json`.
- **BREAKING**: v2.0.0 explicitly splits PicGo path semantics: main configuration path, runtime directory, and plugin dependency directory are no longer identical by default.
- `~/.universal-picgo` continues to be the local runtime directory and stores content that is unsuitable for SiYuan sync, including `package.json`, `package-lock.json`, `node_modules/`, `libs/`, `i18n-cli/`, temporary clipboard images, clipboard scripts, and logs.
- `external-picgo-cfg.json` remains in `~/.universal-picgo`, because external PicGo API, whether external PicGo is used, `127.0.0.1`, and similar settings are device-bound state and should not sync with the workspace.
- v2 first startup performs conservative migration: only copy `~/.universal-picgo/picgo.cfg.json` to the missing workspace main configuration file; do not move, delete, or recursively migrate the whole directory.
- When `picgo.cfg.json` exists in both workspace and home locations, workspace configuration wins; the home version is only a historical backup and migration source and does not automatically overwrite workspace.
- `zhi-siyuan-picgo` / external lib needs to expose or internally use a clear path resolution contract, so `siyuan-plugin-publisher` no longer guesses the old path and instead reuses v2's unified path rules.
- README / DEVELOPMENT.md need to be updated with closed-loop v2.0.0 documentation: version positioning, path structure, migration rules, SiYuan plugin tests, and publisher/external lib integration debugging.

## Capabilities

### New Capabilities
- `picgo-v2-path-contract`: defines the path contract and migration behavior for built-in PicGo main configuration, device-local runtime, PicGo plugin dependencies, and external PicGo configuration under v2.0.0.
- `siyuan-publisher-picgo-integration`: defines the path resolution and integration convention exposed by the external lib for `siyuan-plugin-publisher`, preventing publisher from depending directly on historical paths or default guesses.

### Modified Capabilities

- None.

## Impact

- `libs/Universal-PicGo-Core/src/core/UniversalPicGo.ts`: needs to support separating the main configuration path from runtime/plugin directories, avoiding pulling `baseDir` back into the workspace when workspace `configPath` is provided.
- `libs/Universal-PicGo-Core/src/lib/PluginHandler.ts`: current npm install/update/uninstall cwd is bound to `ctx.baseDir`; v2 needs to use the device-local plugin/runtime directory.
- `libs/Universal-PicGo-Core/src/lib/PluginLoader.ts` and `src/db/pluginLoder/index.ts`: continue reading `package.json` and `node_modules` from the device-local `pluginBaseDir`.
- `libs/Universal-PicGo-Core/src/db/config/index.ts`: main configuration continues to be read/written through `ctx.configPath`, but the v2 default path changes.
- `libs/Universal-PicGo-Core/src/db/externalPicGo/index.ts`: external PicGo configuration continues to use device-local `pluginBaseDir` and must not sync with workspace main configuration.
- `libs/Universal-PicGo-Core/src/i18n/index.ts`, `src/utils/clipboard/electron.ts`: i18n and clipboard cache/scripts need to continue writing to the device-local runtime directory.
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts` and `siyuanPicGoUploadApi.ts`: need to replace the old whole-directory migration logic and establish v2 path resolution plus single-file copy migration.
- `packages/picgo-plugin-bootstrap` / `packages/picgo-plugin-app`: SiYuan plugin entry and settings page need to use the same v2 path contract and keep verification limited to the `test` workspace.
- `D:\Users\Administrator\Documents\mydocs\siyuan-plugins\siyuan-plugin-publisher`: later integration test target, needs to use PicGo through the external lib's v2 contract rather than hardcoding the old configuration path.
- Documentation: README, packages/picgo-plugin-app/README.md, and DEVELOPMENT.md need to update v2 path structure, migration rules, and testing/debugging/release notes.
