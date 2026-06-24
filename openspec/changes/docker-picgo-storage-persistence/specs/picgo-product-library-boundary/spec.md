## ADDED Requirements

### Requirement: SiYuan Kernel 文件能力通过封装注入到业务层
产品层、Siyuan adapter 层和 PicGo core SHALL 保持 Kernel 文件访问边界清晰；业务层 MUST 通过 `SiyuanKernelApi` 实例使用 Kernel 文件能力。

#### Scenario: Adapter 依赖 SiyuanKernelApi 而非底层 endpoint
- **WHEN** 实现 Docker/Web Kernel storage adapter
- **THEN** adapter SHALL 接收或创建 `SiyuanKernelApi` 实例
- **AND** adapter SHALL 通过该实例调用 d.ts 暴露的 `isFileExists`、`getFile`、`saveTextData` 文件方法
- **AND** adapter SHALL NOT 直接 `fetch`、拼接 `/api/file/*` URL 或绕过 `SiyuanKernelApi` 实例访问 Kernel HTTP endpoint

#### Scenario: Core 不感知 SiYuan Kernel 细节
- **WHEN** `UniversalPicGo` 或 `universal-picgo-store` 需要读写配置
- **THEN** 它们 SHALL 只依赖 storage adapter port
- **AND** 它们 SHALL NOT 直接依赖 `SiyuanKernelApi`、SiYuan DOM、Electron menu 或产品 UI 代码
