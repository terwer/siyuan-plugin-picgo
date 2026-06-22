## ADDED Requirements

### Requirement: Docker/Web PicGo 主配置使用 Kernel storage
Docker/Web runtime 下，系统 SHALL 将 PicGo 主配置 `universal-picgo/picgo.cfg.json` 持久化到 SiYuan workspace 文件 `data/storage/syp/picgo/picgo.cfg.json`。

#### Scenario: Docker/Web 初始化使用 Kernel adapter
- **WHEN** PicGo 在 Docker/Web 思源环境初始化且当前 runtime 可通过封装的 Kernel API 访问 workspace storage
- **THEN** PicGo 主配置 SHALL 使用 `siyuan-kernel` storage adapter
- **AND** 主配置 SHALL 写入 `data/storage/syp/picgo/picgo.cfg.json`

#### Scenario: 只有 PicGo 主配置进入 Kernel storage
- **WHEN** Docker/Web runtime 创建 PicGo store adapter
- **THEN** `universal-picgo/picgo.cfg.json` SHALL 映射到 Kernel 文件 `data/storage/syp/picgo/picgo.cfg.json`
- **AND** `external-picgo-cfg.json`、`package.json`、i18n、插件运行时文件和本地缓存 SHALL NOT 写入该 Kernel 主配置文件

#### Scenario: Electron/PC 端本地文件行为保持不变
- **WHEN** PicGo 在 Electron/Node runtime 中初始化
- **THEN** PicGo 主配置 SHALL 继续使用本地 JSON 文件 adapter
- **AND** 该行为 SHALL NOT 回退为 Docker/Web Kernel adapter 或纯浏览器 localStorage fallback

### Requirement: Runtime storage factory 在每个 JS realm 独立判定
系统 SHALL 在 bootstrap、设置页 iframe、publisher 和上传入口各自所在 JS realm 内独立判定 storage factory，不得依赖另一个 realm 中缓存的 static singleton。

#### Scenario: 设置页 iframe 独立判定 Kernel storage
- **WHEN** 设置页在独立 iframe JS realm 中打开且可安全访问 `window.top.siyuan`
- **THEN** 设置页 SHALL 独立创建指向 Kernel storage 的 adapter factory
- **AND** 设置页 SHALL NOT 依赖 bootstrap 父窗口中已经初始化的 storage singleton

#### Scenario: 跨域或不可访问 top window 时安全 fallback
- **WHEN** 当前 browser realm 访问 `window.top.siyuan` 抛出异常或不可用
- **THEN** runtime 判定 SHALL 捕获异常
- **AND** 纯浏览器场景 SHALL fallback 到 localStorage adapter

#### Scenario: Node runtime 优先使用本地 JSON adapter
- **WHEN** 当前 runtime 具备 Node/Electron 文件能力并可使用本地 workspace 路径
- **THEN** storage factory SHALL 选择本地 JSON adapter
- **AND** 该判定 SHALL 优先于 browser top-window 探测

### Requirement: 业务层只通过 SiyuanKernelApi 访问 Kernel 文件
业务层访问 SiYuan Kernel 文件能力时 MUST 通过 `SiyuanKernelApi` 实例。Kernel adapter SHALL 使用 `SiyuanKernelApi` 暴露的 `isFileExists(path, "text")`、`getFile(path, "text")`、`saveTextData(path, text)` 完成读写，并 SHALL NOT 直接 `fetch`、拼接 `/api/file/*` URL 或调用裸 Kernel HTTP endpoint。

#### Scenario: Kernel adapter 读取主配置
- **WHEN** `SiYuanKernelStorageAdapter` 读取 `data/storage/syp/picgo/picgo.cfg.json`
- **THEN** 它 SHALL 先通过 `SiyuanKernelApi.isFileExists(path, "text")` 判断文件是否存在
- **AND** 文件存在时 SHALL 通过 `SiyuanKernelApi.getFile(path, "text")` 读取文本内容

#### Scenario: Kernel adapter 写入主配置
- **WHEN** `SiYuanKernelStorageAdapter` 写入 PicGo 主配置 JSON
- **THEN** 它 SHALL 通过 `SiyuanKernelApi.saveTextData(path, text)` 写入主配置
- **AND** 它 SHALL 检查返回的 `SiyuanData.code`，非 0 时显式失败

#### Scenario: 禁止绕过 SiyuanKernelApi 访问裸 endpoint
- **WHEN** Kernel API 返回鉴权失败、网络失败、文件缺失或非成功 kernel JSON code
- **THEN** Kernel adapter SHALL 通过 `SiyuanKernelApi` 实例暴露的返回值和异常处理 missing/unavailable/write failure
- **AND** 业务层 SHALL NOT 直接 `fetch`、拼接 `/api/file/*` URL 或绕过 `SiyuanKernelApi` 实例访问 Kernel HTTP endpoint

### Requirement: JSONStore 支持同步内存 API 与异步持久化边界
`JSONStore` SHALL 支持 sync adapter 与 async adapter 双模式，并在 async 模式下通过内存缓存保留现有同步 get/set/read API，同时用 `waitReady()`、`flush()` 和 `refreshAsync()` 暴露异步边界。

#### Scenario: Async store 初始化等待远端读取
- **WHEN** `JSONStore` 使用 async adapter 构造
- **THEN** `waitReady()` SHALL 在远端配置读取完成后 resolve
- **AND** 初始化失败 SHALL 被调用方观察到而不是静默吞掉

#### Scenario: Async set 最终通过 flush 落盘
- **WHEN** 调用方在 async store 上执行 `set()` 修改配置
- **THEN** store SHALL 更新内存快照并安排 debounce 写入
- **AND** `flush()` SHALL 等待 pending write 完成

#### Scenario: 写入失败通过 flush 显式暴露
- **WHEN** async adapter 写入失败
- **THEN** store SHALL 记录最后一次写入错误
- **AND** 后续 `flush()` SHALL 抛出该错误而不是提示保存成功

#### Scenario: refreshAsync 保护 pending write 与并发 set
- **WHEN** `refreshAsync()` 被调用
- **THEN** store SHALL 先执行 `flush()` 再读取远端配置
- **AND** 如果远端读取期间本地发生新的 `set()`，store SHALL NOT 用远端旧数据覆盖本地新写入

### Requirement: IPicGo 暴露 async/kernel 配置控制 API
PicGo core SHALL 暴露 `storageMode`、`reloadConfigAsync()` 和 `flushConfig()`，使调用方能够识别 async/kernel 模式、上传前刷新远端配置并在设置保存后等待落盘。

#### Scenario: storageMode 标识当前持久化模式
- **WHEN** 调用方读取 `IPicGo.storageMode`
- **THEN** 返回值 SHALL 为 `sync` 或 `async`
- **AND** Kernel storage 模式 SHALL 返回 `async`

#### Scenario: reloadConfigAsync 在 async 模式读取远端最新配置
- **WHEN** 调用方在 async/kernel 模式调用 `reloadConfigAsync()`
- **THEN** PicGo SHALL 刷新远端主配置
- **AND** 返回的配置 SHALL 反映刷新后的最新内存快照

#### Scenario: 首次默认配置初始化失败阻止 init 成功
- **WHEN** async/kernel 模式首次初始化缺省 PicGo 配置并需要写入默认值
- **THEN** 初始化 SHALL 执行 `flushConfig()` 或等价 flush
- **AND** 写入失败 SHALL 阻止初始化成功完成

### Requirement: 旧 localStorage 主配置保守迁移到 Kernel 文件
Docker/Web Kernel storage 模式 SHALL 在 Kernel 文件不存在且 localStorage 有合法旧主配置时执行一次性迁移；Kernel 文件存在时 MUST 以 Kernel 文件为准。

#### Scenario: Kernel 文件不存在且 localStorage 有旧配置
- **WHEN** Kernel 主配置文件 missing 且 `universal-picgo/picgo.cfg.json` localStorage 数据为合法 JSON
- **THEN** adapter SHALL 将该 JSON 写入 `data/storage/syp/picgo/picgo.cfg.json`
- **AND** 本次读取 SHALL 返回迁移后的配置

#### Scenario: Kernel 文件已存在时不被 localStorage 覆盖
- **WHEN** Kernel 主配置文件 exists 且 localStorage 中也存在旧配置
- **THEN** adapter SHALL 使用 Kernel 文件内容作为事实源
- **AND** adapter SHALL NOT 用 localStorage 内容覆盖 Kernel 文件

#### Scenario: Kernel API 不可用时不静默回退 localStorage
- **WHEN** runtime 已选择 Kernel storage 但 Kernel API 鉴权失败、网络失败或不可用
- **THEN** 初始化或读取 SHALL 显式失败
- **AND** 系统 SHALL NOT 静默改用 localStorage 并提示成功

### Requirement: 设置页自动保存链路在 async/kernel 模式 flush 并报错
设置页通过 `v-model` 与 VueUse `useStorage` 自动写入 PicGo 配置时，async/kernel 模式 SHALL debounce 调用 `flushConfig()`，并将 flush 失败反馈给用户。

#### Scenario: 连续修改嵌套字段最终落盘
- **WHEN** 用户在设置页连续修改 PicGo 配置中的嵌套字段
- **THEN** `useCommonPicgoStorage()` SHALL 在变更后 debounce 调用 `afterWrite`
- **AND** async/kernel 模式 SHALL 通过 `flushConfig()` 将最终配置写入 Kernel 文件

#### Scenario: 设置页保存失败显示错误
- **WHEN** 设置页自动保存触发 `flushConfig()` 且 Kernel 写入失败
- **THEN** 设置页 SHALL 调用 `onAfterWriteError`
- **AND** 用户 SHALL 看到图床配置保存失败的错误提示

### Requirement: 上传链路使用共享配置的最新版本
Docker/Web async/kernel 模式下，上传链路 SHALL 在执行上传前刷新 PicGo 主配置，以便设备 B 能使用设备 A 已保存到 Kernel 文件的最新图床配置。

#### Scenario: 设备 B 上传前读取设备 A 的最新配置
- **WHEN** 设备 A 已将图床配置保存到 `data/storage/syp/picgo/picgo.cfg.json`
- **AND** 设备 B 准备执行 PicGo 上传
- **THEN** 设备 B 的上传链路 SHALL 调用 `reloadConfigAsync()` 或等价刷新流程
- **AND** 上传 SHALL 使用 Kernel 文件中的最新图床配置

#### Scenario: Docker/Web 上传强制使用 bundled PicGo
- **WHEN** PicGo 在 Docker/Web async/kernel 模式初始化上传 API
- **THEN** 上传链路 SHALL 使用 bundled PicGo 配置路径
- **AND** 外部 PicGo 本地运行时配置 SHALL NOT 成为 Docker/Web 主配置共享的事实源
