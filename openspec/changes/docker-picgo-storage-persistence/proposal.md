## Why

Docker/Web 部署思源时，PicGo 图床主配置当前容易停留在浏览器 `localStorage`，导致不同设备 Web 端无法共享同一图床配置。issue `terwer/siyuan-plugin-picgo#460` 要求将 Docker/Web 下的 PicGo 主配置持久化到 workspace 的 `data/storage/syp/picgo/picgo.cfg.json`，并确保设置页、上传入口和旧配置迁移都进入同一可靠链路。

## What Changes

- 在 `universal-picgo-store` 中引入同步/异步 storage adapter 契约，使 `JSONStore` 支持同步本地文件、异步 Kernel storage 和 localStorage fallback。
- 在 `Universal-PicGo-Core` 中暴露 `storageMode`、`reloadConfigAsync()`、`flushConfig()`，并在 async/kernel 模式下确保默认配置初始化失败会显式阻止成功完成。
- 在 `zhi-siyuan-picgo` 中增加 Kernel storage adapter 与 runtime storage factory 判定；Docker/Web 下仅 PicGo 主配置写入 `data/storage/syp/picgo/picgo.cfg.json`，辅助/运行时配置保持本地存储。
- 设置页 iframe、bootstrap、publisher/上传入口各自独立判定 runtime，且上传前可通过 `reloadConfigAsync()` 拉取远端最新配置。
- 设置页 `v-model` + VueUse `useStorage` 自动保存链路在 async/kernel 模式下绑定 `flushConfig()`，写入失败必须提示用户。
- 旧 Docker/Web 用户在 Kernel 文件不存在但 localStorage 有旧主配置时执行一次性迁移；Kernel 文件存在时以 Kernel 文件为准。
- 明确业务层唯一 Kernel API 来源为 `SiyuanKernelApi` 实例；Kernel adapter 使用其 d.ts 暴露的 `isFileExists` / `getFile` / `saveTextData` 方法，不直接 `fetch`、拼接 `/api/file/*` URL 或调用裸 Kernel HTTP endpoint。

## Capabilities

### New Capabilities
- `docker-picgo-storage-persistence`: Docker/Web 下 PicGo 主配置通过 SiYuan Kernel 持久化、跨设备读取、旧 localStorage 迁移、异步刷新/flush、错误暴露和 runtime fallback。

### Modified Capabilities
- `picgo-headless-config-contract`: 无界面/外部消费者读取、保存、上传时应使用同一持久化配置来源，并支持 async/kernel 模式的刷新与 flush 语义。
- `picgo-public-contract-stability`: 现有桌面本地文件行为、纯浏览器 localStorage fallback 和旧 Docker localStorage 配置迁移必须保持兼容且可验证。
- `picgo-plugin-shell-ux`: 设置页自动保存链路必须在 async/kernel 模式下等待 flush 并把保存失败明确反馈给用户。
- `picgo-product-library-boundary`: SiYuan Kernel 文件访问只能通过 `SiyuanKernelApi` 实例注入到业务层，禁止业务层直接 `fetch`、拼接 `/api/file/*` URL 或访问裸 Kernel HTTP endpoint。
- `picgo-runtime-boundary-integrity`: runtime capability 判定必须在每个 JS realm 独立执行，尤其是设置页 iframe 不能依赖 bootstrap 父窗口 singleton。

## Impact

- Affected packages/layers:
  - `libs/Universal-PicGo-Store`: adapter 类型、`JSONStore` async cache/debounce/flush/refresh behavior、exports。
  - `libs/Universal-PicGo-Core`: `IPicGo` / `IUniversalPicGoOptions` API、`UniversalPicGo` 初始化、`ConfigDb` 默认配置 flush、相关 db consumers。
  - `libs/zhi-siyuan-picgo`: `SiyuanPicGo.getInstance()` options 归一化、storage factory、Kernel adapter、instance key、幂等 init、上传 API init。
  - `packages/picgo-plugin-app`: 设置页 storage composable、保存失败提示。
  - bootstrap / publisher / 上传链路：初始化 await、上传前 refresh、runtime factory 接入。
- Persistence contract:
  - Docker/Web 主配置：`universal-picgo/picgo.cfg.json` -> `data/storage/syp/picgo/picgo.cfg.json`。
  - `external-picgo-cfg.json`、`package.json`、i18n、插件运行时文件和本地缓存不进入 Kernel 主配置文件。
- Verification impact:
  - 每个实施阶段必须执行类型检查/测试。
  - 每个实施阶段必须对照 `docs/audits/2026-06-22-docker-picgo-storage-persistence-plan-audit.md` 的验收清单逐项确认。
