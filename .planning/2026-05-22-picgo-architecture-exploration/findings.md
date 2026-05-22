# 发现记录

## 待探索问题

- 插件产品入口与可打包 lib 入口是否共享同一套内部实现边界？
- 哪些包既承担运行时产品职责，又承担可复用库职责？
- 底层能力复用是否通过清晰 domain core / adapter / app shell 分层实现，还是通过跨包深层 import 和 dist bundle 反向依赖实现？
- 构建目标是否区分 browser、SiYuan/Electron host、Node 构建期、library package？

## 证据

暂无。

## 2026-05-22 阶段 1 初步证据：workspace 与包形态

### Workspace / 构建编排

- 根 `package.json` 是 `siyuan-plugin-picgo@1.12.1`，脚本通过 `turbo run build/lint/dev/serve` 编排。
- `pnpm-workspace.yaml` 只纳入 `packages/*` 与 `libs/*`。
- `turbo.json` 中 `build` 依赖 `^build`，意味着 lib 会先于插件包构建，插件和库之间存在构建顺序耦合。

### 包清单

- `packages/picgo-plugin-bootstrap`：插件 bootstrap 包，依赖 `siyuan`、`vite-plugin-node-polyfills`、`zhi-siyuan-picgo`。
- `packages/picgo-plugin-app`：Vue app 包，私有，依赖 `zhi-siyuan-picgo`，同时 `public/libs/zhi-infra` 下带有额外预置库包信息。
- `libs/Universal-PicGo-Core`：发布名 `universal-picgo`，描述为 `picgo lib for node, browser and electron`，同时依赖 `@aws-sdk/*`、`ali-oss`、`axios`、`file-type`、`universal-picgo-store` 等。
- `libs/Universal-PicGo-Store`：发布名 `universal-picgo-store`，描述为 `browser, node or electron` 读写数据，依赖 `lowdb`、`ts-localstorage`。
- `libs/zhi-siyuan-picgo`：发布名 `zhi-siyuan-picgo`，描述为 `picgo lib for siyuan-note`，依赖 `universal-picgo`、`zhi-siyuan-api` 等。

### 初步架构信号

- 多个 lib 的 package 描述同时宣称 browser/node/electron 通用，和插件包的 SiYuan 宿主职责交织，需要继续用源码确认是否有清晰 runtime adapter 边界。
- app 与 bootstrap 都直接依赖 `zhi-siyuan-picgo`，需要确认该包是纯 lib facade，还是承载了插件运行时/宿主逻辑。
- 当前 plugin manifest 在根 `plugin.json`，但根目录没有 `plugin.js`；插件入口可能由 `picgo-plugin-bootstrap` 构建产出复制到根或发布包，需要后续跟踪 scripts/build/package。

## 2026-05-22 阶段 1 补充证据：源码清单与构建配置

### 源码规模与包分布

- 非生成/非 vendor 的源码与配置约 214 个文件：
  - `libs/Universal-PicGo-Core`：约 87 个源码/配置文件，包含 core、db、plugin loader、uploaders、clipboard、node/browser utils、image-size 等。
  - `libs/Universal-PicGo-Store`：约 17 个源码/配置文件，包含 LocalStorage、JSONStore、electron 文件写入基础能力。
  - `libs/zhi-siyuan-picgo`：约 25 个源码/配置文件，包含 Siyuan PicGo API、parser、helper、clipboard/browser utils。
  - `packages/picgo-plugin-app`：约 60 个源码/配置文件，Vue app、settings、stores、Siyuan/PicGo composables。
  - `packages/picgo-plugin-bootstrap`：约 20 个源码/配置文件，SiYuan 插件入口、topbar/statusbar/dialog/page route/API。

### 构建配置证据

- 三个 lib 包都使用 Vite lib mode，入口均是 `src/index.ts`，输出 `dist/index.js`，`formats: ["es"]`，并复制 `README.md` 与 `package.json` 到 dist。
- `Universal-PicGo-Core` 和 `Universal-PicGo-Store` 的 lib build 明确启用 `vite-plugin-node-polyfills`，且 `rollupOptions.external: []`，意味着默认把依赖和 polyfill 尽量打入库产物。
- `zhi-siyuan-picgo` 也是 lib build，`external: []`，依赖 `universal-picgo` 与 Siyuan API，但没有显式区分 browser/lib/plugin/host target。
- `picgo-plugin-app` 输出到 `../../artifacts/siyuan-plugin-picgo/dist`，是浏览器 app 构建；直接依赖 workspace `zhi-siyuan-picgo`。
- `picgo-plugin-bootstrap` 输出到同一个 artifacts 插件目录，以 CJS lib mode 生成 `index.js`，复制根 manifest/readme/license/icon 等；`external: ["siyuan", "process"]`。

### 初步设计缺陷信号

- “可发布 lib”和“插件产物”共用 Vite 打包链路，但 lib build 没有外部化依赖、没有 runtime-specific exports，也没有分 browser/node/electron/plugin targets。
- 插件 bootstrap 和 app 输出到同一 artifacts 目录，但分别由独立构建配置控制；公共底层能力由 workspace lib 复用，可能造成产品入口和库入口互相牵制。
- `tsconfig` 多数同时引入 DOM 与 Node 类型，增强了跨运行时混用的可能性。

### 已记录错误

- import grep 命令因 PowerShell 引号/正则转义失败。下一步改用 Python 扫描 import，避免重复同一失败。

## 2026-05-22 阶段 1/2 证据：import 图与入口文件

### import 图关键事实

- `packages/picgo-plugin-app` 对 `zhi-siyuan-picgo` 有约 20 处直接 import，分布在设置页、上传控件、composables、stores、client 等处。
- `packages/picgo-plugin-bootstrap/src/index.ts` 同时 import：
  - `siyuan` 插件宿主 API；
  - `zhi-siyuan-picgo` 公共入口；
  - `zhi-siyuan-picgo/src` 深层源码入口中的 `replaceImageLink`。
- `libs/zhi-siyuan-picgo/src/index.ts` 从 `universal-picgo` 转出口大量 core 类型、db、工具和 `win`，说明 Siyuan lib 不是窄 facade，而是把底层 core 能力继续暴露给上层。
- `libs/Universal-PicGo-Core/src/index.ts` 又从 `universal-picgo-store` 转出 `win/currentWin/parentWin/hasNodeEnv`，进一步把运行时探测能力暴露成公共 API。

### 入口文件证据

- `UniversalPicGo` 构造函数中立即初始化 config path、npm path、config、plugin handler、request wrapper、内置插件、第三方插件 loader；这意味着 core 构造本身携带存储、插件加载、文件系统/浏览器路径判断等副作用。
- `UniversalPicGo` 内部通过 `hasNodeEnv` 和 `win.require("path"|"os")` 动态访问 Node 能力；不是通过外部 adapter 注入。
- `SiyuanPicGo.getInstance` 使用静态单例缓存 `SiyuanKernelApi` 与 `SiyuanPicgoPostApi`，并执行配置迁移检查与消息推送，说明 `zhi-siyuan-picgo` 包含宿主交互和状态生命周期，不只是纯算法/协议 lib。
- 插件 bootstrap 的 paste/menu 事件中直接实例化 `SiyuanPicGo` 并操作 `SiyuanPicgoPostApi`、`ctx`、Siyuan API、DOM 查询与 block attrs，产品编排逻辑直接耦合 lib 内部对象。

### 当前根因假设（仍需后续源码验证）

- 包命名和构建方式把 `universal-picgo` / `universal-picgo-store` 定义为跨 browser/node/electron 的通用 lib，但实际实现把运行时探测、存储选择、插件加载、副作用初始化混在 core 构造里。
- `zhi-siyuan-picgo` 既是可发布 Siyuan lib，又承担插件产品的业务 facade/宿主适配/迁移状态职责，导致 app/bootstrap 必须穿透它拿到底层能力。
- 插件产品、Siyuan 适配层、通用 PicGo core、运行时 store 的边界不是单向依赖，存在“向上暴露底层 runtime 能力”和“向下依赖产品宿主语义”的双向污染。

## 2026-05-22 阶段 2/3 证据：Siyuan lib 与插件产品职责混合

### `zhi-siyuan-picgo` 不是纯底层 lib

- `SiyuanPicgoPostApi` 同时承担：
  - 创建 `SiyuanKernelApi`；
  - 检测设备类型；
  - 创建 `SiyuanPicGoUploadApi`；
  - 自动执行配置迁移；
  - 修改思源 block attrs；
  - 上传后替换文档块 markdown；
  - 读写 `SIYUAN_PICGO_FILE_MAP_KEY` 元数据。
- `SiyuanPicGoUploadApi` 构造函数中直接 `new UniversalPicGo("", "", "", isDev)` 并创建 `ExternalPicgo`，即 Siyuan 层控制 core 实例生命周期，没有通过接口注入 runtime/storage/plugin-loader 能力。
- `PicgoHelper` 同时承担：
  - 读写 PicGo 配置；
  - 操作 Vue reactive/readonly 配置对象；
  - 构建图床配置表单数据；
  - 读取 PicGo 插件列表；
  - 通过 `win.require("@electron/remote")` 创建 Electron 菜单；
  - 调用 `ctx.pluginHandler.install/uninstall/update`；
  - 使用全局 `picgoEventBus` 驱动 UI 刷新事件。
- `libs/zhi-siyuan-picgo/src/lib/utils/utils.ts` 直接 import `element-plus` 和 `vue`，说明 lib 产物依赖 UI 框架能力，不是 UI 无关的领域库。

### app 与 lib 互相缠绕

- app composables (`usePicgoInitPage`、`usePicgoManage`、`usePicgoUpload`) 直接创建/使用 `ImageParser`、`ImageItem`、`SiyuanPicGoClient.getInstance()` 并调用 `SiyuanPicgoPostApi.uploadSingleImageToBed`。
- `SiyuanPicGoClient` 是 app 内包装，但只是把 app store 中的 Siyuan 配置传给 `SiyuanPicGo.getInstance` 静态单例，没有切断产品和 lib 的生命周期耦合。
- app 的 `jsonStorage.ts` 直接通过 `SiyuanDevice.siyuanWindow().require("fs"|"path")` 操作宿主文件系统，说明宿主适配并未集中在 bootstrap 或 lib adapter 层。
- app 的 `PicgoStorage` 接受 `IPicgoDb` 并直接调用 `read/saveConfig/removeConfig`，使 UI store 与 core DB 契约耦合。

### 关键设计缺陷归纳

- 当前不是“共享底层能力”的健康分层，而是多个上层包共享同一个含副作用、含宿主能力、含 UI 依赖、含配置迁移的胖 lib。
- 底层 core 通过公共 export 暴露 `win/hasNodeEnv`，上层又直接调用 `win.require`，形成绕过架构边界的事实标准。
- 产品逻辑（菜单、设置、提示、block 替换、配置迁移）和可复用 lib API 混在一起，导致任何重构都会同时影响插件运行、库发布、UI 设置和第三方插件管理。

## 2026-05-22 阶段 3/4 证据：Core 中的插件系统与运行时能力

### `Universal-PicGo-Core` 中存在产品级插件运行时职责

- `PluginLoader` 是 core 内部组件，但会读取 `ctx.pluginBaseDir/package.json`、扫描 `node_modules`、通过 `win.require(pluginDir + name)(ctx)` 动态加载 PicGo 插件。
- `PluginLoader.registerPlugin` 会修改 `ctx.saveConfig({ picgoPlugins[...] })`，插件加载和配置持久化耦合。
- `PluginHandler` 负责 install/uninstall/update PicGo 插件，内部通过：
  - `win.require(`${ctx.baseDir}/libs/zhi-infra/index.cjs`)` 初始化 zhi infra；
  - `win.zhi.npm.checkAndInitNode()`；
  - `win.zhi.npm.localNodeExecCmd("npm", ...)` 执行 npm 命令。
- 这些能力属于宿主/产品运行时能力，但位于名为 `universal-picgo` 的可复用 core lib 中。

### 上传器与运行时混用

- uploader 代码大量同时依赖浏览器能力和 Node 能力：`Blob`、`FormData`、`crypto`、`Buffer`、`https`、`url`、AWS SDK、ali-oss、axios 等。
- `aliyun/index.ts` 基于 `hasNodeEnv` 在 node/web 实现间分支，但分支判断来自全局运行时探测，不是由构建 target 或 adapter 显式选择。
- 多个 uploader 直接 import `crypto` 或 `Buffer` polyfill，使 lib build 容易把 Node polyfill 拉进浏览器/插件产物。

### Store runtime 探测缺陷

- `Universal-PicGo-Store/src/lib/utils.ts` 使用 `window || globalThis`、`window?.parent` 和 `currentWin?.fs?.rm` 推断 `win` 与 `hasNodeEnv`。
- 该探测结果被 core、Siyuan lib、app 共同依赖并转出口，导致运行时能力判断成为跨包隐式全局契约。

### 需要补充验证

- 当前仓库本地没有 `node_modules` 中的 resolved 包路径，无法直接复核用户贴出的 `.pnpm/.../dist/index.js` 片段；但源码和 Vite 配置已经能解释为什么打包时会把 polyfill/dynamic require 类能力带入产物。

## 2026-05-22 阶段 3/4 补充证据：全仓 runtime/deep import 扫描

### 运行时能力泄漏位置

- `win.require` 出现在 core、store、Siyuan lib、app store 多层：
  - core：`UniversalPicGo.ts`、`PluginLoader.ts`、`PluginHandler.ts`、`utils/common.ts`、clipboard、i18n、image-size、os 等。
  - store：`TextFile.ts`、`writeFileAtomic.ts`。
  - Siyuan lib：`siyuanPicgoPostApi.ts`、`picgoHelper.ts`。
  - app：`stores/common/jsonStorage.ts`。
- `hasNodeEnv` 被 `universal-picgo-store` 定义并由 core 转出口，再被 Siyuan lib 消费，成为跨包全局隐式运行时协议。
- `SiyuanDevice.siyuanWindow()` 同时出现在 Siyuan lib 和 app store，说明宿主能力不集中。

### deep import / 公共契约破口

- `packages/picgo-plugin-bootstrap/src/index.ts` 存在 `import { replaceImageLink } from "zhi-siyuan-picgo/src"`，这是明确的源码深层 import，绕过 `zhi-siyuan-picgo` 的包级公共入口。

### UI 依赖进入 lib

- `libs/zhi-siyuan-picgo/src/lib/utils/utils.ts` import `element-plus` 与 `vue`。
- `libs/zhi-siyuan-picgo/src/lib/picgoHelper.ts` import `readonly` from `vue`。
- 这使 `zhi-siyuan-picgo` 发布包即便定位为 Siyuan PicGo lib，也隐含依赖具体 Vue/Element Plus UI 技术栈。

### 构建/发布配置证据

- 三个可发布 lib 只有 `main: ./dist/index.js` 与 `typings`，没有 `exports`、`browser`、条件导出、runtime-specific entrypoints。
- `universal-picgo` 与 `universal-picgo-store` 描述为 browser/node/electron 通用，但没有通过 package manifest 区分目标运行时。
- 当前工作区未生成 `dist` 和 `artifacts`，所以本轮不分析生成产物内容；用户先前提供的 Rolldown `eval` 日志仍应作为构建期症状写入 OpenSpec。

### 初步架构结论

- 当前架构不是“插件 app 使用稳定 lib API”，而是：插件 bootstrap、Vue app、Siyuan lib、Universal core、Store 共同依赖同一套运行时探测和底层对象。
- 可发布 lib 缺少明确的 public API/adapter 分层，上层只能通过直接转出、深层 import、全局 `win`/`hasNodeEnv` 和静态单例来复用能力。

## 2026-05-22 阶段 2/3 收尾证据：设置层与插件产品链路

### UI 设置层直接绑定 core/lib 内部对象

- `PicgoSetting.vue` 在 setup 顶层 await `SiyuanPicGoClient.getInstance()`，取得 `ctx = siyuanPicgo.ctx()` 后直接传给设置组件。
- `useBundledPicGoSetting` 在 app store 中直接 `new ConfigDb(ctx)` 并交给 VueUse `useStorage`，UI store 与 core DB 实现直接绑定。
- `useExternalPicGoSetting` 同样直接 `new ExternalPicgoConfigDb(ctx)`。
- `PicbedSetting.vue`、`PicgoConfigSetting.vue`、`PicgoPluginSetting.vue` 直接 `new PicgoHelper(props.ctx, formData.cfg)`，UI 组件直接持有 core context 和 lib helper。
- `BundledPicgoSetting.vue` 根据 `isInSiyuanOrSiyuanNewWin()` 控制“插件商店”显示，但实际插件管理能力在 `PicgoHelper`/core `PluginHandler` 中。

### 插件产品入口链路

- `picgo-plugin-bootstrap` 构建为 SiYuan 插件 CJS 入口，负责 topbar、statusbar、Dialog iframe、paste/menu 事件。
- Dialog iframe 指向 `/plugins/siyuan-plugin-picgo/#...`，也就是 bootstrap 与 Vue app 共同组成一个插件产品产物。
- bootstrap 中事件处理直接调用 `SiyuanPicGo.getInstance`、`uploadSingleImageToBed`、`replaceImageLink`、DOM 查询和 Siyuan block API；app 也重复使用同一套 post/upload API。

### 文档/发布链路证据

- `DEVELOPMENT.md` 明确构建顺序：先 build `universal-picgo-store`、`universal-picgo`、`zhi-siyuan-picgo`，再 serve/dev app/bootstrap。
- `scripts/package.py` 打包时只强制 build `picgo-plugin-app` 与 `picgo-plugin-bootstrap`，依赖 turbo/workspace 中已有 lib 产物或包解析状态；这会放大“lib 产物”和“插件产物”之间的时序/缓存风险。
- README 明确 1.6.0+ 改到 `~/.universal-picgo`，并保存 `package.json/package-lock.json/node_modules`，这说明插件产品运行时确实包含本地 npm 插件生态和文件系统状态。

### 根因定稿

- 当前的核心问题是产品外壳、Siyuan 适配、PicGo core、store、插件管理、UI helper、发布 lib 共享同一个未分层对象图。
- “可复用底层能力”没有被设计为纯 domain core + runtime adapter + product shell，而是通过胖 lib、全局运行时探测、转出口、深层 import、静态单例和构建时全打包来复用。
- 因此维护者不敢轻易修改是合理结果：任何小改动都可能同时改变插件产品行为、发布包 API、打包产物内容、宿主能力访问、历史配置迁移和第三方 PicGo 插件管理。

## 2026-05-22 OpenSpec 更新结论

### 已写入 OpenSpec 的根因

- `siyuan-plugin-picgo` 同时承担 SiYuan 插件产品和可发布/可打包 lib 两种身份，但当前没有清晰分出 product shell、Siyuan adapter、application facade、domain core、store port、host adapter、build script。
- 当前“共用底层能力”不是健康复用，而是通过胖 lib、全局 runtime 探测、深层 import、静态单例、转出口和全量打包复用能力。
- 具体证据已经写入 `openspec/changes/picgo-internal-refactor/design.md` 的 `Current Code Evidence`：
  - bootstrap 深层 import `zhi-siyuan-picgo/src`；
  - app 设置层直接把 core `ctx` 传给 UI；
  - `zhi-siyuan-picgo` 主入口转出 core/db/runtime，并混入 Vue/Element Plus/Electron helper；
  - `SiyuanPicGo` 静态单例与 `SiyuanPicgoPostApi` 同时管理 Siyuan API、配置迁移、block attrs、上传替换；
  - `UniversalPicGo` 构造函数有配置/db/plugin loader 副作用；
  - Store 通过 `window/parent/fs.rm` 推断 `win/hasNodeEnv`；
  - 可发布 lib 缺少 runtime-specific exports，构建配置使用 `external: []` 和 node polyfills。

### 新增 OpenSpec 能力

- `picgo-product-library-boundary`：从顶层区分 SiYuan 插件产品与可发布 PicGo/Siyuan lib，重建 package role、依赖方向、公共入口和构建目标。

### 验证

- 已运行：`openspec validate picgo-internal-refactor --strict`
- 结果：`Change 'picgo-internal-refactor' is valid`
