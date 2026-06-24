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
13. [complete] 2026-06-24 用户二次修复后最终复审最新提交与前次 4 项偏离。
14. [complete] 重新运行 build/test/audit/OpenSpec validate/typecheck，并固化最终复审文档。
15. [complete] 基于 2026-06-24 真机 PC/网页 popup 日志定位并修复初始化无效写入与 Kernel `saveTextData()` 返回形态误判，补充单测、打包并固化审计记录。
16. [complete] 评估修复后 PC/Web init 与 popup 四份真机日志，确认无 auto-flush/write 错误并记录剩余非阻断观察。
17. [complete] 按用户要求做代码级“真 async / 假 flush”专项审计，确认底层读写是真 async，但 facade flush 尚未 drain debounce/auto-flush 并发写，暂不归档。
18. [complete] 立即修复 facade drainable async flush：per-owner dirtyVersion/writeQueue/currentWriteTask、取消 debounce、join in-flight auto-flush，补测试/audit gate/打包验证并固化修复审计。
19. [complete] 更新 3.0 README：主 README/中文 README/app README 改为配置归一化叙事，2.0 路径移入历史路径，并轻量说明同一工作空间多入口同时写的 last-save 边界。

## 错误记录
| 时间 | 错误 | 尝试次数 | 处理 |
|------|------|----------|------|
| 2026-06-23 | `pnpm audit:picgo-refactor` 失败 | 1 | 判定脚本仍含旧 v2/旧版本断言，已作为审计偏离记录到 docs/audits |
| 2026-06-23 | 修复后复审仍发现偏离 | 1 | 已固化到 `docs/audits/2026-06-23-picgo-3-unified-async-config-source-post-fix-audit.md`，并给出二次修复 prompt |
| 2026-06-23 | 二次修复过程中 zhi tsc 提示 `storageAdapterFactory` 未使用 / core dist 类型过旧 | 1 | 将 factory 传入 `UniversalPicGo` options，并先构建 `universal-picgo` 刷新 d.ts；最终 zhi tsc 通过 |
| 2026-06-24 | 真机 popup 仅打开即触发 `picgo.cfg.json` Kernel auto-flush 并报 `saveTextData failed: unknown error` | 1 | 修复 `removeConfig` 缺失字段 no-op 不再调 facade 写入；修复 Kernel adapter 对 `saveTextData()` null 成功返回的误判并加写后验证 |
| 2026-06-24 | `pnpm audit:picgo-refactor` 因源码注释包含直连 `/api/file/` 字样误报 | 1 | 删除注释中的直连 endpoint 字面量，保持代码仍只经 `SiyuanKernelApi` wrapper |
| 2026-06-24 | 专项代码审计发现 `UnifiedConfigFacade.flush()` 不清理 `scheduleFlush()` 的 debounce timer，慢 Kernel 写入时可能与 auto-flush 并发写同 owner | 1 | 固化为 P1 async flush 语义缺口，给出修复 prompt；修复前不归档 |
| 2026-06-24 | 修复 async flush 后需确认不会只修源码不更新审计/打包产物 | 1 | 补充 fake timer 慢 adapter 单测、`pnpm audit:picgo-refactor` gate、OpenSpec validate 与 `pnpm package`，并新增 async-flush-fix 审计文档 |
