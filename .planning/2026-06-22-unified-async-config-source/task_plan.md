# 任务计划：修复 PicGo 3.0 统一 async config source 落地问题

## 目标
按既有计划实现 `picgo-3-unified-async-config-source`：将 ReadyUnifiedPicGoConfigFacade 接入生产链路，修复 async owner file 失败语义，移除生产 legacy localStorage 决策读取，并完成验证与审计记录。

## 范围
- OpenSpec 变更上下文与任务。
- universal-picgo-store / universal-picgo / zhi-siyuan-picgo / picgo-plugin-* 相关配置、上传、设置、paste/headless/migration 代码。
- 构建、测试、OpenSpec validate、grep/audit 与 docs/audits 记录。

## 阶段
1. [complete] 读取 OpenSpec 状态、上下文文件与当前代码现状。
2. [complete] 修复 facade/adapter async 读写失败语义与 resolver。
3. [complete] 接入 settings/upload/headless/uploader/paste/bootstrap 的 ready facade 生产链路。
4. [complete] 修复 migration/default recognition/mask 语义并补测试。
5. [complete] 运行验证命令与 grep/audit，修复回归。
6. [complete] 更新 OpenSpec tasks 与 docs/audits 验证记录。

## 错误记录
| 时间 | 错误 | 尝试次数 | 处理 |
|------|------|----------|------|

