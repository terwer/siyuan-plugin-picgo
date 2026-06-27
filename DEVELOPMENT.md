[中文](DEVELOPMENT_zh_CN.md)

# Development Guide

## Requirements

- Node.js and pnpm version matching `packageManager` in `package.json`
- Python 3 for plugin app build scripts and local link scripts
- SiYuan desktop app for plugin runtime verification

Install dependencies from the repository root:

```bash
pnpm install
```

## Workspace Packages

| Package | Path | Description |
| --- | --- | --- |
| `universal-picgo-store` | `libs/Universal-PicGo-Store` | JSON file and localStorage storage layer |
| `universal-picgo` | `libs/Universal-PicGo-Core` | PicGo core, built-in uploaders, headless config/upload manager |
| `zhi-siyuan-picgo` | `libs/zhi-siyuan-picgo` | SiYuan adapter, path resolution, upload API, Markdown image replacement |
| `picgo-plugin-app` | `packages/picgo-plugin-app` | Vue settings UI for the SiYuan plugin |
| `picgo-plugin-bootstrap` | `packages/picgo-plugin-bootstrap` | SiYuan plugin entry, menus, status bar, paste upload integration |

Dependency order:

```text
universal-picgo-store
  -> universal-picgo
    -> zhi-siyuan-picgo
      -> picgo-plugin-app
      -> picgo-plugin-bootstrap
```

Use package names with `-F`; do not use directory names.

## Development

### Package watch commands

```bash
pnpm dev -F universal-picgo-store
pnpm dev -F universal-picgo
pnpm dev -F zhi-siyuan-picgo
pnpm dev -F picgo-plugin-app
pnpm dev -F picgo-plugin-bootstrap
```

### Default plugin business workflow

For SiYuan plugin business changes, library packages usually do not need watch mode. Build the dependency chain once:

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
pnpm build -F picgo-plugin-app
```

Then watch only the plugin entry package:

```bash
pnpm dev -F picgo-plugin-bootstrap
```

Use this workflow for:

- plugin entry logic
- menu, status bar, command registration
- paste upload flow
- business orchestration using existing PicGo APIs

Start `pnpm dev -F ...` for library packages only when their source code changes.

### Core uploader or headless manager changes

```bash
pnpm dev -F universal-picgo
pnpm dev -F zhi-siyuan-picgo
```

Add the settings UI when the change must be verified through the plugin settings page:

```bash
pnpm dev -F picgo-plugin-app
```

Add the plugin entry package when the change must be verified through SiYuan menus, paste upload, or runtime plugin actions:

```bash
pnpm dev -F picgo-plugin-bootstrap
```

### SiYuan adapter changes

```bash
pnpm dev -F zhi-siyuan-picgo
pnpm dev -F picgo-plugin-app
pnpm dev -F picgo-plugin-bootstrap
```

### Settings UI changes

```bash
pnpm dev -F picgo-plugin-app
```

Browser preview:

```bash
pnpm serve -F picgo-plugin-app
```

Browser preview is for layout and form behavior. Runtime behavior must be verified in SiYuan.

## Build

Build all packages:

```bash
pnpm build
```

Build one package:

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
pnpm build -F picgo-plugin-app
pnpm build -F picgo-plugin-bootstrap
```

After changing public types, exports, or shared library code, rebuild the library chain first:

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
```

Then build plugin packages if needed:

```bash
pnpm build -F picgo-plugin-app
pnpm build -F picgo-plugin-bootstrap
```

## Test

Library tests:

```bash
pnpm --dir libs/Universal-PicGo-Store exec vitest run
pnpm --dir libs/Universal-PicGo-Core exec vitest run
pnpm --dir libs/zhi-siyuan-picgo exec vitest run
```

Headless manager tests:

```bash
pnpm --dir libs/Universal-PicGo-Core exec vitest run src/headless/UniversalPicGoHeadlessManager.spec.ts
```

OpenSpec validation:

```bash
openspec validate <change-id> --strict
```

Example:

```bash
openspec validate picgo-headless-publisher-contract --strict
```

## Local SiYuan Plugin Verification

Build plugin artifacts:

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
pnpm build -F picgo-plugin-app
pnpm build -F picgo-plugin-bootstrap
```

Artifacts are written to:

```text
artifacts/siyuan-plugin-picgo/dist
```

Link artifacts to the SiYuan `test` workspace:

```bash
pnpm makeLink
```

Requirements:

- SiYuan is running.
- Select only the `test` workspace.
- Link target is `artifacts/siyuan-plugin-picgo/dist`.

Verification checklist:

1. Plugin loads successfully.
2. PicGo settings page opens.
3. Current uploader config can be saved.
4. Image upload works from the existing plugin UI.
5. Markdown local image links are replaced with remote image links.
6. Workspace config directory contains main config only, not runtime files.

Workspace main config:

```text
[workspace]/data/storage/syp/picgo/picgo.cfg.json
```

Local runtime directory:

```text
~/.universal-picgo/
```

## PicGo v2 Config Paths

Main config is stored in the SiYuan workspace:

```text
[workspace]/data/storage/syp/picgo/picgo.cfg.json
```

Device-local runtime files stay in:

```text
~/.universal-picgo/
```

Device-local runtime files include:

- `external-picgo-cfg.json`
- PicGo third-party plugin dependencies
- `node_modules`
- runtime libs
- i18n files
- clipboard cache
- logs
- platform scripts

Migration rules:

- Use existing workspace `picgo.cfg.json`; do not overwrite it.
- If workspace `picgo.cfg.json` is missing and `~/.universal-picgo/picgo.cfg.json` exists, copy only that config file.
- Do not delete the old local config.
- Do not migrate the whole runtime directory.
- Do not write local runtime files into the workspace config directory.

## Headless PicGo API

### Universal entry

`universal-picgo` provides the platform-neutral headless manager:

```ts
import { createPicGoHeadlessManager } from "universal-picgo"

const picgo = createPicGoHeadlessManager({
  configPath,
  runtimeDir,
  pluginBaseDir,
})

const uploaders = picgo.listUploaders()
const schema = picgo.getUploaderSchema("github")
const validation = picgo.saveUploaderConfig("github", config, { setCurrent: true })
const result = await picgo.upload(input)
```

### SiYuan entry

`zhi-siyuan-picgo` provides the SiYuan facade:

```ts
import { createSiyuanPicGoHeadlessManager } from "zhi-siyuan-picgo"

const picgo = await createSiyuanPicGoHeadlessManager(siyuanConfig, { isDev })

const uploaders = picgo.listUploaders()
const schema = picgo.getUploaderSchema("github")
const result = await picgo.upload(input)
const postResult = await picgo.uploadMarkdownImages(pageId, attrs, mdContent)
```

### Boundaries

PicGo libraries own:

- uploader list
- uploader config schema
- config persistence format
- field-level validation
- current uploader state
- upload behavior
- SiYuan path resolution

External consumers own:

- their settings UI
- product-level preferences
- publishing workflow logic

External consumers do not need the installed `siyuan-plugin-picgo` plugin product.

`picgo-plugin-app` is this plugin's settings UI. It is not a shared UI package.

Third-party PicGo plugin marketplace UI is outside the headless contract.

## Publisher Local Integration Smoke Test

Build PicGo libraries:

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
```

Create local tarballs:

```bash
PACK_DIR=/tmp/picgo-headless-packs
mkdir -p "$PACK_DIR"

pnpm --dir libs/Universal-PicGo-Store pack --pack-destination "$PACK_DIR"
pnpm --dir libs/Universal-PicGo-Core pack --pack-destination "$PACK_DIR"
pnpm --dir libs/zhi-siyuan-picgo pack --pack-destination "$PACK_DIR"
```

Install the tarballs in the Publisher repository:

```bash
pnpm --dir /path/to/siyuan-plugin-publisher add "$PACK_DIR"/universal-picgo-store-*.tgz
pnpm --dir /path/to/siyuan-plugin-publisher add "$PACK_DIR"/universal-picgo-*.tgz
pnpm --dir /path/to/siyuan-plugin-publisher add "$PACK_DIR"/zhi-siyuan-picgo-*.tgz
```

Publisher integration must use the `zhi-siyuan-picgo` headless contract. It must not depend on an installed `siyuan-plugin-picgo` plugin product.

## Release

### Plugin product

```bash
pnpm install
pnpm prepareRelease
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
pnpm package
```

Plugin artifacts:

```text
build/siyuan-plugin-picgo-<version>.zip
build/package.zip
```

### Library packages

Build before publishing:

```bash
pnpm --dir libs/Universal-PicGo-Store build
pnpm --dir libs/Universal-PicGo-Core build
pnpm --dir libs/zhi-siyuan-picgo build
```

Inspect package contents:

```bash
pnpm --dir libs/Universal-PicGo-Store pack
pnpm --dir libs/Universal-PicGo-Core pack
pnpm --dir libs/zhi-siyuan-picgo pack
```

Publish in dependency order:

```bash
pnpm --dir libs/Universal-PicGo-Store publish --access public
pnpm --dir libs/Universal-PicGo-Core publish --access public
pnpm --dir libs/zhi-siyuan-picgo publish --access public
```

## Clean

```bash
pnpm clean
```
