# universal-picgo

picgo lib for node, browser and electron

## Usage

```js
// usage
import { UniversalPicGo } from "universal-picgo"

try {
  const picgo = new UniversalPicGo()
  console.log("picgo =>", picgo)

  const result = await picgo.upload()
  console.log("upload success =>", result)
} catch (e: any) {
  console.error(e)
}
```

## Headless manager contract

`universal-picgo` also exports a UI-free manager for external consumers that
own their own settings UI. The manager owns PicGo config shape, uploader schema,
validation, current uploader state and upload execution; consumers should not
copy uploader field definitions from `picgo-plugin-app`.

```ts
import { createPicGoHeadlessManager } from "universal-picgo"

const manager = createPicGoHeadlessManager({
  configPath,
  runtimeDir,
  pluginBaseDir,
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

const result = await manager.upload(input)
```

The public methods are:

- `getConfig()` / `getUploaderConfig(id)`：读取已初始化默认 section 的配置，并保留未知字段。
- `listUploaders()`：列出 `universal-picgo` 注册的内置上传器。
- `getUploaderSchema(id)`：返回普通可序列化的轻量表单字段元数据。
- `validateUploaderConfig(id, config)`：返回结构化字段级校验结果。
- `saveUploaderConfig(id, config, options)`：只写目标 `picBed.<id>` section；`unsafeRaw` 是文档化的高级逃逸口。
- `getCurrentUploader()` / `setCurrentUploader(id)`：使用 PicGo 标准 `picBed.uploader` / `picBed.current` 结构。
- `upload(input)`：上传前使用同一 schema 校验当前上传器配置。

## Deps

```
├── universal-picgo-store
```

## Dev

```bash
pnpm dev -F universal-picgo
```

## Build

```bash
pnpm build -F universal-picgo
```

## Test

Execute the unit tests via [vitest](https://vitest.dev)

```bash
pnpm test -F universal-picgo
```

## Publish

```bash
pnpm publish -F universal-picgo --tag latest
```
