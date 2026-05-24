## Context

v2.0.0 是一次有意的破坏性整理版本，包含两层含义：

1. 已完成的 PicGo 内部重构，为后续长期维护、粘贴链路、内外部复用打基础。
2. 本变更新增的路径契约拆分，用来修正 1.6.0+ 把全部 PicGo 状态迁到 `~/.universal-picgo` 后造成的多设备配置不同步问题。

当前 1.6.0+ 的主要状态是：

```text
~/.universal-picgo/
  picgo.cfg.json
  external-picgo-cfg.json
  package.json
  package-lock.json
  node_modules/
  libs/
  i18n-cli/
  picgo-clipboard-images/
  *.script
  picgo.log
```

这个设计避免了 1.5.6 以前把 `node_modules`、缓存、运行脚本放进 `[workspace]/data/storage/syp/picgo` 导致 SiYuan 同步变慢的问题，但也把最应该同步的 `picgo.cfg.json` 移出了工作空间。

`picgo.cfg.json` 是内置 PicGo 经本插件适配后、支持 SiYuan 多环境的主配置文件，适合跟随 SiYuan 工作空间在多设备之间同步。相反，PicGo 第三方插件目前只在 PC 环境可用，设置页在非 PC 场景不能完整使用；外部 PicGo 配置也包含 `127.0.0.1` API、是否使用外部 PicGo 等设备绑定状态，不应同步。

当前代码中 `UniversalPicGo` 把 `configPath` 和 `baseDir` 强绑定：传入自定义 `configPath` 时，`baseDir = dirname(configPath)`。如果直接把 `configPath` 改回 workspace，会把剪贴板缓存、i18n、libs、插件安装 cwd 等运行时内容一起带回 workspace，违背 v2 目标。

## Goals / Non-Goals

**Goals:**

- v2 默认把内置 PicGo 主配置写入 `[workspace]/data/storage/syp/picgo/picgo.cfg.json`。
- 继续把 PC-only、设备绑定、运行时重物保存在 `~/.universal-picgo`。
- 明确分离路径语义：主配置路径、运行时目录、PicGo 插件依赖目录、外部 PicGo 配置目录不能再被隐式视为同一个目录。
- 迁移 1.6.0+ 用户时只复制主配置文件，不移动、不删除、不递归迁移整个目录。
- 让 `siyuan-plugin-publisher` 通过外部 lib 的 v2 契约使用 PicGo，避免 publisher 自己硬编码历史路径。
- README、DEVELOPMENT.md、包内 README 清楚说明 v2 路径结构、迁移规则和可落地测试步骤。

**Non-Goals:**

- 不把 `node_modules`、`package.json`、`package-lock.json`、缓存、日志、剪贴板脚本重新放回 SiYuan 工作空间。
- 不同步 `external-picgo-cfg.json`，不让外部 PicGo API 选择跟随工作空间同步。
- 不自动合并 workspace 与 home 中两个不同的 `picgo.cfg.json`。
- 不删除用户现有 `~/.universal-picgo/picgo.cfg.json`，避免影响历史回滚或其他调用方。
- 不把非 PC 端 PicGo 插件管理能力做成完整可用；v2 只定义正确路径边界。

## Decisions

### 1. 路径拆分为 synced config 与 local runtime

v2 路径结构：

```text
[workspace]/data/storage/syp/picgo/
  picgo.cfg.json                 # 内置 PicGo 主配置，可随 SiYuan 同步

~/.universal-picgo/
  external-picgo-cfg.json         # 外部 PicGo / API 选择，本机状态
  package.json                    # PicGo 插件安装状态，本机 PC-only
  package-lock.json
  node_modules/
  libs/
  i18n-cli/
  picgo-clipboard-images/
  mac.applescript / windows.ps1 / windows10.ps1 / linux.sh / wsl.sh
  picgo.log
```

理由：配置小且跨设备有价值；依赖、缓存、脚本、日志要么体积大，要么设备相关，要么 PC-only。

替代方案：

- 全部回 workspace：会重新引入 1.5.6 以前同步慢的问题。
- 全部留 home：保持 1.6.0+ 现状，但多设备图床配置不同步。
- 把 `external-picgo-cfg.json` 也同步：会同步 `127.0.0.1` 等设备绑定状态，容易导致多设备误用。

### 2. Core 需要支持显式 runtime/plugin 路径，不能再从 configPath 推导所有路径

`UniversalPicGo` 需要有能力表达：

```text
configPath     = workspace/data/storage/syp/picgo/picgo.cfg.json
runtimeDir     = ~/.universal-picgo
pluginBaseDir  = ~/.universal-picgo
zhiNpmPath     = ~/.universal-picgo/libs 或兼容现有初始化逻辑
```

实现方式可采用向后兼容的构造参数重载或 options 对象。优先建议新增 options 对象，保留旧构造签名兼容外部调用：

```ts
new UniversalPicGo({
  configPath,
  runtimeDir,
  pluginBaseDir,
  zhiNpmPath,
  isDev,
})
```

同时旧签名 `new UniversalPicGo(configPath, pluginBaseDir, zhiNpmPath, isDev)` 可以继续兼容，但内部归一化为同一个路径对象。

关键要求：当 `configPath` 指向 workspace 时，`baseDir`/运行时写入点不得自动变成 workspace。

### 3. 设备本地运行时使用 runtimeDir，第三方插件使用 pluginBaseDir

当前若干逻辑使用 `ctx.baseDir`：

- 剪贴板图片和脚本：应使用设备本地 runtimeDir。
- i18n 外部文件：应使用设备本地 runtimeDir。
- zhi-infra/libs：应使用设备本地 runtimeDir。
- npm install/update/uninstall cwd：应使用 pluginBaseDir 或 runtime/plugin 目录，而不是 workspace 配置目录。
- 插件列表展示中读取 `node_modules`：应使用 pluginBaseDir。

为了减少大改范围，可以先让 v2 中 `ctx.baseDir` 语义调整为“设备本地运行时目录”，而 `ctx.configPath` 独立指向 workspace 主配置。这样大多数依赖 `baseDir` 的运行时逻辑无需迁往新字段，但必须修正“传入 configPath 时 baseDir = dirname(configPath)”的旧逻辑。

### 4. SiYuan 适配层负责 workspace 路径解析与迁移

`zhi-siyuan-picgo` 比 core 更了解 SiYuan 的 `workspaceDir`。因此 v2 默认路径应由 SiYuan 适配层解析：

```text
workspaceConfigDir = workspaceDir/data/storage/syp/picgo
workspaceConfigPath = workspaceConfigDir/picgo.cfg.json
homeRuntimeDir = ~/.universal-picgo
```

适配层创建 `SiyuanPicGoUploadApi` / `UniversalPicGo` 时显式传入这些路径。

如果没有 SiYuan `workspaceDir`，例如纯浏览器或外部异常环境，则保持现有 fallback，不凭空写入未知 workspace。

### 5. 迁移只复制 picgo.cfg.json，workspace 优先

v2 启动迁移规则：

```text
workspace cfg exists:
  use workspace cfg
  do not overwrite from home

workspace cfg missing && home cfg exists:
  copy home cfg to workspace cfg
  keep home cfg unchanged

both missing:
  create empty/default workspace cfg through existing JSONStore behavior

both exist but differ:
  workspace wins
  home remains as backup only
```

禁止继续把整个 `[workspace]/data/storage/syp/picgo` 目录复制/移动到 `~/.universal-picgo`，也禁止迁移后删除源目录。

### 6. publisher 不再猜路径，改用外部 lib v2 契约

`D:\Users\Administrator\Documents\mydocs\siyuan-plugins\siyuan-plugin-publisher` 后续应通过 `zhi-siyuan-picgo` 的统一入口拿到 PicGo 能力。publisher 不应该硬编码：

```text
widgets/sy-post-publisher/lib/picgo/picgo.cfg.json
```

也不应该直接猜 `~/.universal-picgo/picgo.cfg.json`。

建议外部 lib 暴露以下两类能力之一：

- 默认模式：传入 `SiyuanConfig`，内部根据 workspace 自动解析 v2 路径。
- 调试/高级模式：允许显式传入 `configPath`、`runtimeDir`、`pluginBaseDir`。

### 7. v2 文档必须把版本定位讲清楚

文档中需要明确：

- v2.0.0 是破坏性整理版本。
- v2 包含前一轮内部重构成果与本次路径拆分。
- 1.5.6 以前、1.6.0+、2.0.0 的路径差异。
- 哪些文件会同步，哪些不会同步，为什么。
- 如何在 SiYuan `test` 工作空间测试。
- 如何在 publisher 中调试外部 lib。

## Risks / Trade-offs

- [Risk] 旧代码仍把 `baseDir` 当作配置目录，导致运行时文件意外写回 workspace。  
  → Mitigation: 明确 v2 中 `baseDir` 表示本机 runtimeDir；增加 audit/test 检查 `node_modules`、`picgo-clipboard-images`、脚本、i18n 不进入 workspace 配置目录。

- [Risk] workspace 和 home 两份 `picgo.cfg.json` 内容冲突，用户误以为 home 会继续生效。  
  → Mitigation: 文档明确 workspace 优先；启动日志输出实际 `configPath`、`baseDir`、`pluginBaseDir`；必要时设置页展示当前配置文件路径。

- [Risk] publisher 仍使用历史硬编码路径，导致测试时读错配置。  
  → Mitigation: 外部 lib 文档和 DEVELOPMENT.md 给出 publisher 调试入口；后续在 publisher 侧替换路径猜测。

- [Risk] 构造函数签名变更影响外部调用方。  
  → Mitigation: 保留旧签名兼容，新增 options 对象作为推荐 v2 API。

- [Risk] 迁移复制时覆盖用户新建 workspace 配置。  
  → Mitigation: 只有 workspace 配置不存在时才从 home 复制；存在时绝不覆盖。

- [Risk] 非 PC 或 browser runtime 没有 Node 文件系统能力。  
  → Mitigation: 文件路径拆分只在 Node/SiYuan 桌面环境生效；browser localStorage 保持原有机制，文档单独说明。

## Migration Plan

1. 在 core 中引入路径归一化：`configPath` 独立，`baseDir`/runtimeDir 默认为 `~/.universal-picgo`，`pluginBaseDir` 默认为 `~/.universal-picgo`。
2. 在 SiYuan 适配层根据 `workspaceDir` 计算 workspace 主配置路径，并创建目录。
3. 替换旧整目录迁移逻辑为单文件复制迁移。
4. 检查并修正所有插件安装、插件读取、i18n、剪贴板脚本/缓存对路径字段的使用。
5. 更新 README、包内 README、DEVELOPMENT.md。
6. 在 SiYuan `test` 工作空间验证：配置写入 workspace，运行时重物留在 home，上传链路正常。
7. 再进行 publisher 外部 lib 集成验证。

Rollback 思路：由于 v2 迁移不删除 home 旧配置，必要时可把默认 `configPath` 切回 `~/.universal-picgo/picgo.cfg.json`；workspace 配置文件作为副本保留，不破坏旧数据。

## Open Questions

- 是否需要在设置页展示当前实际 `picgo.cfg.json` 路径，帮助用户确认 v2 行为？
- publisher 侧是否需要一个显式 API 返回当前路径信息，例如 `getPicgoPaths()`，用于调试和文档截图？
- browser localStorage 与 Node 文件配置之间是否需要额外同步说明，还是继续维持现有运行态边界？
