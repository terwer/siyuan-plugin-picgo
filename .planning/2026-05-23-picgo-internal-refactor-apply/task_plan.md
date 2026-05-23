# picgo-internal-refactor Apply 实施计划

## 目标

按 `openspec/changes/picgo-internal-refactor/tasks.md` 实施内部重构：先冻结和记录公共契约基线，再收敛 product/library、runtime/bundle、paste ownership 边界，补充验证脚本与证据日志。实现过程必须保持对外 API、manifest、配置和存储契约兼容。

## 当前阶段

阶段 5：宿主 smoke 与收尾（blocked_on_host_smoke）

## 阶段

- [x] 阶段 1：契约与构建基线记录（OpenSpec 任务 1.1-1.6）
  - 记录插件入口、manifest、workspace package 导出、配置字段、存储路径、运行时行为。
  - 记录 package 脚本、构建/test/lint 命令、direct eval 告警和引入链。
  - 记录 package role 与 product/lib 冲突证据、粘贴上传时序缺陷。
- [x] 阶段 2：架构边界设计与文档落地（OpenSpec 任务 2.1-2.1.4、2.3.1、2.4-2.5、2.6-2.14 的设计部分）
  - 形成职责边界、运行时能力矩阵、依赖输入策略、product/library 分层、lifecycle ownership、bundle audit gate、package export 策略。
  - 形成 paste ownership、transaction、ports、rollback、旧路径删除和 host API spike 计划。
- [x] 阶段 3：代码重构落地（OpenSpec 任务 2.2-2.3.2、2.6-2.13 的实现部分）
  - 移除/隔离 `zhi-siyuan-picgo/src` 深层 import，补正式 facade。
  - 引入显式 runtime/host/paste 适配层，压缩旧 paste 补偿主路径。
  - 隔离 UI/helper/npm/配置迁移等不应进入 lib 主入口的能力。
- [x] 阶段 4：契约测试与审计脚本（OpenSpec 任务 3.1-3.2.2）
  - 增加公共导出、manifest、配置/存储契约、依赖方向、bundle 审计验证。
  - 分别验证产品 bundle 与可发布 lib bundle。
- [ ] 阶段 5：宿主 smoke 与收尾（OpenSpec 任务 3.3-4.3，4.1-4.3 已完成，3.3 系列等待真实 SiYuan host smoke）
  - 运行或记录无法运行真实 SiYuan 宿主 smoke 的阻塞条件。
  - 汇总重构结果、API 审计、风险、证据日志，更新 OpenSpec 任务勾选。

## 决策原则

- 每完成一个 OpenSpec 任务后立即更新 `tasks.md` 勾选，并在 `progress.md` 记录。
- 对外 API 默认不可变；如发现必须破坏兼容，暂停并提出新变更。
- 优先小步、可回滚、可验证的修改；避免大规模目录搬迁。
- 真实宿主行为优先于源码推断；若本环境无法运行 SiYuan host，不把真实 smoke 任务标记完成。

