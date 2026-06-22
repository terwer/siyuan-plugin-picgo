## ADDED Requirements

### Requirement: Docker/Web storage 持久化迁移保持现有用户数据兼容
Docker/Web storage 持久化 SHALL 在不破坏既有桌面、本地文件和纯浏览器行为的前提下，让旧 localStorage PicGo 主配置具备可迁移路径。

#### Scenario: Docker 老用户 localStorage 配置迁移
- **WHEN** Docker/Web 用户已有旧 localStorage PicGo 主配置且 Kernel 主配置文件不存在
- **THEN** 系统 SHALL 将旧主配置迁移到 `data/storage/syp/picgo/picgo.cfg.json`
- **AND** 迁移 SHALL NOT 要求用户手动重新填写图床配置

#### Scenario: Kernel 文件已存在时保持其权威性
- **WHEN** Kernel 主配置文件已存在且浏览器 localStorage 中也有旧 PicGo 主配置
- **THEN** 系统 SHALL 读取 Kernel 主配置
- **AND** 系统 SHALL NOT 用旧 localStorage 覆盖 Kernel 主配置

#### Scenario: 桌面端持久化行为保持兼容
- **WHEN** 用户在 Electron/PC 端打开设置页、保存图床配置或上传图片
- **THEN** 系统 SHALL 继续使用原有本地文件存储行为
- **AND** Docker/Web Kernel storage change SHALL NOT 让桌面端退回 localStorage

#### Scenario: 纯浏览器无 Kernel API 时仍可使用 localStorage
- **WHEN** runtime 是纯浏览器且无法访问 SiYuan Kernel API
- **THEN** 系统 SHALL fallback 到 localStorage adapter
- **AND** 该 fallback SHALL 只适用于未判定为 Kernel storage 的纯浏览器场景
