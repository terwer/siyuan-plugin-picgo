# 调查发现：无本地图片时跳过 uploader 配置校验

## 一、根因（Publisher issue #2050 上游部分）

`libs/zhi-siyuan-picgo/src/lib/SiyuanPicGoHeadlessManager.ts` L84-96：

```ts
async uploadMarkdownImages(pageId: string, attrs: any, mdContent: string): Promise<PicgoPostResult> {
  const uploaderId = await this.getCurrentUploader()
  const validation = this.validateUploaderConfig(uploaderId, await this.getUploaderConfig(uploaderId))
  if (!validation.ok) {
    throw new PicGoHeadlessError({
      code: PICGO_HEADLESS_ERROR_CODES.VALIDATION_FAILED,
      uploaderId,
      message: `Uploader "${uploaderId}" config is invalid`,
      errors: validation.errors,
    })
  }
  return this.postApi.uploadPostImagesToBed(pageId, attrs, mdContent)
}
```

- uploader 校验是无条件的、先于图片检测的
- 用户环境（Publisher issue #2050）：当前 uploader = smms（默认），配置为空/无效（PicGo app 模式未运行）
- → 文章无图片时也直接抛 `Uploader "smms" config is invalid`
- → 下游源码模式报错且 YAML/md 不渲染；发布链路误报「图片上传存在 N 个错误」

## 二、底层已有正确的无图短路（修复的对齐目标）

`libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts` `uploadPostImagesToBed`（L240-340）：

```ts
const imageBlocks: any[] = await this.siyuanApi.getImageBlocksByID(pageId)   // SQL: root_id + markdown like '%![%'
let uniqueLocalImages: ParsedImage[] = []
imageBlocks.forEach((page) => {
  const parsedLocalImages = this.imageParser.parseLocalImagesToArray(mdContent)  // 只挑 assets/ 本地图片
  uniqueLocalImages = [...new Set([...uniqueLocalImages, ...parsedLocalImages])]
  uniqueLocalImages = uniqueLocalImages.map((image) => ({ ...image, blockId: page.id }))
})
if (uniqueLocalImages.length === 0) {
  ret.flag = false
  ret.hasImages = false
  ret.mdContent = mdContent
  ret.errmsg = "文章中没有图片"
  return ret            // ← 无图片直接返回，绝不上传
}
// 有图片 → doConvertImagesToImagesItemArray → uploadSingleImageToBed 循环 → 链接替换
```

- 检测判据：`getImageBlocksByID`（`SiyuanKernelApi`，SQL `select * from blocks where root_id='{id}' and markdown like '%![%'`）+ `parseLocalImagesToArray`（正则 `/!\[([^[\]]*)]\((assets\/.*?)\s*(?:(?:"([^"]*)")|(?:'([^']*)'))?\)/g`，`ImageParser.ts:198`）
- 即：无本地图片时底层从不做任何上传；本修复就是让 uploader 校验不挡在这条短路前面

## 三、调用点分析（改动影响面）

| 方法 | 调用点 | 说明 |
| --- | --- | --- |
| `uploadMarkdownImages` | Publisher `usePublisherPicgoManager` → `usePicgoBridge.handlePicgo`（源码模式 & 发布预处理） | 唯一消费者 |
| `uploadPostImagesToBed` | 仅 `SiyuanPicGoHeadlessManager.uploadMarkdownImages` | 无其它调用点 |
| `SiyuanPicgoPostApi.siyuanApi` | `public readonly`（L45） | manager 可直接访问做前置检测 |

## 四、修复设计（U1）

1. `SiyuanPicgoPostApi` 新增 public 方法（把 `uploadPostImagesToBed` 中 L243-258 检测逻辑原样抽出）：
   ```ts
   public async parsePostLocalImages(pageId: string, mdContent: string): Promise<ParsedImage[]>
   ```
   `uploadPostImagesToBed` 内部改调该方法（单点逻辑，无漂移）
2. `SiyuanPicGoHeadlessManager.uploadMarkdownImages`：
   ```ts
   const localImages = await this.postApi.parsePostLocalImages(pageId, mdContent)
   if (localImages.length > 0) {
     // 确有图片要上传时才校验 uploader 配置（issue #2050：无图片不校验）
     const uploaderId = await this.getCurrentUploader()
     const validation = this.validateUploaderConfig(uploaderId, await this.getUploaderConfig(uploaderId))
     if (!validation.ok) throw new PicGoHeadlessError({ ... })
   }
   return this.postApi.uploadPostImagesToBed(pageId, attrs, mdContent)
   ```
- 语义：无本地图片（无论何种原因）都不校验；有本地图片时保持原有字段级错误体验
- 无图片时检测运行两次（manager 一次 + `uploadPostImagesToBed` 一次）——均为本地 SQL+正则，毫秒级，可接受

## 五、契约与流程约束

- `openspec/specs/picgo-publisher-integration-contract`：
  - Publisher 集成前 PicGo 库须已可用（正式 release 或明确本地链接）
  - uploader 校验职责在 PicGo 库（本修复归上游）
- 发版流程（DEVELOPMENT_zh_CN.md「库包发布」）：
  ```bash
  pnpm --dir libs/Universal-PicGo-Store build
  pnpm --dir libs/Universal-PicGo-Core build
  pnpm --dir libs/zhi-siyuan-picgo build
  pnpm --dir libs/zhi-siyuan-picgo pack     # 内容检查
  pnpm --dir libs/zhi-siyuan-picgo publish --access public
  ```
- 本地集成验证（Publisher 侧，DEVELOPMENT_zh_CN.md「Publisher 本地集成验证」）：
  ```bash
  PACK_DIR=/tmp/picgo-headless-packs
  pnpm --dir libs/zhi-siyuan-picgo pack --pack-destination "$PACK_DIR"
  pnpm --dir <publisher> add "$PACK_DIR"/zhi-siyuan-picgo-*.tgz
  ```
  （依赖顺序 Universal-PicGo-Store → Universal-PicGo-Core → zhi-siyuan-picgo；若改动仅涉 zhi-siyuan-picgo 且其依赖未变，可只打包该包）
