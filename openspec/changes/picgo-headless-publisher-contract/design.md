## Context

`picgo-internal-refactor` 已经开始收敛 `picgo-plugin-bootstrap`、`picgo-plugin-app`、`Universal-PicGo-Core`、`Universal-PicGo-Store`、`zhi-siyuan-picgo` 的职责边界。`picgo-v2-config-path-split` 正在处理 v2 配置路径拆分：workspace 同步配置与设备本地 runtime/插件依赖分离。

在这个基础上，外部消费者仍缺少一个明确的 headless public contract。Publisher 当前依赖旧版 `zhi-siyuan-picgo`，并在 V2 图床设置里沿用了“检测并打开完整 PicGo 插件”的思路。这不是未来目标，只能视为旧方案问题样本。真正顺序是：先在 PicGo 仓库完成并发布新版 lib，再让 Publisher 升级依赖并自写轻量图床 UI。

## Goals / Non-Goals

**Goals:**

- 让外部插件只依赖 npm lib 即可使用 PicGo 图床能力，不要求安装 `siyuan-plugin-picgo` 插件。
- 提供稳定的 headless manager/facade，覆盖配置读写、uploader 列表、schema、校验、当前图床切换和上传。
- 让 Publisher 可以自写轻量 UI，但字段定义、默认值、校验和保存格式来自 PicGo lib，避免另造一套图床模型。
- 与 `picgo-v2-config-path-split` 对齐：配置路径、runtime 路径、外部 PicGo 配置、日志/缓存路径必须通过同一解析入口，不让消费者猜路径。
- 保持 `siyuan-plugin-picgo` 插件产品可继续使用，但它不再代表外部消费者必须安装的运行依赖。
- 给发版和 Publisher 接入提供可验证的契约和任务顺序。

**Non-Goals:**

- 不把 `picgo-plugin-app` 的完整设置页抽给 Publisher 使用。
- 不要求 Publisher 支持 PicGo 插件市场或完整 PicGo 桌面端配置体验。
- 不在 Publisher 中复制 Universal-PicGo 内部 uploader 实现或配置模型。
- 不让本 change 直接修改 Publisher 仓库；Publisher 的落地由 `publisher-picgo-headless-ui` 负责。
- 不以 Publisher 当前旧版 lib 代码作为最终目标架构依据。

## Decisions

### 1. Headless manager 优先，而不是共享 UI

PicGo 仓库提供 headless manager/facade，Publisher 自己实现轻量 UI。

```text
Publisher V2 UI
  └─ PicGo headless manager from zhi-siyuan-picgo
      ├─ listUploaders()
      ├─ getUploaderSchema(type)
      ├─ getConfig()/saveUploaderConfig()
      ├─ setCurrentUploader()
      ├─ validateUploaderConfig()
      └─ upload()/uploadMarkdownImages()
```

理由：Publisher 的问题不是缺完整 PicGo 设置页，而是缺一个可信的底层配置/上传契约。共享完整 UI 会把 PicGo 插件产品边界再次泄漏给 Publisher。

替代方案：抽 `picgo-config-ui` 共享包。暂不采用，因为它容易带入完整插件产品状态，且 Publisher 只需要发布场景的轻量配置体验。

### 2. 配置模型由 lib 拥有，UI 由消费者拥有

- `universal-picgo` / `zhi-siyuan-picgo` 拥有配置结构、默认值、schema、校验和持久化语义。
- `siyuan-plugin-publisher` 拥有自己的展示方式、平台级图床选择和发布偏好。
- Publisher 可以白名单展示部分 uploader，但不能重新定义字段含义或保存格式。

### 3. Schema 必须足够驱动轻量表单

每个 uploader schema 至少提供：

- uploader id
- 展示名称
- 说明
- 字段列表
- 字段类型：`input` / `password` / `confirm` / `list` / 后续可扩展类型
- 是否必填
- 默认值
- 当前值来源路径
- 是否敏感字段
- 校验提示 / 可选项

这样 Publisher 可以选择“schema 自动渲染”或“手写表单 + schema 对齐”，但不需要从 PicGo 插件 UI 里抄配置逻辑。

### 4. SiYuan 路径解析只通过 zhi-siyuan-picgo

外部消费者不直接拼 `[workspace]/data/storage/syp/...` 或 `~/.universal-picgo/...`。`zhi-siyuan-picgo` 提供实例创建和路径解析，内部复用 `picgo-v2-config-path-split` 的结果。

### 5. Publisher 集成以发布后的 lib 为准

本 change 完成后需要先发布新版 `universal-picgo`、`universal-picgo-store`、`zhi-siyuan-picgo`。Publisher change 只能在升级新版依赖后实现，不应针对旧包临时补丁。

## Risks / Trade-offs

- [Risk] Schema 过弱，Publisher 仍需要硬编码大量字段。→ Mitigation：每个内置 uploader 都要有 schema audit，至少覆盖当前 PicGo 设置页需要的字段。
- [Risk] Schema 过强，变成 UI 框架。→ Mitigation：只描述数据和校验，不提供 Vue 组件，不绑定 Element Plus。
- [Risk] Publisher 与 PicGo 插件同时修改同一配置造成覆盖。→ Mitigation：配置写入必须基于 read-modify-write，保存时只写目标 uploader/current 字段，不覆盖未知字段。
- [Risk] v2 路径拆分与 headless contract 冲突。→ Mitigation：headless manager 创建必须复用同一 path resolver，不新增第二套路径规则。
- [Risk] 第三方 PicGo plugin 配置无法轻量化。→ Mitigation：首版只要求内置 uploader schema；第三方 plugin 可保留为非目标或只读/高级 JSON 后续再议。

## Migration Plan

1. PicGo 仓库实现 headless contract，并保持独立 PicGo 插件产品正常工作。
2. 对内用 `siyuan-plugin-picgo` 设置页和 upload smoke 验证新 contract 不破坏原功能。
3. 对外发布新版 lib 包。
4. Publisher 仓库 `publisher-picgo-headless-ui` 升级依赖到新版 `zhi-siyuan-picgo` 并重写 V2 图床设置。
5. Publisher 移除“必须安装 PicGo 插件”的检查和打开 PicGo 插件 iframe 的旧入口。

## Open Questions

- Publisher 首版是否展示所有内置 uploader，还是只展示白名单？本 contract 支持两者，Publisher change 决定 UI 范围。
- 第三方 PicGo plugin/uploader 是否在未来进入 Publisher 轻量 UI？首版不作为必须项。
- `siyuan-plugin-picgo` 独立插件和 Publisher 默认是否共享同一 workspace PicGo 配置？倾向共享同一 lib 配置，但 Publisher 仍保留自己的平台级 `picbedService` 偏好。
