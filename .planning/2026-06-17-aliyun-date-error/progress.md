# 进度日志：阿里云日期/签名报错

## 2026-06-17
- 已读取规划技能说明和旧活跃计划，旧计划为悬浮窗配置重载，按用户要求不继续该方向。
- 创建新计划 `2026-06-17-aliyun-date-error`，目标限定为阿里云 OSS 本身问题。
- 读取 `docs/aliyun-date-error-log.txt`，确认错误为 OSS 403：`OSS authentication requires a valid Date.`。
- 读取阿里云上传实现和统一请求封装，发现 `x-cors-headers` 只在思源代理路径展开；当前阿里云请求未设置 `proxy: true`，在 `hasNodeEnv` 为 true 时不会走思源代理。
- 用户补充确认：本问题已重载配置，应排除配置未加载/旧配置污染。
- 根据用户建议改用真实 `Date` 头方向；没有采用 `x-oss-date` 作为签名日期头。
- 修改 `libs/Universal-PicGo-Core/src/plugins/uploader/aliyun/web.ts`，确保签名日期和请求日期完全一致，并强制阿里云 PUT 使用思源代理展开 `Date`/`Host`。
- 新增 `libs/Universal-PicGo-Core/src/plugins/uploader/aliyun/web.spec.ts`，覆盖 Date/Authorization 一致性。
- 运行 `pnpm --filter universal-picgo exec vitest run src/plugins/uploader/aliyun/web.spec.ts`：通过。
- 使用真实 `picgo.cfg.json` 上传极小 PNG 到 OSS `test/` 前缀：首次因沙箱 DNS 失败；经用户授权网络后成功，HTTP 200。
- 运行 `pnpm --filter universal-picgo build`：通过；首次构建日志有 `proxy: true` 类型提示，已改为内部 `requestOptions: any` 后重跑构建通过且无 TS 报错。
- 再次运行阿里云 uploader 单测：通过。
- 用户反馈修复后测试仍失败，重新读取日志；日志仍显示直接 PUT OSS，而不是 `forwardProxy`。
- 初步判断需要继续排查构建/安装产物是否更新，而不是回到配置未加载方向。
- 继续排查用户反馈测试仍失败：日志仍为旧 bundle 直接 PUT OSS，当前 artifacts 已重构建并指向新 `index-B1DCwUw8.js`。
- 修复 `PicGoRequestWrapper` 未监听 `siyuan.proxy` 的问题，避免 `SiyuanPicgoPostApi.updateConfig()` 保存代理后 wrapper 仍直连。
- 修复 `siyuanProxyInterceptor()` 的 `new Request("")` 空 URL 问题。
- 新增并运行 `PicGoRequest.spec.ts` 与阿里云 uploader 单测：通过。
- 完整重构建 `universal-picgo`、`zhi-siyuan-picgo`、`picgo-plugin-app`、`picgo-plugin-bootstrap`：通过；当前 artifacts 前端资产为 `assets/index-B1DCwUw8.js?v=1781674041297`。
- 按用户要求收敛方案：不修改 `isSiyuanProxyAvailable()` 的 `isSameOrigin` 逻辑，只在判断前后添加 `console.info` 诊断日志。
- 修改 `libs/Universal-PicGo-Core/src/utils/common.ts`，输出 `siyuanProxy`、`win.location.origin`、`hasSiyuanProxy`、`isSameOrigin`。
- 运行构建：`pnpm --filter universal-picgo build`、`pnpm --filter zhi-siyuan-picgo build`、`pnpm --filter picgo-plugin-app build`、`pnpm --filter picgo-plugin-bootstrap build`：均通过。
- 当前插件前端产物更新为 `assets/index-0q_s3IrL.js?v=1781675344199`；已在 `libs/Universal-PicGo-Core/dist/index.js` 和插件产物中确认包含 `[isSiyuanProxyAvailable]` 日志标记。

## 2026-06-17 继续：dev 启动链路证据
- 用户确认实际使用 `pnpm dev -F picgo-plugin-bootstrap` 启动。
- 已核对 `packages/picgo-plugin-bootstrap/package.json`：`dev` 仅执行 `vite build --watch`，输出插件入口 `artifacts/.../index.js`。
- 已核对 `packages/picgo-plugin-app/package.json` 与 `vite.config.ts`：设置页/上传弹窗的前端 bundle `assets/index-*.js` 由 `picgo-plugin-app` 构建输出。
- 因此只运行 `pnpm dev -F picgo-plugin-bootstrap` 不会重建 `picgo-plugin-app` 的 `assets/index-*.js`；日志中的 `index-0q_s3IrL.js` 旧 bundle 与该链路一致。
- 最新 artifact 当前为 `assets/index-Bkhftqr9.js?v=1781681142594`，已包含 `runtime check`、`proxy:!0`、`/api/network/forwardProxy`、`siyuan.proxy deprecated`。

- 已确认 `pnpm dev -F picgo-plugin-bootstrap` 只 watch/bootstrap 入口，不会重建 `picgo-plugin-app` 的 `assets/index-*.js`。
- 用户日志里的 `index-0q_s3IrL.js` 对应旧 UI bundle，因此不能拿它否定 `win.siyuan` 运行时判断方案。
- 已重新构建 `picgo-plugin-app` 与 `picgo-plugin-bootstrap`，最终落盘产物为 `artifacts/siyuan-plugin-picgo/dist/assets/index-Bkhftqr9.js` 与 `artifacts/siyuan-plugin-picgo/dist/index.js`。
- 关键验证通过：`universal-picgo` 单测通过，`picgo-plugin-app build`、`picgo-plugin-bootstrap build` 通过。
