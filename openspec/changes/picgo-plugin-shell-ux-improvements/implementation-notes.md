## Implementation Notes

### 1. Shell current-state mapping

- Main PicGo topbar entry was registered in `packages/picgo-plugin-bootstrap/src/topbar.ts`.
- The old entry opened `showPage(pluginInstance, PageRoute.Page_Home)`, implemented in `packages/picgo-plugin-bootstrap/src/dialog.ts`.
- `dialog.ts` built `/plugins/siyuan-plugin-picgo/#<route>?pageId=<current-page>` and wrapped it in a new SiYuan `Dialog` with an iframe.
- `PicgoPlugin.openSetting()` in `packages/picgo-plugin-bootstrap/src/index.ts` opened the same dialog path for `PageRoute.Page_Setting`.
- The app bundle bootstraps in `packages/picgo-plugin-app/src/main.ts` and mounts one Vue app to `#app` inside each iframe.

### 2. Previous load/close/reopen behavior

- Every topbar click created a new SiYuan `Dialog`.
- Every dialog contained a new iframe, so every open loaded a fresh `picgo-plugin-app` runtime and a fresh Vue app.
- Dialog close destroyed the iframe implicitly through SiYuan dialog lifecycle, but bootstrap did not own deterministic app/shell teardown.
- Repeated opening could therefore create multiple simultaneous dialogs and repeated iframe runtime initialization.

### 3. Dialog fallback boundary

Must keep:

- existing internal route URL construction and `pageId` propagation
- iframe-hosted app compatibility for emergency/debug use
- settings route compatibility

Fallback only:

- SiYuan dialog sizing/lifecycle is no longer the normal product shell
- dialog opening is exposed as `showDialogPage` and the debug command `openPicgoDialogFallback`

### 4. Migration/init trigger chain

- `picgo-plugin-app/src/utils/SiyuanPicGoClient.ts` calls `SiyuanPicGo.getInstance()`.
- `SiyuanPicGo.getInstance()` resolved paths, created `SiyuanPicgoPostApi`, and waited on `checkConfigMigration()`.
- `SiyuanPicgoPostApi` constructor called `updateConfig()` asynchronously on every new JS runtime.
- Because the old dialog path created a new iframe runtime on each open, routine UI opening could repeat config init/runtime copy work.

Current guard:

- shared top-window migration state keyed by config path, runtime path, plugin path, API URL, and migration version
- state values: `not-started`, `running`, `done`, `failed`
- completed state prevents repeated routine open work
- running state shares the existing promise and avoids concurrent migration
- failed state remains failed until the explicit retry button in PicGo settings calls `retryConfigMigration()`

### 5. Reload-required criteria

Manual reload notice is shown for changes that affect PicGo plugin runtime registration rather than ordinary uploader values:

- installing PicGo plugins
- importing local PicGo plugins
- enabling/disabling PicGo plugins
- uninstalling PicGo plugins
- updating PicGo plugins

No automatic plugin reload is attempted. The UI explains that this is a plugin/SiYuan lifecycle refresh issue, not a failed settings save, and provides manual reload steps.
