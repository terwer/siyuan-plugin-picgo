## 1. Core path contract

- [x] 1.1 Inventory the current initialization and call sites of `configPath`, `baseDir`, `pluginBaseDir`, and `zhiNpmPath` in `UniversalPicGo`, and confirm which calls must continue using local runtime.
- [x] 1.2 Add v2 path options normalization capability to `UniversalPicGo` while keeping compatibility with the old constructor signature.
- [x] 1.3 Adjust the default Node runtime/plugin directory to `~/.universal-picgo`, and ensure passing workspace `configPath` does not automatically change `baseDir` to `dirname(configPath)`.
- [x] 1.4 Ensure `ConfigDb` continues reading and writing the main configuration `picgo.cfg.json` only through `ctx.configPath`.
- [x] 1.5 Ensure `ExternalPicgoConfigDb` continues reading and writing `external-picgo-cfg.json` through local `pluginBaseDir`.

## 2. Runtime and plugin directory fixes

- [x] 2.1 Check and fix clipboard image cache and clipboard script paths, ensuring they write to `~/.universal-picgo`.
- [x] 2.2 Check and fix i18n external file paths, ensuring `i18n-cli` writes to `~/.universal-picgo`.
- [x] 2.3 Check and fix zhi-infra/libs initialization paths, ensuring `libs/` writes to `~/.universal-picgo`.
- [x] 2.4 Fix the cwd of PicGo plugin install, uninstall, and update commands, ensuring `package.json`, `package-lock.json`, and `node_modules/` use the local plugin directory.
- [x] 2.5 Fix plugin list reading logic, ensuring it reads `pluginBaseDir/node_modules` instead of the workspace configuration directory.

## 3. SiYuan adapter migration

- [x] 3.1 Compute `[workspace]/data/storage/syp/picgo/picgo.cfg.json` from `workspaceDir` in `zhi-siyuan-picgo`.
- [x] 3.2 Explicitly pass workspace `configPath` and local runtime/plugin directories when initializing built-in PicGo.
- [x] 3.3 Remove or disable the old whole-directory migration logic, forbidding migration of the whole `[workspace]/data/storage/syp/picgo` directory to `~/.universal-picgo`.
- [x] 3.4 Implement v2 conservative single-file migration: when workspace configuration is missing and home configuration exists, only copy `picgo.cfg.json` and do not delete the source file.
- [x] 3.5 Handle the case where both workspace and home configuration exist: workspace wins and is not overwritten.
- [x] 3.6 Add initialization logs or debug output showing the actual `configPath`, runtime/baseDir, and `pluginBaseDir`.

## 4. External lib and publisher contract

- [x] 4.1 Design and implement v2 options for `SiyuanPicGo.getInstance` / related entrypoints, supporting default path resolution and explicit path overrides.
- [x] 4.2 Ensure default external lib calls only need `SiyuanConfig` to use the v2 path contract.
- [x] 4.3 Ensure debug mode can explicitly pass `configPath`, runtime/baseDir, and `pluginBaseDir`.
- [x] 4.4 Prepare `siyuan-plugin-publisher` integration verification instructions, clarifying that publisher no longer hardcodes historical PicGo configuration paths.

## 5. Documentation updates

- [x] 5.1 Update the root README: explain that v2.0.0 is a breaking cleanup version containing internal refactor and path split.
- [x] 5.2 Update the root README path structure: distinguish before 1.5.6, 1.6.0+, and 2.0.0.
- [x] 5.3 Update the same kind of path documentation in `packages/picgo-plugin-app/README.md`.
- [x] 5.4 Update `DEVELOPMENT.md`: add v2 SiYuan plugin test steps, path verification steps, and publisher external lib integration debugging steps.
- [x] 5.5 Clearly document that `external-picgo-cfg.json`, PicGo third-party plugins, `node_modules`, cache, and logs do not sync with the workspace.

## 6. Verification

- [x] 6.1 Add or update automated audit to check that the workspace configuration directory must not contain `node_modules`, `package-lock.json`, clipboard cache, or runtime scripts.
- [x] 6.2 Add or update unit/script tests covering single-file copy migration from home cfg to workspace cfg.
- [x] 6.3 Add or update tests covering that existing workspace cfg is not overwritten by home cfg.
- [x] 6.4 Run related package builds to confirm v2 path changes do not break core, store, app, bootstrap, or zhi-siyuan-picgo builds.
- [x] 6.5 Run real settings save and upload smoke in the SiYuan `test` workspace, verifying that main configuration writes to workspace and upload succeeds.
- [x] 6.6 Verify that `~/.universal-picgo` still stores external PicGo configuration, plugin dependencies, and runtime files.
- [x] 6.7 Run external lib integration smoke in the publisher project, verifying that publisher reads workspace main configuration through the v2 contract and uses local runtime.
