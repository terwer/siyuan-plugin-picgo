# 进度日志

## 会话：2026-05-24

### 阶段 1：需求与发现
- **状态：** complete
- 读取计划文件，确认 `vm-browserify` direct `eval` 告警确实存在。
- 追踪到 `vite-plugin-node-polyfills -> node-stdlib-browser -> crypto-browserify -> browserify-sign -> parse-asn1 -> asn1.js -> vm-browserify`。
- 进一步确认真正的业务触发点是 `crypto-js`。

### 阶段 2：方案设计
- **状态：** complete
- 选择移除 `crypto-js`，改用纯浏览器 `spark-md5` + Web Crypto HMAC。
- 目标是消除 Node polyfill 链，而不是在构建侧静默处理。

### 阶段 3：实现
- **状态：** complete
- 已替换 CSDN/知乎的加密实现。
- 已修复 publisher 与本地 `zhi-siyuan-picgo` link 的跨版本类型冲突。
- 已将 `zhi-siyuan-picgo` 重建。

### 阶段 4：测试与验证
- **状态：** complete
- `pnpm exec vitest run src/utils/cryptoUtils.spec.ts src/adaptors/web/csdn/csdnUtils.spec.ts`：通过 7/7。
- `pnpm build:v2`：通过，且不再输出 direct `eval` / `vm-browserify` 告警。

### 阶段 5：交付
- **状态：** complete
- 已整理结论，可回到原 OpenSpec change 继续收尾或归档。

## 关键证据
- `dist-v2/index.js` 原先包含 `require_vm_browserify().runInThisContext(...)`。
- 现在 `pnpm build:v2` 不再输出 `[EVAL] Use of direct eval function...`。
- 业务加密替换单测通过，证明改动没有破坏关键签名逻辑。
