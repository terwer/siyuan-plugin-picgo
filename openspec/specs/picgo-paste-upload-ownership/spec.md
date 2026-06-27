# picgo-paste-upload-ownership 规范

## Purpose
待定 - 由归档变更 picgo-internal-refactor 创建。归档后更新 Purpose。
## Requirements
### Requirement: 粘贴图片上传由插件从事件源头拥有
当 PicGo 自动粘贴上传启用时，插件 SHALL 在 SiYuan 默认粘贴处理或内部 asset 上传运行之前，独占拥有粘贴图片流程。

#### Scenario: 默认粘贴处理先被阻断
- **WHEN** 粘贴事件包含图片文件且 PicGo 自动粘贴上传已启用
- **THEN** 插件在开始任何 PicGo 上传之前，调用真实宿主事件的默认阻断能力，例如 `source.preventDefault()`
- **AND** SiYuan 的默认图片粘贴/内部 asset 上传路径不会为该图片运行

#### Scenario: 没有 ownership 意味着没有自动接管
- **WHEN** 插件无法证明真实宿主粘贴事件已被阻断
- **THEN** 自动 PicGo 接管路径不被视为本次重构的有效路径

### Requirement: 禁止双上传补偿
本次重构 SHALL NOT 将双上传、延迟轮询、DOM 探测或事后 markdown 链接交换作为正常的粘贴上传架构。

#### Scenario: SiYuan uploadAsset 不作为粘贴补偿使用
- **WHEN** 处理自动粘贴图片上传
- **THEN** 正常路径不会先上传到 PicGo，然后调用 SiYuan `uploadAsset`，仅仅为了创建一个稍后替换的本地 asset

#### Scenario: 轮询不是事务边界
- **WHEN** 处理自动粘贴图片上传
- **THEN** 正确性不依赖 `waitTimeout`、`retryTimes`、`JsTimer`、等待 DOM 图片出现，或事后搜索 block markdown

#### Scenario: 链接替换不是隐蔽纠正
- **WHEN** 最终文档链接被写入
- **THEN** 它由插件拥有的粘贴事务写入，而不是偷取/替换由 SiYuan 默认粘贴行为插入的链接

### Requirement: 粘贴上传是一个明确的单事务
插件 SHALL 将粘贴图片上传视为一个明确事务，覆盖输入捕获、PicGo 上传、文档变更、元数据更新和失败处理。

#### Scenario: 成功粘贴有一个最终事实源
- **WHEN** 粘贴图片上传成功
- **THEN** 文档链接、PicGo 上传结果和 `custom-picgo-file-map-key` 元数据指向同一个插件拥有的图片结果
- **AND** 不存在稍后必须协调的未托管默认本地 asset 结果

#### Scenario: 失败可理解且有边界
- **WHEN** PicGo 上传、文档插入或元数据更新失败
- **THEN** 插件留下有边界、用户可理解的状态，而不是本地 asset、远程 URL、陈旧元数据和待处理重试定时器的半更新混合状态

### Requirement: 粘贴上传架构围绕事务边界重写
本次重构 SHALL 用产品级事务边界（例如 `PasteUploadTransaction`）替换 legacy 粘贴补偿脚本，而不是包装旧路径。

#### Scenario: 粘贴 listener 委托给事务 use case
- **WHEN** bootstrap 粘贴 listener 判定 PicGo 应处理一张粘贴图片
- **THEN** 它在阻止宿主默认行为后，委托给粘贴上传事务/application service
- **AND** listener 本身不直接编排 PicGo 上传、SiYuan asset 上传、DOM 查找、block markdown 替换和元数据变更

#### Scenario: 职责通过 ports 和 adapters 分离
- **WHEN** 粘贴上传被重构
- **THEN** 宿主事件解析/默认阻断被隔离在 paste event adapter 中
- **AND** 最终文档插入/替换被隔离在 document mutation port 后面
- **AND** `custom-picgo-file-map-key` 更新被隔离在 metadata repository 或等价边界后面

### Requirement: Legacy 补偿路径被移除，而不是被包装
旧的双上传补偿路径 SHALL 被视为要从自动粘贴上传中移除的设计缺陷，而不是兼容 fallback。

#### Scenario: ignoreReplaceLink 剪贴板旁路不是新核心
- **WHEN** 实现新的粘贴事务
- **THEN** 该事务不依赖 `uploadSingleImageToBed(..., ignoreReplaceLink=true)` 后再跟随一个独立的 bootstrap 轮询/替换 pass

#### Scenario: 默认本地 asset 不是中间事实源
- **WHEN** 自动粘贴上传成功
- **THEN** 最终文档状态由插件拥有的远程上传结果产生
- **AND** 不会仅仅为了让插件稍后替换它而创建 SiYuan 默认本地 asset 路径

### Requirement: 回滚行为在实现前设计
本次重构 SHALL 在接受实现前，为粘贴事务的每个阶段定义有边界的失败状态。

#### Scenario: 默认粘贴被阻止后 PicGo 上传失败
- **WHEN** 插件已阻止宿主默认粘贴行为且 PicGo 上传失败
- **THEN** 插件遵循已定义的回滚策略，例如不插入任何内容并给出清晰错误，或插入明确的重试占位符
- **AND** 它不会稍后触发 SiYuan 默认上传作为隐式 fallback

#### Scenario: 远程上传成功后文档变更失败
- **WHEN** PicGo 上传成功但将最终链接写入文档失败
- **THEN** 插件报告有边界的恢复状态，并且不写入声称文档包含远程图片的元数据

#### Scenario: 文档变更成功后元数据提交失败
- **WHEN** 最终文档链接已写入但元数据提交失败
- **THEN** 插件报告可恢复的元数据同步失败，而不启动延迟 DOM 轮询或第二次 asset 上传

### Requirement: 真实宿主验证是强制的
本次重构 SHALL 针对真实 SiYuan 宿主行为验证粘贴 ownership，而不只针对 mocks 或隔离单元测试。

#### Scenario: 宿主 smoke 证明默认阻断
- **WHEN** 本次重构准备 review
- **THEN** 真实 SiYuan 粘贴 smoke 或等价宿主级自动化证明，默认粘贴/内部上传在插件上传开始前已被阻止

#### Scenario: 仅 mock 证明不足
- **WHEN** 测试只 mock 粘贴 handler 或只断言最终 URL
- **THEN** 这些测试不足以接受粘贴上传重构

