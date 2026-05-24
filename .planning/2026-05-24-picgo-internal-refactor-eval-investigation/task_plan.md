# 任务计划：picgo-internal-refactor eval 消除探索

## 目标
查清 `siyuan-plugin-publisher` V2 构建中 `vm-browserify` direct `eval` 告警的真实引入链，并通过根因修复将其消除，达到 `picgo-internal-refactor` 对架构技术债清理的要求。

## 当前阶段
已完成

## 各阶段

### 阶段 1：需求与发现
- [x] 确认告警的真实来源、影响范围与验收标准
- [x] 识别 `vm-browserify` 的依赖链与 bundle 引入点
- [x] 将发现记录到 findings.md
- **状态：** complete

### 阶段 2：方案设计
- [x] 对比可行修复路径（源码替换、依赖升级/降级、alias、条件导出、打包配置）
- [x] 选择最小且根治的方案
- [x] 记录决策及理由
- **状态：** complete

### 阶段 3：实现
- [x] 按选定方案修改代码或构建配置
- [x] 避免用 suppression 或 warning 过滤掩盖问题
- [x] 保持改动最小且可回滚
- **状态：** complete

### 阶段 4：测试与验证
- [x] 重新构建 V2 包并确认 direct `eval` 告警消失
- [x] 必要时补充回归验证与日志证据
- [x] 将测试结果记录到 progress.md
- **状态：** complete

### 阶段 5：交付
- [x] 汇总结论、修复点与验证证据
- [x] 明确是否可以回到原 OpenSpec change 继续收尾
- [x] 交付给用户
- **状态：** complete

## 关键问题
1. `vm-browserify` 是通过哪条依赖链进入 publisher V2 bundle 的？
2. 这条链是否可以用根因替换，而不是仅在构建侧静默处理？
3. 验收标准应以哪些 build / smoke 输出为准？

## 已做决策
| 决策 | 理由 |
|------|------|
| 不接受仅靠忽略 warning 通过 | `picgo-internal-refactor` 的目标就是消除架构技术债，不是掩盖告警。 |
| 用纯浏览器实现替换 `crypto-js` / `js-md5` 的 Node 分支 | 这些 Node 分支会把 `crypto-browserify -> asn1.js -> vm-browserify` 拉进 bundle。 |

## 结果
- `pnpm exec vitest run src/utils/cryptoUtils.spec.ts src/adaptors/web/csdn/csdnUtils.spec.ts`：通过 7/7。
- `pnpm build:v2`：通过，且不再输出 direct `eval` / `vm-browserify` 告警。
