# 发现与决策

## 结论
- `siyuan-plugin-publisher` V2 的 `vm-browserify` direct `eval` 告警已根治，不是被忽略。
- 根因不是业务里显式 `eval`，而是胖依赖触发的 Node polyfill 链。

## 根因链
- 业务侧原先的 `crypto-js` 触发了 `crypto-browserify -> browserify-sign -> parse-asn1 -> asn1.js -> vm-browserify`。
- `vite-plugin-node-polyfills` 当前配置为全量 polyfill，放大了这条链。
- `js-md5` 的 Node wrapper 也会继续引入 `crypto-browserify`，因此不能作为最终方案。

## 修复
- CSDN 签名改为 Web Crypto HMAC-SHA256 Base64。
- 知乎图片 MD5 改为纯浏览器 `spark-md5`。
- 移除了 `crypto-js`，避免把 Node 兼容链带入 V2 bundle。

## 验证
- `pnpm exec vitest run src/utils/cryptoUtils.spec.ts src/adaptors/web/csdn/csdnUtils.spec.ts`：7/7 通过。
- `pnpm build:v2`：通过，且不再输出 direct `eval` / `vm-browserify` 告警。

## 对后续的建议
- 若后续还要继续压缩 bundle，可再考虑收紧 `vite-plugin-node-polyfills` 的 include/override 范围。
- 但这次问题已经不需要依赖构建侧 suppression。
