# zhi-siyuan-picgo 

picgo lib for siyuan-note

## Headless consumer usage

`zhi-siyuan-picgo` exposes the SiYuan-specific headless PicGo facade for
external plugins such as Publisher. Consumers only need this npm package and
their own UI; they do **not** need the `siyuan-plugin-picgo` plugin product to
be installed in the workspace.

```ts
import { createSiyuanPicGoHeadlessManager } from "zhi-siyuan-picgo"

const manager = await createSiyuanPicGoHeadlessManager(siyuanConfig, {
  isDev,
})

const uploaders = manager.listUploaders()
const schema = manager.getUploaderSchema("github")

const validation = manager.saveUploaderConfig(
  "github",
  {
    repo,
    branch,
    token,
    path,
    customUrl,
  },
  { setCurrent: true }
)

if (!validation.ok) {
  console.error(validation.errors)
}

const uploaded = await manager.upload(input)
const replaced = await manager.uploadMarkdownImages(pageId, attrs, mdContent)
```

SiYuan path resolution is handled internally by the same v2 path contract used
by the standalone PicGo plugin shell:

```text
configPath    = [workspace]/data/storage/syp/picgo/picgo.cfg.json
baseDir       = ~/.universal-picgo
pluginBaseDir = ~/.universal-picgo
```

This package provides config/schema/validation/upload behavior only. It does
not provide a shared Vue settings UI, does not require the PicGo plugin product,
and does not implement a full third-party PicGo plugin marketplace UI for
external consumers.

## Publish

```bash
pnpm publish -F zhi-siyuan-picgo --tag latest
```
