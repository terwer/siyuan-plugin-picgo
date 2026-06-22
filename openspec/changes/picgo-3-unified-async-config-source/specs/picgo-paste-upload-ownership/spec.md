## ADDED Requirements

### Requirement: 粘贴上传配置来自预热的统一 async snapshot
粘贴上传 ownership 判断和事务执行 SHALL 使用 PicGo 3.0 ready facade 预热出的 paste snapshot。

#### Scenario: listener 注册前预热 snapshot
- **WHEN** bootstrap 初始化 PicGo paste integration
- **THEN** 它 SHALL 在注册 paste listener 前创建并 await unified async facade
- **AND** 它 SHALL 从 owner files 构造包含 `autoUpload`、`txtImageSwitch`/`allowPicAndText`、`replaceLink` 的 `pasteTakeoverSnapshot`

#### Scenario: snapshot 不可用时不接管
- **WHEN** paste event 到达，且 ready snapshot 因 facade 初始化失败或 migration 失败而不可用
- **THEN** paste path SHALL NOT 接管该事件
- **AND** 它 SHALL 记录或提示明确原因
- **AND** 它 SHALL 让 host default paste path 继续执行，而不是读取 legacy localStorage

#### Scenario: 禁止通过旧 localStorage 决策
- **WHEN** production paste code 需要判断 PicGo 是否拥有 paste event
- **THEN** 它 SHALL NOT 调用 `window.localStorage.getItem("universal-picgo/picgo.cfg.json")`
- **AND** legacy key reads SHALL 只限于 migration importers 或 tests

## MODIFIED Requirements

### Requirement: 粘贴图片上传由插件从事件源头拥有
当 PicGo 自动粘贴上传在 ready paste snapshot 中启用时，插件 SHALL 在 SiYuan 默认粘贴处理或内部 asset 上传运行之前，独占拥有粘贴图片流程。

#### Scenario: 默认粘贴处理先被阻断
- **WHEN** 粘贴事件包含图片文件且 ready snapshot 中的 PicGo 自动粘贴上传已启用
- **THEN** 插件在开始任何 PicGo 上传之前，调用真实宿主事件的默认阻断能力，例如 `source.preventDefault()`
- **AND** SiYuan 的默认图片粘贴/内部 asset 上传路径不会为该图片运行

#### Scenario: 没有 ownership 意味着没有自动接管
- **WHEN** 插件无法证明真实宿主粘贴事件已被阻断
- **THEN** 自动 PicGo 接管路径不被视为本次重构的有效路径

#### Scenario: snapshot 配置关闭时不阻断
- **WHEN** ready snapshot 显示 `autoUpload=false`、不允许图文混合，或标记多文件不受支持
- **THEN** paste path SHALL NOT 阻断 host paste
- **AND** 它 SHALL 返回确定性的 not-taken reason
