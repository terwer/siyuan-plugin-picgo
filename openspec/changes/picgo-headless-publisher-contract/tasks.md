## 1. Contract 形状

- [ ] 1.1 定义 `universal-picgo` 和 `zhi-siyuan-picgo` 的 public headless manager/facade API 名称、输入类型、返回类型和错误结构。
- [ ] 1.2 明确哪些 API 属于通用 `universal-picgo`，哪些 SiYuan 专属 API 属于 `zhi-siyuan-picgo`。
- [ ] 1.3 文档明确：外部消费者不需要安装 `siyuan-plugin-picgo` 插件产品。
- [ ] 1.4 增加 TypeScript 导出类型：uploader 列表项、uploader schema 字段、校验结果、headless manager options。

## 2. 配置管理

- [ ] 2.1 实现 public 配置读取 API，能够初始化默认值并保留未知字段。
- [ ] 2.2 实现有边界的 uploader 配置保存 API，不能覆盖无关配置 section。
- [ ] 2.3 实现当前 uploader 读取/设置 API，并使用 PicGo canonical config structure。
- [ ] 2.4 确保配置操作使用 `picgo-v2-config-path-split` 的 v2 path resolver，不创建第二套路由规则。
- [ ] 2.5 如需要，增加旧配置迁移行为；迁移语义必须与 path split 的 copy-only/no-delete/no-overwrite 决策一致。

## 3. Uploader 元数据和 Schema

- [ ] 3.1 盘点 `Universal-PicGo-Core` 注册的全部内置 uploaders。
- [ ] 3.2 将每个内置 uploader 的配置定义规范化为可序列化 schema metadata。
- [ ] 3.3 在 schema 中标记 token、secret、password 等敏感字段。
- [ ] 3.4 在可用时包含默认值、必填标记、字段类型和 list 可选项。
- [ ] 3.5 增加 audit：如果内置 uploader 缺少 schema，或存在无法表示为轻量 UI 字段的配置项，则失败。

## 4. 校验和上传

- [ ] 4.1 实现 uploader 配置校验 API，返回结构化字段级错误。
- [ ] 4.2 确保保存和测试上传路径使用相同校验规则，除非走文档明确标记的 raw escape hatch。
- [ ] 4.3 暴露使用托管配置和当前 uploader 的上传入口。
- [ ] 4.4 确保既有 `SiyuanPicGo` Markdown 图片替换能力可以使用同一配置来源和路径解析。
- [ ] 4.5 为未知 uploader id、缺失必填字段、无效配置和上传失败增加结构化错误处理。

## 5. 文档和发版

- [ ] 5.1 更新 lib README 或 DEVELOPMENT docs，增加 SiYuan 插件 headless consumer 使用示例。
- [ ] 5.2 文档说明 `universal-picgo-store`、`universal-picgo`、`zhi-siyuan-picgo` 的构建和发版顺序。
- [ ] 5.3 文档交叉引用 Publisher change `publisher-picgo-headless-ui`，说明 Publisher 实现必须在 lib release/link 之后开始。
- [ ] 5.4 文档明确不提供的内容：共享 Vue UI、PicGo 插件产品依赖、完整第三方插件配置 UI。

## 6. 验证

- [ ] 6.1 增加配置读取/保存/当前 uploader 操作的单测。
- [ ] 6.2 增加 uploader 列表和 schema 输出的单测或聚焦集成测试。
- [ ] 6.3 增加必填字段和未知 uploader id 的校验测试。
- [ ] 6.4 成功构建 `universal-picgo-store`、`universal-picgo` 和 `zhi-siyuan-picgo`。
- [ ] 6.5 在 SiYuan `test` 工作空间验证 `siyuan-plugin-picgo` 仍能打开设置页并通过既有产品 UI 上传。
- [ ] 6.6 提供 Publisher 在最终 npm release 前可使用的 local-link 或 packed-package smoke 路径。
