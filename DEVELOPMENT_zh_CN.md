[English](DEVELOPMENT.md)

# 开发指南

## 环境要求

- Node.js 与 pnpm 版本以根目录 `package.json` 的 `packageManager` 为准。
- Python 3：用于 `picgo-plugin-app` 构建脚本和本地链接脚本。
- SiYuan 桌面端：仅在验证插件运行时需要。

安装依赖：

```bash
pnpm install
```

## 项目结构

| 包名 | 目录 | 说明 |
| --- | --- | --- |
| `universal-picgo-store` | `libs/Universal-PicGo-Store` | 存储层，封装 JSON 文件与 localStorage 读写 |
| `universal-picgo` | `libs/Universal-PicGo-Core` | PicGo 核心、内置上传器、无界面配置与上传管理 |
| `zhi-siyuan-picgo` | `libs/zhi-siyuan-picgo` | SiYuan 适配层，负责路径解析、上传接口、Markdown 图片替换 |
| `picgo-plugin-app` | `packages/picgo-plugin-app` | SiYuan 插件设置页，Vue 应用 |
| `picgo-plugin-bootstrap` | `packages/picgo-plugin-bootstrap` | SiYuan 插件入口、菜单、状态栏、粘贴上传等集成代码 |

依赖顺序：

```text
universal-picgo-store
  -> universal-picgo
    -> zhi-siyuan-picgo
      -> picgo-plugin-app
      -> picgo-plugin-bootstrap
```

pnpm 的 `-F` 参数使用包名，不使用目录名。

## 开发命令

### 单包开发

```bash
pnpm dev -F universal-picgo-store
pnpm dev -F universal-picgo
pnpm dev -F zhi-siyuan-picgo
pnpm dev -F picgo-plugin-app
pnpm dev -F picgo-plugin-bootstrap
```

### 默认插件业务开发

只修改 SiYuan 插件业务代码时，库包通常不需要 watch。先构建依赖链一次：

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
pnpm build -F picgo-plugin-app
```

然后只监听插件入口包：

```bash
pnpm dev -F picgo-plugin-bootstrap
```

适用范围：

- 插件入口逻辑
- 菜单、状态栏、命令注册
- 粘贴上传流程
- 调用已有 PicGo 能力的业务编排

只有修改库包源码时，才需要同时启动对应库包的 `pnpm dev -F ...`。

### 常见开发场景

#### 修改存储层

```bash
pnpm dev -F universal-picgo-store
pnpm dev -F universal-picgo
```

如果需要在插件中验证，再启动对应插件包：

```bash
pnpm dev -F zhi-siyuan-picgo
pnpm dev -F picgo-plugin-app
pnpm dev -F picgo-plugin-bootstrap
```

#### 修改 PicGo 核心、上传器、配置 schema

```bash
pnpm dev -F universal-picgo
pnpm dev -F zhi-siyuan-picgo
```

需要验证设置页时：

```bash
pnpm dev -F picgo-plugin-app
```

需要验证插件入口、菜单、粘贴上传时：

```bash
pnpm dev -F picgo-plugin-bootstrap
```

#### 修改 SiYuan 适配层

```bash
pnpm dev -F zhi-siyuan-picgo
pnpm dev -F picgo-plugin-app
pnpm dev -F picgo-plugin-bootstrap
```

#### 修改设置页 UI

```bash
pnpm dev -F picgo-plugin-app
```

浏览器预览设置页：

```bash
pnpm serve -F picgo-plugin-app
```

#### 修改插件入口或粘贴上传

```bash
pnpm dev -F picgo-plugin-bootstrap
```

## 构建

### 全量构建

```bash
pnpm build
```

根目录 `build` 会按 workspace 依赖顺序串行构建所有包。

### 单包构建

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
pnpm build -F picgo-plugin-app
pnpm build -F picgo-plugin-bootstrap
```

修改公共类型、导出入口或底层库后，先构建依赖链：

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
```

再构建插件包：

```bash
pnpm build -F picgo-plugin-app
pnpm build -F picgo-plugin-bootstrap
```

## 测试

### 单元测试

```bash
pnpm --dir libs/Universal-PicGo-Store exec vitest run
pnpm --dir libs/Universal-PicGo-Core exec vitest run
pnpm --dir libs/zhi-siyuan-picgo exec vitest run
```

### PicGo 无界面管理器测试

```bash
pnpm --dir libs/Universal-PicGo-Core exec vitest run src/headless/UniversalPicGoHeadlessManager.spec.ts
```

### OpenSpec 校验

```bash
openspec validate <change-id> --strict
```

示例：

```bash
openspec validate picgo-headless-publisher-contract --strict
```

## SiYuan 插件本地验证

### 构建插件产物

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
pnpm build -F picgo-plugin-app
pnpm build -F picgo-plugin-bootstrap
```

构建结果输出到：

```text
artifacts/siyuan-plugin-picgo/dist
```

### 链接到 SiYuan test 工作空间

```bash
pnpm makeLink
```

要求：

- SiYuan 已启动。
- 只选择 `test` 工作空间。
- 链接目标为 `artifacts/siyuan-plugin-picgo/dist`。

### 验证清单

在 SiYuan `test` 工作空间中验证：

1. 插件能正常加载。
2. PicGo 设置页能打开。
3. 当前图床配置能保存。
4. 通过既有插件界面上传图片成功。
5. Markdown 中的本地图片链接能替换为图床链接。
6. workspace 配置目录只保存主配置，不写入 runtime 文件。

workspace 主配置位置：

```text
[workspace]/data/storage/syp/picgo/picgo.cfg.json
```

本机 runtime 目录：

```text
~/.universal-picgo/
```

## v2 配置路径规则

主配置文件保存到工作空间：

```text
[workspace]/data/storage/syp/picgo/picgo.cfg.json
```

以下内容保留在本机 runtime 目录：

```text
~/.universal-picgo/
```

本机 runtime 内容包括：

- `external-picgo-cfg.json`
- PicGo 第三方插件依赖
- `node_modules`
- runtime libs
- i18n 文件
- 剪贴板缓存
- 日志文件
- 平台脚本

迁移规则：

- workspace `picgo.cfg.json` 已存在时直接使用，不覆盖。
- workspace `picgo.cfg.json` 不存在，且 `~/.universal-picgo/picgo.cfg.json` 存在时，只复制这个配置文件。
- 不删除旧的本机配置。
- 不迁移整个 runtime 目录。
- 不把本机 runtime 文件写入 workspace 配置目录。

## 无界面 PicGo API

### 通用入口

`universal-picgo` 提供平台无关的无界面管理器：

```ts
import { createPicGoHeadlessManager } from "universal-picgo"

const picgo = createPicGoHeadlessManager({
  configPath,
  runtimeDir,
  pluginBaseDir,
})

const uploaders = picgo.listUploaders()
const schema = picgo.getUploaderSchema("github")
const validation = picgo.saveUploaderConfig("github", config, { setCurrent: true })
const result = await picgo.upload(input)
```

### SiYuan 入口

`zhi-siyuan-picgo` 提供 SiYuan 专用门面：

```ts
import { createSiyuanPicGoHeadlessManager } from "zhi-siyuan-picgo"

const picgo = await createSiyuanPicGoHeadlessManager(siyuanConfig, { isDev })

const uploaders = picgo.listUploaders()
const schema = picgo.getUploaderSchema("github")
const result = await picgo.upload(input)
const postResult = await picgo.uploadMarkdownImages(pageId, attrs, mdContent)
```

### 职责边界

PicGo 库负责：

- 上传器列表
- 上传器配置 schema
- 配置持久化格式
- 字段级校验
- 当前上传器状态
- 上传行为
- SiYuan 路径解析

外部消费者负责：

- 自己的设置界面
- 产品级偏好配置
- 发布流程中的业务逻辑

外部消费者不需要安装 `siyuan-plugin-picgo` 插件产品。

`picgo-plugin-app` 是本插件的设置页，不作为共享 UI 包提供给外部消费者。

第三方 PicGo 插件市场 UI 不属于无界面契约范围。

## Publisher 本地集成验证

PicGo 仓库先构建库包：

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
```

打包为本地 tgz：

```bash
PACK_DIR=/tmp/picgo-headless-packs
mkdir -p "$PACK_DIR"

pnpm --dir libs/Universal-PicGo-Store pack --pack-destination "$PACK_DIR"
pnpm --dir libs/Universal-PicGo-Core pack --pack-destination "$PACK_DIR"
pnpm --dir libs/zhi-siyuan-picgo pack --pack-destination "$PACK_DIR"
```

在 Publisher 仓库安装本地包：

```bash
pnpm --dir /path/to/siyuan-plugin-publisher add "$PACK_DIR"/universal-picgo-store-*.tgz
pnpm --dir /path/to/siyuan-plugin-publisher add "$PACK_DIR"/universal-picgo-*.tgz
pnpm --dir /path/to/siyuan-plugin-publisher add "$PACK_DIR"/zhi-siyuan-picgo-*.tgz
```

Publisher 接入应基于 `zhi-siyuan-picgo` 的无界面契约，不依赖已安装的 `siyuan-plugin-picgo` 插件产品。

## 发布

### 插件产品发布

```bash
pnpm install
pnpm prepareRelease
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
pnpm package
```

插件产物：

```text
build/siyuan-plugin-picgo-<version>.zip
build/package.zip
```

### 库包发布

发布前构建：

```bash
pnpm --dir libs/Universal-PicGo-Store build
pnpm --dir libs/Universal-PicGo-Core build
pnpm --dir libs/zhi-siyuan-picgo build
```

发布前检查包内容：

```bash
pnpm --dir libs/Universal-PicGo-Store pack
pnpm --dir libs/Universal-PicGo-Core pack
pnpm --dir libs/zhi-siyuan-picgo pack
```

按依赖顺序发布：

```bash
pnpm --dir libs/Universal-PicGo-Store publish --access public
pnpm --dir libs/Universal-PicGo-Core publish --access public
pnpm --dir libs/zhi-siyuan-picgo publish --access public
```

## 清理

```bash
pnpm clean
```
