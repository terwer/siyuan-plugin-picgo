## Context

v2.0.0 is an intentional breaking cleanup release with two layers of meaning:

1. The completed PicGo internal refactor, which lays the foundation for long-term maintenance, the paste flow, and internal/external reuse.
2. The path contract split added by this change, used to fix the multi-device configuration sync problem caused by 1.6.0+ moving all PicGo state to `~/.universal-picgo`.

The main state of current 1.6.0+ is:

```text
~/.universal-picgo/
  picgo.cfg.json
  external-picgo-cfg.json
  package.json
  package-lock.json
  node_modules/
  libs/
  i18n-cli/
  picgo-clipboard-images/
  *.script
  picgo.log
```

This design avoided the pre-1.5.6 problem where `node_modules`, cache, and runtime scripts were placed in `[workspace]/data/storage/syp/picgo` and slowed down SiYuan sync, but it also moved the most sync-worthy `picgo.cfg.json` out of the workspace.

`picgo.cfg.json` is the main configuration file for built-in PicGo after adaptation by this plugin and supports multiple SiYuan environments, so it is suitable to sync across devices with the SiYuan workspace. In contrast, PicGo third-party plugins currently work only in PC environments, and the settings page cannot be fully used in non-PC scenarios; external PicGo configuration also contains device-bound state such as the `127.0.0.1` API and whether to use external PicGo, so it should not sync.

In current code, `UniversalPicGo` tightly binds `configPath` and `baseDir`: when a custom `configPath` is passed, `baseDir = dirname(configPath)`. If `configPath` is directly changed back to the workspace, clipboard cache, i18n, libs, plugin install cwd, and other runtime content will be moved back into the workspace together, violating the v2 goal.

## Goals / Non-Goals

**Goals:**

- v2 defaults to writing the built-in PicGo main configuration to `[workspace]/data/storage/syp/picgo/picgo.cfg.json`.
- Continue storing PC-only, device-bound, and heavy runtime files in `~/.universal-picgo`.
- Clearly separate path semantics: main configuration path, runtime directory, PicGo plugin dependency directory, and external PicGo configuration directory must no longer be implicitly treated as one directory.
- When migrating 1.6.0+ users, copy only the main configuration file; do not move, delete, or recursively migrate the whole directory.
- Let `siyuan-plugin-publisher` use PicGo through the external lib's v2 contract, avoiding publisher hardcoding historical paths.
- README, DEVELOPMENT.md, and package README clearly explain v2 path structure, migration rules, and executable test steps.

**Non-Goals:**

- Do not put `node_modules`, `package.json`, `package-lock.json`, cache, logs, or clipboard scripts back into the SiYuan workspace.
- Do not sync `external-picgo-cfg.json`, and do not let external PicGo API selection sync with the workspace.
- Do not automatically merge two different `picgo.cfg.json` files from workspace and home.
- Do not delete the user's existing `~/.universal-picgo/picgo.cfg.json`, avoiding impact on historical rollback or other callers.
- Do not make non-PC PicGo plugin management fully available; v2 only defines the correct path boundary.

## Decisions

### 1. Split paths into synced config and local runtime

v2 path structure:

```text
[workspace]/data/storage/syp/picgo/
  picgo.cfg.json                 # built-in PicGo main configuration, can sync with SiYuan

~/.universal-picgo/
  external-picgo-cfg.json         # external PicGo / API selection, local state
  package.json                    # PicGo plugin installation state, local PC-only
  package-lock.json
  node_modules/
  libs/
  i18n-cli/
  picgo-clipboard-images/
  mac.applescript / windows.ps1 / windows10.ps1 / linux.sh / wsl.sh
  picgo.log
```

Reason: configuration is small and valuable across devices; dependencies, cache, scripts, and logs are either large, device-related, or PC-only.

Alternatives:

- Put everything back into workspace: reintroduces the pre-1.5.6 slow-sync problem.
- Keep everything in home: keeps the 1.6.0+ status quo, but image-host configuration does not sync across devices.
- Also sync `external-picgo-cfg.json`: would sync device-bound state such as `127.0.0.1`, easily causing misuse across devices.

### 2. Core needs explicit runtime/plugin paths and must no longer derive all paths from configPath

`UniversalPicGo` needs the ability to express:

```text
configPath     = workspace/data/storage/syp/picgo/picgo.cfg.json
runtimeDir     = ~/.universal-picgo
pluginBaseDir  = ~/.universal-picgo
zhiNpmPath     = ~/.universal-picgo/libs or compatible with existing initialization logic
```

Implementation can use backward-compatible constructor overloads or an options object. Prefer adding an options object while preserving the old constructor signature for external callers:

```ts
new UniversalPicGo({
  configPath,
  runtimeDir,
  pluginBaseDir,
  zhiNpmPath,
  isDev,
})
```

At the same time, the old signature `new UniversalPicGo(configPath, pluginBaseDir, zhiNpmPath, isDev)` can remain compatible, but internally normalize to the same path object.

Key requirement: when `configPath` points to the workspace, `baseDir`/runtime write locations must not automatically become the workspace.

### 3. Device-local runtime uses runtimeDir, third-party plugins use pluginBaseDir

Several current logic paths use `ctx.baseDir`:

- Clipboard images and scripts: should use device-local runtimeDir.
- i18n external files: should use device-local runtimeDir.
- zhi-infra/libs: should use device-local runtimeDir.
- npm install/update/uninstall cwd: should use pluginBaseDir or runtime/plugin directory, not the workspace configuration directory.
- Reading `node_modules` for plugin list display: should use pluginBaseDir.

To reduce change scope, v2 can first adjust `ctx.baseDir` semantics to mean "device-local runtime directory", while `ctx.configPath` independently points to the workspace main configuration. This lets most runtime logic depending on `baseDir` avoid migration to a new field, but the old logic of "when configPath is passed, baseDir = dirname(configPath)" must be fixed.

### 4. SiYuan adapter layer owns workspace path resolution and migration

`zhi-siyuan-picgo` understands SiYuan's `workspaceDir` better than core. Therefore the v2 default path should be resolved by the SiYuan adapter layer:

```text
workspaceConfigDir = workspaceDir/data/storage/syp/picgo
workspaceConfigPath = workspaceConfigDir/picgo.cfg.json
homeRuntimeDir = ~/.universal-picgo
```

The adapter layer explicitly passes these paths when creating `SiyuanPicGoUploadApi` / `UniversalPicGo`.

If there is no SiYuan `workspaceDir`, such as in a pure browser or abnormal external environment, keep the existing fallback and do not invent an unknown workspace path.

### 5. Migration only copies picgo.cfg.json, workspace wins

v2 startup migration rules:

```text
workspace cfg exists:
  use workspace cfg
  do not overwrite from home

workspace cfg missing && home cfg exists:
  copy home cfg to workspace cfg
  keep home cfg unchanged

both missing:
  create empty/default workspace cfg through existing JSONStore behavior

both exist but differ:
  workspace wins
  home remains as backup only
```

Continue forbidding copy/move of the entire `[workspace]/data/storage/syp/picgo` directory to `~/.universal-picgo`, and forbid deleting the source directory after migration.

### 6. publisher no longer guesses paths and switches to external lib v2 contract

`D:\Users\Administrator\Documents\mydocs\siyuan-plugins\siyuan-plugin-publisher` should later obtain PicGo capability through the unified entrypoint of `zhi-siyuan-picgo`. publisher should not hardcode:

```text
widgets/sy-post-publisher/lib/picgo/picgo.cfg.json
```

and should not directly guess `~/.universal-picgo/picgo.cfg.json`.

Recommended external lib capabilities are one of these two categories:

- Default mode: pass `SiyuanConfig`; internally resolve v2 paths from the workspace automatically.
- Debug/advanced mode: allow explicitly passing `configPath`, `runtimeDir`, and `pluginBaseDir`.

### 7. v2 documentation must clearly explain version positioning

Documentation needs to clarify:

- v2.0.0 is a breaking cleanup release.
- v2 includes the previous internal refactor result and this path split.
- Path differences before 1.5.6, in 1.6.0+, and in 2.0.0.
- Which files sync, which files do not sync, and why.
- How to test in the SiYuan `test` workspace.
- How to debug the external lib in publisher.

## Risks / Trade-offs

- [Risk] Old code still treats `baseDir` as the configuration directory, causing runtime files to be accidentally written back into workspace.
  → Mitigation: clearly define `baseDir` as local runtimeDir in v2; add audit/test checks that `node_modules`, `picgo-clipboard-images`, scripts, and i18n do not enter the workspace configuration directory.

- [Risk] The workspace and home copies of `picgo.cfg.json` conflict, and users mistakenly think home still takes effect.
  → Mitigation: documentation states workspace wins; startup logs output the actual `configPath`, `baseDir`, and `pluginBaseDir`; show the current configuration file path in the settings page if necessary.

- [Risk] publisher still uses historical hardcoded paths, causing tests to read the wrong configuration.
  → Mitigation: external lib docs and DEVELOPMENT.md provide the publisher debugging entrypoint; later replace path guessing on the publisher side.

- [Risk] Constructor signature changes affect external callers.
  → Mitigation: keep old signature compatibility and add an options object as the recommended v2 API.

- [Risk] Migration copy overwrites a user-created workspace configuration.
  → Mitigation: copy from home only when workspace configuration does not exist; never overwrite when it exists.

- [Risk] Non-PC or browser runtime lacks Node filesystem capability.
  → Mitigation: file path split only applies in Node/SiYuan desktop environments; browser localStorage keeps the existing mechanism and is documented separately.

## Migration Plan

1. Introduce path normalization in core: `configPath` is independent, `baseDir`/runtimeDir default to `~/.universal-picgo`, and `pluginBaseDir` defaults to `~/.universal-picgo`.
2. Compute the workspace main configuration path from `workspaceDir` in the SiYuan adapter layer and create the directory.
3. Replace the old whole-directory migration logic with single-file copy migration.
4. Check and fix all plugin installation, plugin reading, i18n, and clipboard script/cache usage of path fields.
5. Update README, package README, and DEVELOPMENT.md.
6. Verify in the SiYuan `test` workspace: configuration writes to workspace, runtime heavy files stay in home, and upload flow works normally.
7. Then perform publisher external lib integration verification.

Rollback idea: because v2 migration does not delete the old home configuration, the default `configPath` can be switched back to `~/.universal-picgo/picgo.cfg.json` if necessary; the workspace configuration file remains as a copy and does not destroy old data.

## Open Questions

- Should the settings page display the actual current `picgo.cfg.json` path to help users confirm v2 behavior?
- Does the publisher side need an explicit API returning current path information, such as `getPicgoPaths()`, for debugging and documentation screenshots?
- Does browser localStorage need additional sync documentation relative to Node file configuration, or should the existing runtime boundary continue unchanged?
