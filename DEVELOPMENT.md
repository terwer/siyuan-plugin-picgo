# Development

## 1. 安装依赖

```bash
pnpm install
```

## 2. 本地调试

### 2.1 本地链接

`pnpm makeLink` 用于将本地构建产物链接到 SiYuan 工作空间的 `data/plugins/siyuan-plugin-picgo`。

```bash
pnpm makeLink
```

说明：

- 仅用于本地开发
- 不用于正式发版
- 手工验证仅在 `test` 工作空间进行

### 2.2 构建顺序

修改底层库时，先构建库包：

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
```

修改插件前端或入口时，再构建插件包：

```bash
pnpm build -F picgo-plugin-app
pnpm build -F picgo-plugin-bootstrap
```

### 2.3 手工验证

在 SiYuan 的 `test` 工作空间检查：

- 插件加载
- 设置页打开
- 图片粘贴
- 右键图片上传

仅查看前端输出时：

```bash
pnpm serve -F picgo-plugin-app
```

持续构建时：

```bash
pnpm dev -F picgo-plugin-app
pnpm dev -F picgo-plugin-bootstrap
```

## 3. 插件正式发版

### 3.1 发版前准备

```bash
pnpm install
pnpm prepareRelease
```

`prepareRelease` 只处理版本号与 changelog。

### 3.2 构建与打包

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
pnpm package
```

`pnpm package` 会重新构建 `picgo-plugin-app` 和 `picgo-plugin-bootstrap`，并生成发布包。

### 3.3 发版产物

- `build/siyuan-plugin-picgo-<version>.zip`
- `build/package.zip`

其中 `build/package.zip` 是对外分发时使用的便捷文件名。

## 4. 外部 lib 发布

可发布的库包：

- `universal-picgo`
- `universal-picgo-store`
- `zhi-siyuan-picgo`

这些包的 `package.json` 已包含：

- `files: ["dist", "README.md"]`
- `publishConfig.access = public`

从仓库根目录直接执行：

```bash
pnpm --dir libs/Universal-PicGo-Store build
pnpm --dir libs/Universal-PicGo-Core build
pnpm --dir libs/zhi-siyuan-picgo build
```

发布命令：

```bash
pnpm --dir libs/Universal-PicGo-Core publish --access public
pnpm --dir libs/Universal-PicGo-Store publish --access public
pnpm --dir libs/zhi-siyuan-picgo publish --access public
```

## 5. 测试步骤

### 5.1 插件测试

从仓库根目录执行：

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
pnpm build -F picgo-plugin-app
pnpm build -F picgo-plugin-bootstrap
pnpm audit:picgo-refactor
```

将本地插件产物链接到 SiYuan：

```bash
pnpm makeLink
```

在 `pnpm makeLink` 的工作空间选择中，只选择 `test` 工作空间。

随后在 SiYuan `test` 工作空间手工检查：

- 插件能正常加载
- 设置页能正常打开
- 图片粘贴上传正常
- 右键图片上传正常

测试正式发布包时：

```bash
pnpm prepareRelease
pnpm package
```

检查并使用以下产物：

- `build/siyuan-plugin-picgo-<version>.zip`
- `build/package.zip`

### 5.2 外部 lib 测试

运行三个库包的测试：

```bash
pnpm --dir libs/Universal-PicGo-Store exec vitest run
pnpm --dir libs/Universal-PicGo-Core exec vitest run
pnpm --dir libs/zhi-siyuan-picgo exec vitest run
```

构建三个库包：

```bash
pnpm --dir libs/Universal-PicGo-Store build
pnpm --dir libs/Universal-PicGo-Core build
pnpm --dir libs/zhi-siyuan-picgo build
```

检查 npm 打包内容：

```bash
pnpm --dir libs/Universal-PicGo-Store pack
pnpm --dir libs/Universal-PicGo-Core pack
pnpm --dir libs/zhi-siyuan-picgo pack
```

打包内容应包含：

- `dist/`
- `README.md`

### 5.3 最小通过标准

- `pnpm audit:picgo-refactor` 通过
- 三个库包测试通过
- 三个库包构建通过
- 插件 app/bootstrap 构建通过
- SiYuan `test` 工作空间手工验证通过

### 5.4 构建结果判定

以下 Vite browser compatibility warning 不应出现在最终验证输出中：

- `Module "path" has been externalized for browser compatibility`
- `Module "fs" has been externalized for browser compatibility`
- `Module "http" has been externalized for browser compatibility`
- `Module "vm" has been externalized for browser compatibility`

如果出现上述 warning，需要继续修复依赖输入或构建配置；不要把它们作为可忽略 warning 记录通过。

构建通过至少应同时满足：

```text
Tasks:    ... successful
```

- 命令正常回到 shell
- 没有 `ELIFECYCLE` / `Command failed with exit code ...`
- 没有上述 `externalized for browser compatibility` warning

PowerShell 下可以用下面命令检查：

```powershell
$out = pnpm build -F universal-picgo 2>&1 | Out-String
foreach ($m in @("path", "fs", "http", "vm")) {
  if ($out -like "*Module `"$m`" has been externalized for browser compatibility*") {
    throw "unexpected externalized warning: $m"
  }
}
```

本次重构的动态代码与边界检查以审计命令为准：

```bash
pnpm audit:picgo-refactor
```

## 6. 产物结构

| 路径 | 含义 | 用途 |
| --- | --- | --- |
| `artifacts/siyuan-plugin-picgo/dist/` | SiYuan 插件本地输出 | 本地调试 |
| `build/siyuan-plugin-picgo-<version>.zip` | 插件正式版本压缩包 | 对外发版 |
| `build/package.zip` | 同一发布包的便捷取名 | 对外分发 |
| `libs/Universal-PicGo-Core/dist/` | `universal-picgo` 发布产物 | 外部库发布 |
| `libs/Universal-PicGo-Store/dist/` | `universal-picgo-store` 发布产物 | 外部库发布 |
| `libs/zhi-siyuan-picgo/dist/` | `zhi-siyuan-picgo` 发布产物 | 外部库发布 |

## 7. 检查与清理

验证周期建议执行：

```bash
pnpm audit:picgo-refactor
```

清理构建产物：

```bash
pnpm clean
```
