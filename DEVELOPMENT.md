# Development

## 1. 项目边界

本仓库同时产出两类东西：

- 思源笔记插件：`siyuan-plugin-picgo`
- 外部可复用库：`universal-picgo-store`、`universal-picgo`、`zhi-siyuan-picgo`

v2.0.0 是破坏性整理版本，包含两部分：

- 前一轮 PicGo 内部重构。
- 本次 v2 路径拆分：主配置回工作空间同步，runtime 和设备绑定文件留本机。

## 2. v2 路径结构

```text
[workspace]/data/storage/syp/picgo/
  picgo.cfg.json                 # 内置 PicGo 主配置，可随思源工作空间同步

~/.universal-picgo/
  external-picgo-cfg.json         # 外部 PicGo / API 选择，本机状态
  package.json
  package-lock.json
  node_modules/
  libs/
  i18n-cli/
  picgo-clipboard-images/
  mac.applescript / windows.ps1 / windows10.ps1 / linux.sh / wsl.sh
  picgo.log
```

迁移规则：

- workspace `picgo.cfg.json` 已存在：直接使用 workspace 配置，不覆盖。
- workspace `picgo.cfg.json` 不存在且 `~/.universal-picgo/picgo.cfg.json` 存在：只复制这一个文件到 workspace。
- 不移动、不删除 `~/.universal-picgo/picgo.cfg.json`。
- 不迁移整个 `[workspace]/data/storage/syp/picgo` 目录。
- `external-picgo-cfg.json`、PicGo 第三方插件、`node_modules`、缓存、脚本、日志不随工作空间同步。

## 3. 构建命令

从仓库根目录执行。

### 3.1 全量构建

```powershell
pnpm build
```

### 3.2 库包构建

```powershell
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
```

如果改了 core 类型或导出，先构建 `universal-picgo`，再构建 `zhi-siyuan-picgo`，避免下游读到旧 `dist/*.d.ts`。

### 3.3 插件构建

```powershell
pnpm build -F picgo-plugin-app
pnpm build -F picgo-plugin-bootstrap
```

## 4. 本地链接到思源 test 工作空间

`pnpm makeLink` 会把本仓库 `artifacts/siyuan-plugin-picgo/dist` 链接到思源工作空间的 `data/plugins/siyuan-plugin-picgo`。

```powershell
pnpm makeLink
```

要求：

- 思源笔记必须已经启动。
- 手工测试只选择 `test` 工作空间。
- 如果有多个工作空间，命令会列出编号；选择路径包含 `SiyuanWorkspace\test` 的那一项。

如果 `makeLink` 报 `ModuleNotFoundError: No module named 'distutils'`，说明当前 Python 运行时缺少旧版 `distutils`。本仓库脚本已经不再依赖 `distutils`；如果仍报错，先确认当前代码是最新的，再执行：

```powershell
python scripts/make_dev_link.py
```

## 5. 测试步骤

### 5.1 单元测试与审计

```powershell
pnpm --dir libs/Universal-PicGo-Store exec vitest run
pnpm --dir libs/Universal-PicGo-Core exec vitest run
pnpm --dir libs/zhi-siyuan-picgo exec vitest run
pnpm audit:picgo-refactor
```

只跑 v2 路径审计：

```powershell
pnpm audit:picgo-refactor v2-paths
```

如果要让审计同时检查真实 `test` 工作空间的 PicGo 配置目录：

```powershell
$env:SIYUAN_PICGO_AUDIT_WORKSPACE_DIR="D:\Users\Administrator\Documents\mydocs\SiyuanWorkspace\test"
pnpm audit:picgo-refactor v2-paths
Remove-Item Env:\SIYUAN_PICGO_AUDIT_WORKSPACE_DIR
```

### 5.2 思源插件测试

从仓库根目录执行：

```powershell
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
pnpm build -F picgo-plugin-app
pnpm build -F picgo-plugin-bootstrap
pnpm makeLink
```

然后重启思源笔记，只打开 `test` 工作空间。

在思源 `test` 工作空间验证：

1. 插件能加载，控制台能看到 PicGo 初始化日志。
2. 打开 PicGo 设置页，保存一次当前图床配置。
3. 检查主配置文件存在：

   ```powershell
   Test-Path "D:\Users\Administrator\Documents\mydocs\SiyuanWorkspace\test\data\storage\syp\picgo\picgo.cfg.json"
   Get-Content "D:\Users\Administrator\Documents\mydocs\SiyuanWorkspace\test\data\storage\syp\picgo\picgo.cfg.json" -Raw
   ```

4. 检查 workspace 配置目录没有 runtime 重物：

   ```powershell
   Get-ChildItem "D:\Users\Administrator\Documents\mydocs\SiyuanWorkspace\test\data\storage\syp\picgo" -Force
   ```

   该目录默认只应有 `picgo.cfg.json`。不应出现：

   - `node_modules/`
   - `package.json`
   - `package-lock.json`
   - `libs/`
   - `i18n-cli/`
   - `picgo-clipboard-images/`
   - `mac.applescript`、`windows.ps1`、`windows10.ps1`、`linux.sh`、`wsl.sh`
   - `picgo.log`
   - `external-picgo-cfg.json`

5. 检查本机 runtime 目录仍在：

   ```powershell
   Get-ChildItem "$HOME\.universal-picgo" -Force
   ```

   这里保存外部 PicGo 配置、插件依赖、runtime libs、i18n、剪贴板缓存和日志。

6. 上传测试：

   - 在设置页选择内置 PicGo，并确认当前图床配置正确。
   - 在文档里粘贴图片，或右键本地图片执行“上传到 PicGo 图床”。
   - 控制台应出现类似 `Uploading... Current uploader is [...]`。
   - Network 中图床请求应返回 200。
   - 文档里的图片链接应替换为图床远端链接。

### 5.3 S3 / MinIO 本地测试要点

MinIO 地址通常分两类：

- S3 API：`http://127.0.0.1:9000`
- MinIO Console：`http://127.0.0.1:9001`

PicGo 的 S3 endpoint 必须填 S3 API 地址，不是 Console 地址。

如果上传返回 403，优先检查：

- access key / secret key 是否是当前 MinIO 实例的有效凭据。
- bucket 是否存在。
- bucket policy 或当前用户策略是否允许 `PutObject`。
- PicGo S3 配置是否开启了 path style access。
- endpoint、bucket、region、自定义域名是否和 MinIO 实例匹配。

### 5.4 外部 lib 测试

库包测试：

```powershell
pnpm --dir libs/Universal-PicGo-Store exec vitest run
pnpm --dir libs/Universal-PicGo-Core exec vitest run
pnpm --dir libs/zhi-siyuan-picgo exec vitest run
```

库包构建：

```powershell
pnpm --dir libs/Universal-PicGo-Store build
pnpm --dir libs/Universal-PicGo-Core build
pnpm --dir libs/zhi-siyuan-picgo build
```

检查 npm 包内容：

```powershell
pnpm --dir libs/Universal-PicGo-Store pack
pnpm --dir libs/Universal-PicGo-Core pack
pnpm --dir libs/zhi-siyuan-picgo pack
```

打包内容必须包含：

- `dist/`
- `README.md`

### 5.5 Publisher 无界面 PicGo 契约调试

publisher 项目路径：

```text
D:\Users\Administrator\Documents\mydocs\siyuan-plugins\siyuan-plugin-publisher
```

本仓库 change `picgo-headless-publisher-contract` 是 Publisher change
`publisher-picgo-headless-ui` 的上游依赖。Publisher 必须等 PicGo 侧库包
已经发布，或已经通过明确的本地打包/链接流程可用后，再开始接入新版契约。
不要把 Publisher 旧版 PicGo bridge 行为当作目标契约。

PicGo 侧先按依赖顺序构建新版 lib：

```powershell
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
```

外部消费者只依赖 npm 包和自己的界面，不需要安装
`siyuan-plugin-picgo` 插件产品，也不应该检测
`/data/plugins/siyuan-plugin-picgo/plugin.json` 作为运行前置条件。

Publisher 后续应使用 `zhi-siyuan-picgo` 的 headless 契约，不再硬编码旧路径。
推荐调用形态：

```ts
import { createSiyuanPicGoHeadlessManager } from "zhi-siyuan-picgo"

const picgo = await createSiyuanPicGoHeadlessManager(siyuanConfig, { isDev })
const uploaders = picgo.listUploaders()
const schema = picgo.getUploaderSchema("github")
```

默认路径解析结果：

```text
configPath    = [workspace]/data/storage/syp/picgo/picgo.cfg.json
baseDir       = ~/.universal-picgo
pluginBaseDir = ~/.universal-picgo
```

调试时可显式覆盖路径：

```ts
const picgo = await createSiyuanPicGoHeadlessManager(siyuanConfig, {
  isDev: true,
  paths: {
    configPath: "D:/tmp/picgo-debug/picgo.cfg.json",
    runtimeDir: "D:/tmp/picgo-debug/runtime",
    pluginBaseDir: "D:/tmp/picgo-debug/runtime",
  },
})
```

PicGo 契约负责：

- 上传核心行为。
- PicGo 配置持久化语义。
- 上传器列表与配置 schema。
- 保存/上传前的结构化校验。
- SiYuan 工作空间路径与本机 runtime 路径解析。

Publisher 只负责自己的轻量图床设置 UI，以及 per-platform
`picbedService` 等发布偏好。PicGo 侧不向 Publisher 提供：

- 共享 Vue 设置页。
- `siyuan-plugin-picgo` 插件产品依赖。
- 完整第三方 PicGo 插件配置界面或插件市场 UI。

publisher 集成验证要点：

1. publisher 依赖新版 `zhi-siyuan-picgo`。
2. 发布流程通过 `createSiyuanPicGoHeadlessManager` 触发 PicGo 上传。
3. 控制台能看到 PicGo v2 path contract 日志。
4. 主配置来自 `test` 工作空间的 `data/storage/syp/picgo/picgo.cfg.json`。
5. runtime、插件依赖、external PicGo 配置仍在 `~/.universal-picgo`。
6. 未安装 `siyuan-plugin-picgo` 插件产品时，Publisher 仍可列出上传器、保存配置并上传。

最终 npm 发布前，Publisher 可用本地 tgz 包冒烟：

```powershell
$packDir = "$env:TEMP\picgo-headless-packs"
New-Item -ItemType Directory -Force $packDir
pnpm --dir libs/Universal-PicGo-Store pack --pack-destination $packDir
pnpm --dir libs/Universal-PicGo-Core pack --pack-destination $packDir
pnpm --dir libs/zhi-siyuan-picgo pack --pack-destination $packDir

pnpm --dir "D:\Users\Administrator\Documents\mydocs\siyuan-plugins\siyuan-plugin-publisher" add "$packDir\universal-picgo-store-*.tgz"
pnpm --dir "D:\Users\Administrator\Documents\mydocs\siyuan-plugins\siyuan-plugin-publisher" add "$packDir\universal-picgo-*.tgz"
pnpm --dir "D:\Users\Administrator\Documents\mydocs\siyuan-plugins\siyuan-plugin-publisher" add "$packDir\zhi-siyuan-picgo-*.tgz"
```

## 6. 构建结果判定

构建通过至少同时满足：

- 命令正常回到 shell。
- 输出有 `Tasks: ... successful` 或包自身 `built` 成功。
- 没有 `ELIFECYCLE` / `Command failed with exit code ...`。

以下 Vite browser compatibility warning 不允许作为通过结果：

- `Module "path" has been externalized for browser compatibility`
- `Module "fs" has been externalized for browser compatibility`
- `Module "http" has been externalized for browser compatibility`
- `Module "vm" has been externalized for browser compatibility`

PowerShell 检查示例：

```powershell
$out = pnpm build -F universal-picgo 2>&1 | Out-String
foreach ($m in @("path", "fs", "http", "vm")) {
  if ($out -like "*Module `"$m`" has been externalized for browser compatibility*") {
    throw "unexpected externalized warning: $m"
  }
}
```

## 7. 插件正式发版

### 7.1 准备版本与 changelog

```powershell
pnpm install
pnpm prepareRelease
```

`prepareRelease` 会同步 `plugin.json`、各 package 版本号，并整理 `CHANGELOG.md`。

### 7.2 构建发布包

```powershell
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
pnpm package
```

`pnpm package` 会构建：

- `picgo-plugin-app`
- `picgo-plugin-bootstrap`

并生成插件 zip。

### 7.3 插件发布产物

```text
build/siyuan-plugin-picgo-<version>.zip
build/package.zip
```

`build/package.zip` 是同一发布包的便捷取名。

## 8. 外部 lib 正式发布

可发布包：

- `universal-picgo-store`
- `universal-picgo`
- `zhi-siyuan-picgo`

发布前构建：

```powershell
pnpm --dir libs/Universal-PicGo-Store build
pnpm --dir libs/Universal-PicGo-Core build
pnpm --dir libs/zhi-siyuan-picgo build
```

发布前检查打包内容：

```powershell
pnpm --dir libs/Universal-PicGo-Store pack
pnpm --dir libs/Universal-PicGo-Core pack
pnpm --dir libs/zhi-siyuan-picgo pack
```

正式发布：

```powershell
pnpm --dir libs/Universal-PicGo-Store publish --access public
pnpm --dir libs/Universal-PicGo-Core publish --access public
pnpm --dir libs/zhi-siyuan-picgo publish --access public
```

发布顺序建议：

1. `universal-picgo-store`
2. `universal-picgo`
3. `zhi-siyuan-picgo`
4. 回到 publisher 项目升级依赖并测试

## 9. 产物结构

| 路径 | 含义 | 用途 |
| --- | --- | --- |
| `artifacts/siyuan-plugin-picgo/dist/` | 思源插件本地输出 | `pnpm makeLink` 本地调试 |
| `build/siyuan-plugin-picgo-<version>.zip` | 插件正式版本压缩包 | 对外发版 |
| `build/package.zip` | 同一发布包便捷取名 | 对外分发 |
| `libs/Universal-PicGo-Store/dist/` | `universal-picgo-store` 发布产物 | 外部库发布 |
| `libs/Universal-PicGo-Core/dist/` | `universal-picgo` 发布产物 | 外部库发布 |
| `libs/zhi-siyuan-picgo/dist/` | `zhi-siyuan-picgo` 发布产物 | 外部库发布 / publisher 消费 |

## 10. 清理

```powershell
pnpm clean
```
