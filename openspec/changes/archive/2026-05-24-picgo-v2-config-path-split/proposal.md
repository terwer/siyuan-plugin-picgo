## Why

PicGo 插件从 1.6.0 起把所有 PicGo 状态迁到 `~/.universal-picgo`，解决了旧版本把 `node_modules`、缓存、脚本等重型文件放入 SiYuan 工作空间导致同步拖慢的问题；但这也让内置 PicGo 的主配置 `picgo.cfg.json` 脱离了工作空间同步，破坏了多设备复用同一套图床配置的体验。

v2.0.0 允许做破坏性存储契约调整，用来收束历史债务：v2 包含已经完成的内部重构，以及本次路径拆分。目标是让经过适配的内置 PicGo 主配置跟随 SiYuan 工作空间同步，同时把设备绑定、PC-only、运行时重物继续留在本机目录。

## What Changes

- **BREAKING**: v2.0.0 将内置 PicGo 主配置 `picgo.cfg.json` 的默认读写位置改为 `[workspace]/data/storage/syp/picgo/picgo.cfg.json`。
- **BREAKING**: v2.0.0 明确拆分 PicGo 路径语义：主配置路径、运行时目录、插件依赖目录不再默认等同。
- `~/.universal-picgo` 继续作为本机运行时目录，保存不适合 SiYuan 同步的内容，包括 `package.json`、`package-lock.json`、`node_modules/`、`libs/`、`i18n-cli/`、剪贴板临时图片、剪贴板脚本和日志。
- `external-picgo-cfg.json` 继续留在 `~/.universal-picgo`，因为外部 PicGo API、是否使用外部 PicGo、`127.0.0.1` 等配置都是设备绑定状态，不应随工作空间同步。
- v2 首次启动执行保守迁移：只复制 `~/.universal-picgo/picgo.cfg.json` 到 workspace 缺失的主配置文件；不移动、不删除、不递归迁移整个目录。
- 当 workspace 与 home 两处都存在 `picgo.cfg.json` 时，workspace 配置优先；home 版本仅作为历史备份和迁移来源，不自动覆盖 workspace。
- `zhi-siyuan-picgo` / 外部 lib 需要暴露或内部使用清晰的路径解析契约，使 `siyuan-plugin-publisher` 不再猜测旧路径，而是复用 v2 的统一路径规则。
- README / DEVELOPMENT.md 需要更新为 v2.0.0 的闭环说明：版本定位、路径结构、迁移规则、SiYuan 插件测试、publisher/外部 lib 集成调试方式。

## Capabilities

### New Capabilities
- `picgo-v2-path-contract`: 定义 v2.0.0 下内置 PicGo 主配置、设备本地运行时、PicGo 插件依赖、外部 PicGo 配置的路径契约和迁移行为。
- `siyuan-publisher-picgo-integration`: 定义外部 lib 面向 `siyuan-plugin-publisher` 的路径解析与集成约定，避免 publisher 直接依赖历史路径或默认猜测。

### Modified Capabilities

- None.

## Impact

- `libs/Universal-PicGo-Core/src/core/UniversalPicGo.ts`: 需要支持主配置路径与运行时目录/插件目录分离，避免传入 workspace `configPath` 时把 `baseDir` 也带回 workspace。
- `libs/Universal-PicGo-Core/src/lib/PluginHandler.ts`: 当前 npm install/update/uninstall cwd 与 `ctx.baseDir` 绑定，v2 需要改用设备本地插件/运行时目录。
- `libs/Universal-PicGo-Core/src/lib/PluginLoader.ts` 与 `src/db/pluginLoder/index.ts`: 继续基于设备本地 `pluginBaseDir` 读取 `package.json` 和 `node_modules`。
- `libs/Universal-PicGo-Core/src/db/config/index.ts`: 主配置继续以 `ctx.configPath` 读写，但 v2 默认路径会变化。
- `libs/Universal-PicGo-Core/src/db/externalPicGo/index.ts`: 外部 PicGo 配置继续基于设备本地 `pluginBaseDir`，不得跟随 workspace 主配置同步。
- `libs/Universal-PicGo-Core/src/i18n/index.ts`、`src/utils/clipboard/electron.ts`: i18n 与剪贴板缓存/脚本需要继续写入设备本地运行时目录。
- `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts` 和 `siyuanPicGoUploadApi.ts`: 需要替换旧的整目录迁移逻辑，建立 v2 路径解析与单文件复制迁移。
- `packages/picgo-plugin-bootstrap` / `packages/picgo-plugin-app`: SiYuan 插件入口与设置页需要使用同一 v2 路径契约，并保持仅使用 `test` 工作空间进行验证。
- `D:\Users\Administrator\Documents\mydocs\siyuan-plugins\siyuan-plugin-publisher`: 后续集成测试目标，需要改为通过外部 lib 的 v2 契约使用 PicGo，而不是硬编码旧配置路径。
- 文档：README、packages/picgo-plugin-app/README.md、DEVELOPMENT.md 需要更新 v2 路径结构、迁移规则、测试/调试/发版注意事项。
