## Why

`zhi-siyuan-picgo` 已经作为外部 lib 被 `siyuan-plugin-publisher` 使用，但当前消费者仍容易把“PicGo 上传内核 / 配置模型”和“完整 `siyuan-plugin-picgo` 插件产品”混在一起。Publisher 用户为了使用 PicGo 图床能力被要求安装完整 PicGo 插件，导致体验割裂，也让 Publisher V2 图床设置走向错误的插件依赖方案。

现在需要先在 PicGo 仓库定义一个稳定的 headless public contract：外部插件可以独立读取/保存 PicGo 配置、列出图床、渲染轻量配置 UI、校验配置并执行上传，而不依赖 `siyuan-plugin-picgo` 插件是否安装。

## What Changes

- 新增面向外部消费者的 PicGo headless manager contract，由 `zhi-siyuan-picgo` 暴露 SiYuan 场景入口。
- 新增配置管理能力：读取完整配置、读取当前图床、保存图床配置、切换当前图床、写入默认值、保守迁移。
- 新增 uploader 元数据能力：列出内置 uploader、获取 uploader 配置 schema、声明字段类型/默认值/必填/敏感字段/说明。
- 新增配置校验能力：在保存和测试上传前提供结构化校验结果，避免 Publisher 自己复制校验逻辑。
- 新增上传能力契约：外部消费者可以用同一实例上传文件/Blob/路径，以及调用 Markdown 图片上传替换能力。
- 明确 `siyuan-plugin-picgo` 插件产品不再是外部 lib 的运行前置依赖；外部消费者只依赖 npm 包和自己的 UI。
- 明确本 change 是 `siyuan-plugin-publisher` 仓库 `publisher-picgo-headless-ui` 的上游依赖；PicGo lib 发布完成后 Publisher 才接入新版依赖。
- **BREAKING**：v2 public contract 允许整理旧的隐式路径和插件检测假设，但必须提供清晰的迁移说明和测试步骤。

## Capabilities

### New Capabilities

- `picgo-headless-config-contract`：外部消费者独立管理 PicGo 配置、图床 schema 和上传能力的 public contract。
- `picgo-publisher-integration-contract`：PicGo lib 与 Publisher 的跨仓库集成边界、发布顺序和互相引用规则。

### Modified Capabilities

- None.

## Impact

- 受影响包：
  - `libs/Universal-PicGo-Core`
  - `libs/Universal-PicGo-Store`
  - `libs/zhi-siyuan-picgo`
  - `packages/picgo-plugin-app` 只作为同一底层 contract 的内部消费者参考；它不是给 Publisher 复用的 UI 包。
- 受影响 public API：
  - `zhi-siyuan-picgo` 面向 SiYuan 消费者的导出入口。
  - `universal-picgo` 面向通用 headless 配置/上传管理的导出入口。
- 受影响文档：
  - lib README / DEVELOPMENT.md 中的发版说明、外部消费者接入说明。
  - 对 Publisher change `publisher-picgo-headless-ui` 的跨仓库引用。
- 消费者影响：
  - `siyuan-plugin-publisher` 后续会升级到新版 lib，并移除对已安装 `siyuan-plugin-picgo` 插件产品的强依赖。
