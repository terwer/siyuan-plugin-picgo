# Findings

## 初始决策

- `picgo.cfg.json`：v2 默认路径为 `[workspace]/data/storage/syp/picgo/picgo.cfg.json`，适合跟随 SiYuan 同步。
- `~/.universal-picgo`：继续保存 runtime、PicGo 插件依赖、外部 PicGo 配置、clipboard cache/scripts、i18n、logs、libs。
- `external-picgo-cfg.json`：设备绑定，不随 workspace 同步。
- 迁移策略：只复制 home `picgo.cfg.json` 到 workspace 缺失路径；不移动、不删除、不覆盖已有 workspace 配置。
- v2 包含之前的内部重构和本次路径拆分，是允许破坏性变更的历史债务整理版本。

## 2026-05-23 路径调用点梳理

- `ConfigDb` 只使用 `ctx.configPath`，适合作为 v2 workspace 主配置读写点。
- `ExternalPicgoConfigDb` 与 `PluginLoaderDb` 使用 `ctx.pluginBaseDir`，适合继续放 `~/.universal-picgo`。
- `I18nManager`、browser i18n、clipboard electron、PluginHandler zhi-infra 仍使用 `ctx.baseDir`，因此 v2 将 `baseDir` 语义固定为本机 runtimeDir，而不是 configPath 的 dirname。
- `PluginHandler` install/uninstall/update 原本 cwd 用 `ctx.baseDir`，v2 应改为 `ctx.pluginBaseDir`。
- `PicgoHelper.getPluginList()` 原本用 `ctx.baseDir/node_modules`，v2 应改为 `ctx.pluginBaseDir/node_modules`。
- `SiyuanPicgoPostApi.updateConfig()` 当前整目录 move/copy 并删除源目录，是 v2 必须替换的高风险点。
