# Docker PicGo 配置持久化代码实现审计（修正版）

- 审计日期：2026-06-22
- 审计对象：当前工作区代码实现
- 对照基准：
  - `docs/audits/2026-06-22-docker-picgo-storage-persistence-plan-audit.md`
  - `openspec/changes/docker-picgo-storage-persistence/`

## 结论

**当前实现不通过。真正的阻断根因是：浏览器/iframe 端仍可能通过 `win`/`hasNodeEnv` 走 Node 文件路径读取配置，而不是走 Kernel adapter。**

这会直接破坏 issue #460 的核心目标：Docker/Web/浏览器设置页里的 PicGo 主配置应该通过 `SiyuanKernelApi` 持久化到：

```text
data/storage/syp/picgo/picgo.cfg.json
```

而不是继续依赖 `win.fs`、`win.require()` 或本地 JSON 文件读取。

## P0：浏览器端 runtime 判定仍被 `win` / `hasNodeEnv` 污染

### 证据 1：`hasNodeEnv` 使用 parent window 判定

位置：`libs/Universal-PicGo-Store/src/lib/utils.ts`

```ts
export const currentWin = (window || globalThis || undefined) as any
export const parentWin = (window?.parent || window?.top || window?.self || undefined) as any
export const win = currentWin?.fs?.rm ? currentWin : parentWin?.fs?.rm ? parentWin : currentWin
export const hasNodeEnv = typeof parentWin?.fs?.rm !== "undefined"
```

问题：

- 浏览器/iframe 自身不一定有 Node 能力；
- 但只要 parent/top 暴露了 `fs`，`hasNodeEnv` 就会变成 true；
- 随后 `win` 会指向 parent/top，业务层就可能通过 `win.require()`、`win.fs` 读取配置。

这正是“浏览器端依然通过 win 读取配置”的根因。

### 证据 2：storage factory 优先使用 `hasNodeEnv`，导致浏览器端直接走 JSONAdapter

位置：`libs/zhi-siyuan-picgo/src/lib/siyuanPicgo.ts`

```ts
function resolveStorageAdapterFactory(...) {
  if (hasNodeEnv) return { kind: "node-json", factory: (path) => new JSONAdapter(path) }

  if (getSiyuanRuntimeConfig()?.workspaceDir) {
    return createKernelFactory(config)
  }
  ...
}
```

问题：

`hasNodeEnv` 放在第一优先级，一旦 iframe/browser runtime 因 parent/top 暴露 `fs` 被判成 true，就不会再进入 `siyuan-kernel` 分支。

结果：

```text
browser/iframe -> hasNodeEnv true -> JSONAdapter -> win.require / win.fs -> 本地文件配置
```

而期望是：

```text
browser/iframe + SiYuan runtime/kernel 可用 -> SiYuanKernelStorageAdapter -> SiyuanKernelApi
```

### 证据 3：路径解析仍依赖 `hasNodeEnv` 与 `win.require`

位置：`libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.ts`

```ts
const getDefaultLocalPicGoDir = () => {
  if (!hasNodeEnv) return undefined
  const os = win.require("os")
  const path = win.require("path")
  return path.join(os.homedir(), ".universal-picgo")
}

const getWorkspacePicGoConfigPath = (workspaceDir: string) => {
  if (!hasNodeEnv || !workspaceDir) return undefined
  const path = win.require("path")
  return path.join(workspaceDir, "data", "storage", "syp", "picgo", "picgo.cfg.json")
}
```

如果 browser/iframe 被误判为 `hasNodeEnv`，这里会继续走 `win.require("path")` 生成本地文件路径。

### 证据 4：UniversalPicGo 初始化路径也仍按 `hasNodeEnv` 使用 `win`

位置：`libs/Universal-PicGo-Core/src/core/UniversalPicGo.ts`

```ts
if (hasNodeEnv) {
  const os = win.require("os")
  const fs = win.fs
  const path = win.require("path")
  ...
}
```

这说明即便上层传入 browser 场景，只要 `hasNodeEnv` 被 parent/top 污染，core 层仍会按 Node 文件系统处理配置路径。

### 证据 5：测试失败正暴露了这个问题

`pnpm --filter universal-picgo exec vitest run` 中失败：

```text
TypeError: l.require is not a function
```

这不是单纯测试问题，而是环境能力判定混乱的信号：代码走到了 `win.require("path")` 分支，但当前 `win` 并不具备预期的 Node require 能力。

## 必须修正的方向

### 1. 不要用 parent/top 的 `fs` 判定当前 runtime 是 Node

`hasNodeEnv` 不应等价于 `parentWin.fs` 存在。

至少要区分：

- 当前 JS realm 是否真的有 Node 文件能力；
- parent/top 是否只是宿主窗口；
- 当前入口是否是 iframe/browser 设置页；
- 当前入口是否应走 Kernel API。

### 2. `resolveStorageAdapterFactory()` 应优先识别 SiYuan Web/browser kernel 场景

对设置页 iframe / Web runtime，应优先尝试：

```ts
getSiyuanRuntimeConfig()?.workspaceDir
isSiyuanProxyAvailable()
```

满足后走：

```ts
SiYuanKernelStorageAdapter
```

不要先因为 `hasNodeEnv` true 就返回 `JSONAdapter`。

### 3. Node JSONAdapter 只应该用于真正桌面/Node 文件运行时

`JSONAdapter` 分支应只在“当前入口明确是 Electron/Node 文件能力入口”时启用，而不是由 parent/top `fs` 推导。

否则 browser/iframe 会继续通过 `win` 读配置。

### 4. 浏览器端路径应保持逻辑 key，不应生成/读取 workspace 物理路径

浏览器/iframe 下主配置 key 应保持：

```text
universal-picgo/picgo.cfg.json
```

再由 storage factory 映射到 Kernel 文件：

```text
data/storage/syp/picgo/picgo.cfg.json
```

不应在 browser/iframe 里用 `win.require("path")` 生成 workspace 物理路径再走 `JSONAdapter`。

## 次级问题

在修正 runtime 判定后，还需要继续确认：

- `SiYuanKernelStorageAdapter` 写入后检查 `saveTextData()` 返回的 `SiyuanData.code`；
- 设置页 `useCommonPicgoStorage()` 是否接入 `afterWrite -> flushConfig()`；
- 上传前是否使用 `await reloadConfigAsync()`；
- async 默认配置是否在 `waitReady()` 后补齐并 flush。

但这些都建立在 P0 runtime 判定正确的前提上。当前最先要修的是：**浏览器/iframe 不能再被 `win`/`hasNodeEnv` 带回 Node 文件配置路径。**

## 最终建议

**先修 runtime 能力判定。**

当前代码最关键的问题不是 API 名称，也不是单测断言，而是浏览器端仍可能通过 `win` 读取配置。修复后再重新审计后续持久化、flush、上传刷新链路。
