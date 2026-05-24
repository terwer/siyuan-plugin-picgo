## 1. Core 路径契约

- [x] 1.1 梳理 `UniversalPicGo` 当前 `configPath`、`baseDir`、`pluginBaseDir`、`zhiNpmPath` 的初始化与调用点，确认哪些调用必须继续使用本机 runtime。
- [x] 1.2 为 `UniversalPicGo` 增加 v2 路径 options 归一化能力，同时兼容旧构造函数签名。
- [x] 1.3 调整默认 Node runtime/plugin 目录为 `~/.universal-picgo`，并确保传入 workspace `configPath` 时不会把 `baseDir` 自动改成 `dirname(configPath)`。
- [x] 1.4 确保 `ConfigDb` 继续只通过 `ctx.configPath` 读写主配置 `picgo.cfg.json`。
- [x] 1.5 确保 `ExternalPicgoConfigDb` 继续通过本机 `pluginBaseDir` 读写 `external-picgo-cfg.json`。

## 2. Runtime 与插件目录修正

- [x] 2.1 检查并修正剪贴板图片缓存和剪贴板脚本路径，确保它们写入 `~/.universal-picgo`。
- [x] 2.2 检查并修正 i18n 外部文件路径，确保 `i18n-cli` 写入 `~/.universal-picgo`。
- [x] 2.3 检查并修正 zhi-infra/libs 初始化路径，确保 `libs/` 写入 `~/.universal-picgo`。
- [x] 2.4 修正 PicGo 插件安装、卸载、更新命令的 cwd，确保 `package.json`、`package-lock.json`、`node_modules/` 使用本机插件目录。
- [x] 2.5 修正插件列表读取逻辑，确保读取 `pluginBaseDir/node_modules` 而不是 workspace 配置目录。

## 3. SiYuan 适配层迁移

- [x] 3.1 在 `zhi-siyuan-picgo` 中根据 `workspaceDir` 计算 `[workspace]/data/storage/syp/picgo/picgo.cfg.json`。
- [x] 3.2 初始化内置 PicGo 时显式传入 workspace `configPath` 与本机 runtime/plugin 目录。
- [x] 3.3 移除或禁用旧的整目录迁移逻辑，禁止把整个 `[workspace]/data/storage/syp/picgo` 迁到 `~/.universal-picgo`。
- [x] 3.4 实现 v2 单文件保守迁移：workspace 配置缺失且 home 配置存在时，只复制 `picgo.cfg.json`，不删除源文件。
- [x] 3.5 处理 workspace 与 home 配置同时存在的情况：workspace 优先，不覆盖。
- [x] 3.6 增加初始化日志或 debug 输出，展示实际 `configPath`、runtime/baseDir、`pluginBaseDir`。

## 4. 外部 lib 与 publisher 契约

- [x] 4.1 为 `SiyuanPicGo.getInstance` / 相关入口设计并实现 v2 options，支持默认路径解析和显式 path overrides。
- [x] 4.2 确保默认外部 lib 调用只需要 `SiyuanConfig` 即可使用 v2 路径契约。
- [x] 4.3 确保调试模式可以显式传入 `configPath`、runtime/baseDir、`pluginBaseDir`。
- [x] 4.4 准备 `siyuan-plugin-publisher` 集成验证说明，明确 publisher 不再硬编码历史 PicGo 配置路径。

## 5. 文档更新

- [x] 5.1 更新根 README：说明 v2.0.0 是包含内部重构和路径拆分的破坏性整理版本。
- [x] 5.2 更新根 README 的路径结构：区分 1.5.6 以前、1.6.0+、2.0.0。
- [x] 5.3 更新 `packages/picgo-plugin-app/README.md` 的同类路径说明。
- [x] 5.4 更新 `DEVELOPMENT.md`：加入 v2 SiYuan 插件测试步骤、路径验证步骤、publisher 外部 lib 集成调试步骤。
- [x] 5.5 文档中明确 `external-picgo-cfg.json`、PicGo 第三方插件、`node_modules`、缓存、日志不随工作空间同步。

## 6. 验证

- [x] 6.1 增加或更新自动化 audit，检查 workspace 配置目录不得出现 `node_modules`、`package-lock.json`、剪贴板缓存、runtime 脚本。
- [x] 6.2 增加或更新单元/脚本测试，覆盖 home cfg -> workspace cfg 的单文件复制迁移。
- [x] 6.3 增加或更新测试，覆盖 workspace cfg 已存在时不被 home cfg 覆盖。
- [x] 6.4 执行相关 package build，确认 v2 路径改动不破坏 core、store、app、bootstrap、zhi-siyuan-picgo 构建。
- [x] 6.5 在 SiYuan `test` 工作空间执行真实设置保存与上传 smoke，验证主配置写入 workspace 且上传成功。
- [x] 6.6 验证 `~/.universal-picgo` 仍保存外部 PicGo 配置、插件依赖和运行时文件。
- [x] 6.7 在 publisher 项目执行外部 lib 集成 smoke，验证 publisher 通过 v2 契约读取 workspace 主配置并使用本机 runtime。
