# 发现记录

## 待记录

- 公共 API/manifest/package export/config/storage 基线。
- 构建、lint、test、bundle audit 基线。
- product/library/runtime/paste ownership 的代码证据与改动证据。


## 2026-05-23 Apply 阶段 1 基线发现

### 公共入口与 manifest

- 根 `plugin.json`：`name=siyuan-plugin-picgo`，`version=1.12.1`，`minAppVersion=2.9.0`，backends 包含 desktop/docker/mobile 等，frontends 包含 desktop/mobile/browser。
- 根 `package.json`：同名同版本，脚本由 turbo 和 Python package/version 脚本编排。
- `packages/picgo-plugin-bootstrap/src/index.ts`：SiYuan 插件入口，默认导出 `PicgoPlugin extends Plugin`，负责 topbar/statusbar/settings/paste/open-menu-image。
- `packages/picgo-plugin-app/src/main.ts`：Vue app 入口，作为插件 iframe/settings/upload UI。

### Workspace public package contracts

- `universal-picgo`：`main=./dist/index.js`，`typings=./dist/index.d.ts`，源入口 `libs/Universal-PicGo-Core/src/index.ts`，当前公共导出含 `UniversalPicGo`、`ExternalPicgo`、`picgoEventBus`、`ConfigDb`、`PluginLoaderDb`、`ExternalPicgoConfigDb`、`PicgoTypeEnum`、`IBusEvent`、`isFileOrBlob`、`calculateMD5`、`isSiyuanProxyAvailable`、`win/currentWin/parentWin/hasNodeEnv` 及多项类型。
- `universal-picgo-store`：`main=./dist/index.js`，源入口 `libs/Universal-PicGo-Store/src/index.ts`，当前公共导出含 `JSONStore`、`win/currentWin/parentWin/hasNodeEnv`、`IJSON`。
- `zhi-siyuan-picgo`：`main=./dist/index.js`，源入口 `libs/zhi-siyuan-picgo/src/index.ts`，当前公共导出含 `SiyuanPicGo`、`SiyuanPicgoPostApi`、`PicgoHelper`、`ImageItem`、`ImageParser`、`SIYUAN_PICGO_FILE_MAP_KEY`、`replaceImageLink`、PicGo db/types/runtime 转出口等。

### 关键配置/存储合同

- 设置页默认值：`siyuan.waitTimeout ?? 2`、`siyuan.retryTimes ?? 5`、`siyuan.autoUpload ?? true`、`siyuan.replaceLink ?? true`、`siyuan.txtImageSwitch ?? false`。
- 外部 PicGo 配置字段：`extPicgoApiUrl`、`useBundledPicgo` 等由 `ExternalPicgoConfigDb` 管理。
- 元数据 key：`custom-picgo-file-map-key`（`SIYUAN_PICGO_FILE_MAP_KEY`）。
- 历史迁移路径：`[workspace]/data/storage/syp/picgo`；当前 PicGo 基础路径来自 `UniversalPicGo` 默认 `~/.universal-picgo`，并包含 `package.json/package-lock.json/node_modules` 等插件生态状态。

### 现有 product/lib 冲突证据

- `packages/picgo-plugin-bootstrap/src/index.ts` 当前存在 `import { replaceImageLink } from "zhi-siyuan-picgo/src"` 深层源码 import。
- `libs/zhi-siyuan-picgo/src/lib/utils/utils.ts` import `element-plus` 与 `vue`；`picgoHelper.ts` import `readonly` from `vue` 并访问 Electron remote/插件管理。
- `universal-picgo` 主入口转出 `win/hasNodeEnv`，`zhi-siyuan-picgo` 再转出 `win`。
- `SiyuanPicGo` 使用静态单例；`UniversalPicGo` 构造中初始化 db、request、内置插件、第三方插件 loader。
- `PluginHandler` 在 core 中执行 npm install/uninstall/update，属于宿主/product 能力进入 core。

### 粘贴上传旧路径证据

- `picturePasteEventListener` 未调用 `detail.source.preventDefault()`。
- 当前 paste 主路径：PicGo `uploadSingleImageToBed(..., ignoreReplaceLink=true)` → `handleAfterUpload` → `JsTimer` 轮询 → `siyuanApi.uploadAsset(formData)` 二次上传 → DOM `document.querySelector(img[src])` 查块 → `getBlockByID/updateBlock` 替换 markdown。

## 2026-05-23 阶段 2 发现补充

- 已读取各包 Vite 配置、app build/dev 脚本、`scripts/package.py`、`DEVELOPMENT.md`，确认产品 bundle 与 lib bundle 当前共享 workspace dist/build 顺序但未区分 target-specific exports。
- 已扫描 `insertBlock`/`appendBlock`/`protyle`/`preventDefault` 等关键词；当前仓库没有已封装的“阻断默认粘贴后插入当前光标”的 API，只能看到 `updateBlock` 旧替换路径和 `detail.protyle` 事件上下文。
- 已读取 `SiyuanPicGo` 静态单例、ConfigDb、ExternalPicgoConfigDb，确认 lifecycle/reset 当前未显式暴露。
- 设计阶段可以落文档和低风险代码改造；真实宿主插入 API spike 预计需要 SiYuan 宿主或官方 API 证据，当前本地仓库不足以证明。

## 2026-05-23 Paste 事务改造发现

- 旧 paste 主路径已从 bootstrap 移除：源码中不再有 bootstrap paste `uploadAsset`/`JsTimer`/`doUpdatePictureMetadata`/`handleAfterUpload`。
- 新事务仍临时复用 `uploadSingleImageToBed(..., ignoreReplaceLink=true)` 作为 PicGo 上传 primitive，但 `SiyuanPicgoPostApi` 在该分支已不写 metadata；metadata 由 `MetadataRepository` 在文档插入成功后统一提交。
- `DocumentMutationPort` 使用 `/api/block/insertBlock`（经 `siyuanApi.insertBlock` 或 `siyuanApi.siyuanRequest` fallback）写入最终远端 markdown。真实插入位置目前为 `previousID = targetBlockId`、`parentID = pageId`，需要真实 SiYuan smoke 验证是否满足“当前光标/目标块”期望。
- 由于当前环境没有 SiYuan host automation，3.3/3.3.1/3.3.2/3.3.3 暂不能标记完成。
## 2026-05-23 bundle audit 根因补充

- `file-type@16.5.4` 只在 `libs/Universal-PicGo-Core/src/plugins/uploader/s3/utils.ts` 使用，用于无 contentType 时从 buffer 探测 MIME；该依赖链带入 `eval("require")("stream")`。
- `libs/Universal-PicGo-Core/src/plugins/uploader/s3/uploader.ts` 使用 `url.URL`，可无行为变化地改为标准全局 `URL`；`https.Agent` 仍属于 S3/host 请求 handler 的 Node TLS 选项，需要单独审计，不能盲目删除导致 `rejectUnauthorized` 行为漂移。
- Core/Store 当前全量 `nodePolyfills({ protocolImports: true })` 会包含 `vm` polyfill，即 `vm-browserify`；应改为显式 include。
- `vue-i18n` 默认 bundler 入口把 message compiler 放入产品 bundle，出现 `new Function`；当前项目自定义 `useVueI18n` 只读 messages 并做 key lookup，适合切到 runtime-only 入口。
- `packages/picgo-plugin-app/public/libs/eruda` 是 dev-only 调试库但会被 public 复制到 artifacts；`packages/picgo-plugin-app/public/libs/zhi-infra` 是 `PluginHandler` 通过宿主 `win.require` 执行的 npm helper，二者需要在验证日志中作为目标明确的隔离例外。

## 2026-05-23 Store 依赖收敛发现

- `universal-picgo-store` 的 `Function("return this")` 主要来自打包的 `lodash`，字符串 `eval().` 误报来自 `ts-localstorage` 的错误文本；两者并非当前业务必需。
- 已用轻量同步 adapter + path get/set/has/unset 替换 `@commonify/lowdb`/`lodash`/`ts-localstorage`/`comment-json` 组合，保持 `JSONStore` 外部方法签名不变。
- `JSONAdapter` 保留 JSON-with-comments 读取兼容：读取时先 strip `//` 与 `/* */` 注释再 `JSON.parse`，写入继续输出标准 pretty JSON。

## 2026-05-23 Aliyun/产品 bundle 根因发现

- Core/Zhi/Bootstrap 中剩余 `Function("return this")` 与 `core-js/modules/.../internals/global`、lodash `_freeGlobal` 均来自 `ali-oss` 静态进入 Core 内置 uploader 链路；仅在运行时按 `hasNodeEnv` 分支不足以阻止打包。
- 产品 app bundle 中 `vue-i18n` message compiler `new Function` 不能只靠 define flags 清除，因为源码 import 默认入口时仍解析到 full build；需要 Vite alias 到 runtime-only bundler entry，同时源码保持带类型的 `vue-i18n` import。
- `picgo-plugin-app/scripts/build.py` 原先忽略 `vue-tsc && vite build` 退出码，可能造成 artifact 未刷新但流水线显示成功；这是 bundle audit 复现混乱的原因之一。

## 2026-05-23 Element Plus/lodash-unified 发现

- app 新 bundle 的唯一 `Function("return this")` 位于 lodash-es `_root` 代码片段；触发链不是业务代码直接依赖，而是 Element Plus 组件/工具按需模块 import `lodash-unified`，后者 ESM 入口 `export * from 'lodash-es'`。
- 该问题属于产品浏览器 bundle 层，不属于可发布 lib 主入口；因此采用 app Vite alias 到本地安全 helper 子集，比修改 node_modules 或把 lodash 例外化更符合 bundle gate。

## 2026-05-23 bundle audit 结果发现

- Core lib bundle (`libs/Universal-PicGo-Core/dist/index.js`) 已无 `direct eval`、`new Function`、`Function("return this")`、`eval("require")`、`vm-browserify`、`require("stream")` 命中。
- Zhi lib bundle (`libs/zhi-siyuan-picgo/dist/index.js`) 已无上述命中。
- 产品 app/bootstrap artifacts 的未批准动态代码命中已消除；`eruda` 与 `zhi-infra` 仅在隔离静态目录中作为显式例外出现。

## 2026-05-23 externalized warning 根因与修复发现

- `Module "path" has been externalized` 的主要来源有两个：
  - `mime-types` CommonJS 内部 `require("path").extname`；
  - `@picgo/i18n` 主入口 re-export `adapters/file-sync`，该文件静态 import `fs/path`。
- `Module "fs" has been externalized` 来源是 `@picgo/i18n/dist/adapters/file-sync.js`。
- `Module "http" has been externalized` 来源是 Core S3 handler 中 `https` import 触发 `https-browserify -> http`。
- `Module "vm" has been externalized` 来源是 Core Vite `nodePolyfills` include `crypto` 后带入的 `crypto-browserify` 依赖链，最终到 `asn1.js -> vm`。
- 修复后 `pnpm build -F universal-picgo` 捕获日志确认四条 warning 均 absent，且 Core dist 体积从约 1.52MB 降到约 756KB。

## 2026-05-23 宿主 smoke 可用性发现

- 本机曾有 SiYuan 3.6.5 host 与 workspace API 可用，workspace 为 `D:\Users\Administrator\Documents\mydocs\SiyuanWorkspace\public`。
- 该 workspace 的 `data/plugins/siyuan-plugin-picgo` 是既有旧版安装目录，不是本仓库 artifact 的 symlink；真实 smoke 需要先备份并可逆部署。
- 当前由于错误调用 `/api/system/exit`，kernel 已退出且 6806 不可用；只剩 UI 进程，无法完成真实 paste/default-prevention smoke。
