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
7. [complete] 基于最新提交后的代码、OpenSpec 文档、测试和审计门禁重新做全量审计。
8. [complete] 汇总偏离点；如存在偏离，输出可直接交给 agent 执行的修复 prompt，并将审计结果固化到 `docs/audits/`。
9. [complete] 用户修复后复审最新代码、diff、审计脚本和验证门禁。
10. [complete] 固化复审结果到 `docs/audits/` 并输出是否仍有偏离。
11. [complete] 根据复审剩余偏离完成二次修复：domain-scoped retry、Node workspace 三 owner mapping、v3 marker 防覆盖、instanceKey identity 与审计 gate。
12. [complete] 重新运行 build/test/audit/OpenSpec validate，并更新 docs/audits 与规划记录。

## 错误记录
| 时间 | 错误 | 尝试次数 | 处理 |
|------|------|----------|------|
| 2026-06-23 | `pnpm audit:picgo-refactor` 失败 | 1 | 判定脚本仍含旧 v2/旧版本断言，已作为审计偏离记录到 docs/audits |
| 2026-06-23 | 修复后复审仍发现偏离 | 1 | 已固化到 `docs/audits/2026-06-23-picgo-3-unified-async-config-source-post-fix-audit.md`，并给出二次修复 prompt |
| 2026-06-23 | 二次修复过程中 zhi tsc 提示 `storageAdapterFactory` 未使用 / core dist 类型过旧 | 1 | 将 factory 传入 `UniversalPicGo` options，并先构建 `universal-picgo` 刷新 d.ts；最终 zhi tsc 通过 |

