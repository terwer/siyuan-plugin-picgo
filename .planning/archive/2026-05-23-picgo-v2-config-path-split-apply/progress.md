# Progress

## 2026-05-23

- 创建 v2 apply 计划文件。
- 已读取 OpenSpec proposal/design/specs/tasks。
- 下一步：梳理路径调用点并实现 core options。

## 2026-05-23 Core 路径初步修改

- 为 `IPicGo` 类型文件新增 `IUniversalPicGoOptions`，表达 `configPath`、`baseDir/runtimeDir`、`pluginBaseDir`、`zhiNpmPath`、`isDev`。
- `UniversalPicGo` 构造函数新增 options overload，并保留旧四参数签名兼容。
- `UniversalPicGo.initConfigPath()` 已改为：传入 `configPath` 时不再自动把 `baseDir` 改成 `dirname(configPath)`；`baseDir` 缺失时才使用 `~/.universal-picgo` / browser fallback。
- `initZhiNpmPath()` 默认改为 `baseDir/libs`，并输出路径日志。
- `PluginHandler` npm cwd 改为 `ctx.pluginBaseDir`。
- `PicgoHelper.getPluginList()` 改为读取 `ctx.pluginBaseDir/node_modules`。

## 2026-05-23 SiYuan 适配层路径契约初步实现

- 新增 `libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.ts`：集中解析 workspace config 路径与本机 `~/.universal-picgo` runtime/plugin 路径。
- `SiyuanPicGo.getInstance` 支持 `boolean | options`，options 可传 `isDev` 与 `paths` 覆盖；默认只需 `SiyuanConfig`，内部自动解析 v2 路径。
- 单例增加路径 key；当 apiUrl 或路径契约变化时会重新初始化，避免 publisher/debug 覆盖路径却复用旧实例。
- `SiyuanPicGoUploadApi` / `SiyuanPicgoPostApi` 已接收解析后的路径并传给 `UniversalPicGo`。
- `SiyuanPicgoPostApi.updateConfig()` 已替换旧整目录 move：现在只做 v2 workspace config 单文件复制迁移，runtime libs 只复制不删除源。
- `pnpm --dir libs/Universal-PicGo-Core exec tsc --noEmit` 通过。
- `pnpm --dir libs/zhi-siyuan-picgo exec tsc --noEmit` 通过；由于 zhi 侧直接类型检查读的是旧 dist d.ts，暂用 `new (UniversalPicGo as any)(options)` 兼容未先 build core 的本地开发顺序。

## 2026-05-23 恢复实施与审计补强

- 已按用户要求切回 OpenSpec apply：`.planning/.active_plan` 改回 `2026-05-23-picgo-v2-config-path-split-apply`。
- 已重新读取 `picgo-v2-config-path-split` 的 proposal、design、两个 spec 与 tasks。
- 已补 `scripts/picgo-internal-refactor-audit.cjs` 的 `v2-paths` 检查：
  - `ConfigDb` 必须使用 `ctx.configPath`。
  - `ExternalPicgoConfigDb`、`PluginLoaderDb`、`PluginLoader` 必须使用 `ctx.pluginBaseDir`。
  - `PluginHandler` npm cwd 不得回退到 `ctx.baseDir`。
  - `siyuanPicgoPaths` 迁移必须 copy-only，不能 move/delete。
  - 如设置 `SIYUAN_PICGO_AUDIT_WORKSPACE_DIR`，可检查 workspace `data/storage/syp/picgo` 不含 runtime 重物。
- 已把 `IPicGo.baseDir` 注释改为 v2 runtime 语义，避免继续误读为 configPath dirname。

## 2026-05-23 文档闭环更新

- 重写根 `README.md` 的 Config paths：明确 v2.0.0 是破坏性整理版本，写清 v2、<=1.5.6、1.6.0+ 三段路径。
- 同步重写 `README_zh_CN.md` 的配置路径说明。
- 更新 `packages/picgo-plugin-app/README.md`：写清设置页对应的 v2 路径契约，强调 `external-picgo-cfg.json`、第三方插件、node_modules、缓存、日志不同步。
- 重写 `DEVELOPMENT.md`：
  - 明确项目边界、v2 路径结构、迁移规则。
  - 写入可直接执行的构建命令。
  - 写入 `pnpm makeLink` 到思源 `test` 工作空间的步骤。
  - 写入“测试步骤”，包含单测/audit、思源插件测试、MinIO/S3 要点、外部 lib 测试、publisher 集成调试。
  - 写入插件正式发版、外部 lib 正式发布、产物结构。
