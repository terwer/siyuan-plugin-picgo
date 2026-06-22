## Why

issue `terwer/siyuan-plugin-picgo#460` 的 PicGo 2.x 修复只解决 Docker/Web 下 PicGo 主配置进入 workspace 的局部问题；PicGo 3.0 需要把所有 PicGo/plugin 用户配置统一到同一套 async ready、读取、保存、迁移和验收契约中。当前主 PicGo 配置、external/PicList 配置、SiYuan connection/settings、paste/bootstrap 判断、uploader 自有 token/state 和插件配置值分别由不同 storage 路径维护，容易出现同一运行时读取到不同来源数据的问题。

PicGo 3.0 `picgo-3-unified-async-config-source` 明确 **supersede** 已完成的 `docker-picgo-storage-persistence`：后者是 v2 兼容边界和迁移来源，3.0 不再保留“Docker/Web 只同步主配置”的产品边界。3.0 的边界是：除第三方 PicGo 插件安装包、npm/runtime helper、日志、缓存等 PC/Electron runtime artifacts 外，所有用户配置域都通过统一 async facade 进入各自 owner file，并在 Kernel-backed runtime 下进入 workspace。

## What Changes

- **BREAKING**: PicGo plugin 3.0 引入统一 async configuration access layer，替换分散的同步配置读写链路。
- **BREAKING**: 配置方法名、返回值和调用方式改为 async；实现侧必须同步更新调用方，禁止 ready 前读取用户配置。
- 保留现有按功能拆分的 owner file 和逻辑 key：PicGo 主配置继续使用 `picgo.cfg.json`，external/PicList 继续使用 `external-picgo-cfg.json`，SiYuan connection 继续使用 `siyuan-cfg` / `storage/syp/siyuan-cfg.json` 语义。
- 建立统一 async facade：调用方通过一个 ready facade 读写 PicGo 主配置、external/PicList、SiYuan connection/settings、paste snapshot、plugin values 和 uploader-owned state；facade 按配置域路由到对应 owner file。
- 在 Kernel-backed runtime 下，PicGo 主配置、external/PicList、SiYuan connection/settings、paste 相关配置、plugin enable/config values、uploader config/state 均进入 workspace 的对应 owner file。
- 只有第三方 PicGo 插件 runtime artifacts 保持 PC/Electron 本机化：插件包、npm 目录、`pluginBaseDir`、`zhiNpmPath`、logs、cache、build output 不作为可同步用户配置。
- external/PicList 采用全量统一配置语义：local external PicGo App 的 URL、remote PicList URL/API key、route selection 都写入 `external-picgo-cfg.json` 并随 workspace 同步。
- SiYuan connection config 采用统一配置语义：`apiUrl`、`password`、`cookie` 等写入 `siyuan-cfg` owner file；`password`、`cookie` 在日志、错误、migration report、导出和诊断输出中必须 mask，mask 值不得写回真实配置。
- migration service 负责把旧浏览器 `localStorage`、旧 PC-local JSON、旧 v2 workspace 主配置、旧 external/PicList、旧 `siyuan-cfg`、旧 paste/bootstrap 读取值、旧 marker 和 uploader localStorage token/state 导入对应 owner file。
- Lsky token 的最终配置路径固定为 `picgo.cfg.json` 内的 `uploader.lsky.token`；旧 `siyuan_picgo_plugin_lsky_token` 只允许作为 migration source 或 test fixture 出现。
- 非用户 cache、i18n cache、构建产物、日志、node_modules、package-lock、clipboard 临时文件继续作为 cache/artifact 处理，不进入统一用户配置策略。

## Capabilities

### New Capabilities
- `picgo-unified-async-config-source`: 定义 PicGo 3.0 统一异步配置访问策略、owner file 映射、facade lifecycle、migration v3 marker、storage adapter resolution、sensitive mask 和完整验收门禁。

### Modified Capabilities
- `picgo-headless-config-contract`: 无界面配置 API 改为 async，并统一使用 ready facade。
- `picgo-plugin-shell-ux`: 设置 UI 通过统一 async facade 读写所有 PicGo/plugin 用户配置，并展示 migration/save 错误与敏感字段 mask。
- `picgo-paste-upload-ownership`: paste/bootstrap 在 listener 注册前预热 ready snapshot；事件到达时不能读取旧 localStorage 决策。
- `picgo-runtime-boundary-integrity`: runtime capability boundary 统一通过 facade、host adapter 和 storage adapter 注入。
- `picgo-product-library-boundary`: 配置访问层成为 shared library contract；PC-only runtime artifact 与可同步配置值分离。
- `picgo-public-contract-stability`: PicGo 3.0 明确允许配置 API breaking change，并提供确定性数据 migration 到现有 owner file。

## Impact

- 版本定位：PicGo plugin 3.0，允许 breaking changes。
- 与 `docker-picgo-storage-persistence` 的关系：v2 change 已完成且保持为 2.x 局部兼容契约；v3 change supersede 其“只同步主配置”的边界，并把该 v2 状态作为 migration baseline。
- 受影响包：
  - `libs/Universal-PicGo-Store`
  - `libs/Universal-PicGo-Core`
  - `libs/zhi-siyuan-picgo`
  - `packages/picgo-plugin-app`
  - `packages/picgo-plugin-bootstrap`
- 现有 owner file 归属：
  - PicGo 主配置：`picgo.cfg.json`，包含 `picBed.*`、`picBed.uploader`、`picBed.current`、`picBed.transformer`、`picBed.proxy`、`uploader.*`、`debug`、`silent`、`settings.*`、`picgoPlugins.*`、uploader-owned 持久状态。
  - SiYuan connection/settings：`siyuan-cfg` / `storage/syp/siyuan-cfg.json`，包含 `apiUrl`、`password`、`cookie`、`home`、`previewUrl`、`notebook`、`picgoUploadTimeout` 等连接配置；`siyuan.*` 集成行为值继续按映射归属到 PicGo 主配置。
  - external/PicList 配置：`external-picgo-cfg.json`，包含 `useBundledPicgo`、`picgoType`、`extPicgoApiUrl`、`picListApiUrl`、`picListApiKey`。
  - 插件配置：插件启用状态和插件配置值进入 `picgo.cfg.json` 的现有配置区域；插件安装包和运行时文件继续作为 PC/Electron 本机 artifact。
- 验收重点：所有用户配置通过 ready facade 读写；旧源只在 migration/test 中出现；paste 不再直接读取 `window.localStorage.getItem("universal-picgo/picgo.cfg.json")`；`ExternalPicgoConfigDb` 不能原样作为 async backend；host smoke 覆盖 Docker/Web 多设备、PC/Electron 和纯浏览器 fallback。
