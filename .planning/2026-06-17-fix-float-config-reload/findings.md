# 发现记录

## 已知用户反馈
- 配置更新后，悬浮窗每次打开不会重加载，导致修改不生效。
- 示例：test 空间改为阿里云配置后，拖拽上传报错：`[drag-upload] 操作失败=>TypeError: undefined is not iterable (cannot read property Symbol(Symbol.iterator))`。
- test 的 PicGo 配置应位于：`/Volumes/workspace/mydocs/SiYuanWorkspace/test/data/storage/syp/picgo`。
- 使用环境：PC 客户端。

## 调查发现
待补充。

## 2026-06-17 初步代码地图
- 仓库为 pnpm/turbo monorepo，主要包：
  - `packages/picgo-plugin-bootstrap`：思源插件入口/悬浮窗/粘贴上传等。
  - `packages/picgo-plugin-app`：Vue 设置/管理界面。
  - `libs/zhi-siyuan-picgo`、`libs/Universal-PicGo-Core`：PicGo 封装、配置路径、上传核心。
- 已发现粘贴上传前有显式刷新：`packages/picgo-plugin-bootstrap/src/paste/PasteUploadTransaction.ts` 中调用 `this.deps.ctx.reloadConfig()`。
- 需要重点检查拖拽上传是否缺少类似刷新，以及悬浮窗打开是否复用旧 iframe/状态。

## 2026-06-17 关键定位
- `packages/picgo-plugin-bootstrap/src/shell.ts` 的 `openPluginShell()` 只有在 `shellState.pageIndex !== pageIndex` 时才设置 `iframe.src`。关闭/点外部/ESC 走 `hidePluginShell()`，只隐藏 root，不销毁 iframe，因此再次打开同一页面会复用原 iframe、Vue 状态和 PicGo 单例。
- 设置页 `PicgoHelper.savePicgoConfig()` 只更新响应式 `cfg`，通过 `useStorage`/`PicgoStorage` 持久化到 JSON；PicGo runtime 的 `ctx._config` 只有显式 `ctx.reloadConfig()` 才会从 `configPath` 重新读。
- 对照：粘贴上传、图片菜单上传已有 `ctx.reloadConfig()`；悬浮窗内的拖拽上传路径 `DragUpload.vue -> usePicgoUpload.doUploadImageToBed -> SiyuanPicGoClient.getInstance() -> uploadSingleImageToBed()` 没有显式 reload，容易继续使用旧图床配置。
- `UniversalPicGo.reloadConfig()` 会执行 `this._config = this.db.read(true)`；因此在上传前调用它能刷新工作空间 `picgo.cfg.json`。

## 2026-06-17 环境配置核对
- 读取用户给出的 test 工作空间配置：`/Volumes/workspace/mydocs/SiYuanWorkspace/test/data/storage/syp/picgo/picgo.cfg.json`。
- 当前配置确认为 `picBed.current = aliyun`、`picBed.uploader = aliyun`，且 `picBed.aliyun` 与 `uploader.aliyun.defaultId` 均存在。
- `data/plugins/siyuan-plugin-picgo` 是到本仓库 `artifacts/siyuan-plugin-picgo/dist` 的符号链接，构建产物已能被 test 工作空间加载。

## 2026-06-17 修复验证
- `pnpm --filter zhi-siyuan-picgo build` 通过。
- `pnpm --filter picgo-plugin-bootstrap build` 通过。
- `pnpm --filter picgo-plugin-app lint` 通过。
- `pnpm --filter picgo-plugin-app build` 通过；构建仅有既有 chunk size warning 与 Node `fs.Stats` deprecation warning。
- 构建产物 `artifacts/siyuan-plugin-picgo/dist/index.js` 已包含悬浮窗 iframe reload 逻辑。
