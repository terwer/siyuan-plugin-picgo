# 发现记录：阿里云日期/签名报错

## 用户约束
- 只关注阿里云 OSS 本身问题。
- 忽略另一个 agent 正在处理的配置重载/其他问题。
- 不使用 mock 数据、占位符或临时方案。

## 调查发现
待补充。

## 2026-06-17 日志与初步代码证据
- `docs/aliyun-date-error-log.txt` 显示当前 uploader 已是 `aliyun`，上传目标为 `PUT https://static-rs-terwer.oss-cn-beijing.aliyuncs.com/test/20260617112742.jpg`，OSS 返回 403。
- OSS 返回体核心错误：`AccessDenied` / `OSS authentication requires a valid Date.` / `EC=0002-00000503`。
- 日志中 `hasNodeEnv => true`，但浏览器控制台调用栈出现 `xhr`，并且网络请求是直接 PUT 到 OSS 域名，不是 `POST /api/network/forwardProxy`。
- `libs/Universal-PicGo-Core/src/plugins/uploader/aliyun/web.ts` 中签名使用 `new Date().toUTCString()`，但请求头并没有直接设置 `Date`；实际把 `Date` 和 `Host` 放进了 `x-cors-headers`。
- `libs/Universal-PicGo-Core/src/lib/PicGoRequest.ts` 只有走 `siyuanProxyInterceptor()` 时才会展开 `x-cors-headers` 并删除该内部头；否则会直接用 axios 发请求，`Date/Host` 不会成为实际 OSS 请求头。
- 在 Node/Electron 环境中，只有 `userOptions.proxy === true` 才会强制走思源 `forwardProxy`；阿里云 `postOptions()` 当前未设置 `proxy: true`。

## 当前判断
- 该问题不是配置未加载。当前日志已经进入阿里云上传器，且目标 bucket/area/path 可见。
- 更可能根因：阿里云 OSS 签名需要有效 `Date`；当前请求实际没有携带有效 `Date` 头，因为 `Date` 被放在内部 `x-cors-headers`，但请求未走会展开它的思源代理链路。

## 2026-06-17 用户补充与真实验证
- 用户补充：`xmlhttp.setRequestHeader("x-oss-date", date)` 后会变成签名失败；`xmlhttp.setRequestHeader("Date", date)` 在 Postman 上请求成功。
- 读取真实 `picgo.cfg.json` 仅做脱敏校验：当前 uploader 为 `aliyun`，bucket=`static-rs-terwer`，area=`oss-cn-beijing`，path=`test/`，accessKeyId/accessKeySecret 存在。
- 已按用户允许，使用真实配置上传极小 PNG 到 OSS `test/` 前缀：`test/codex-date-test-1781672898069.png`，返回 HTTP 200 OK。
- 真实上传脚本使用的请求头：`Date: Wed, 17 Jun 2026 05:08:18 GMT`、`Content-Type: image/png`、`Authorization: OSS <accessKeyId>:<signature>`；未使用 `x-oss-date`。
- 本地沙箱 DNS 受限，首次直接运行脚本失败：`getaddrinfo ENOTFOUND static-rs-terwer.oss-cn-beijing.aliyuncs.com`；经用户允许网络后重跑成功。

## 修复实现
- `libs/Universal-PicGo-Core/src/plugins/uploader/aliyun/web.ts`
  - `generateSignature()` 改为接收外部传入的 `date`，避免签名 Date 与请求 Date 分别取当前时间导致潜在不一致。
  - `postOptions()` 添加真实 `Date` 请求头，并在 `x-cors-headers` 中保持同一个 `Date`，供思源 `forwardProxy` 展开。
  - 阿里云 PUT 请求设置 `proxy: true`，使 Electron/Node 环境强制走思源代理路径，保证 `Date`/`Host` 由代理实际发送给 OSS，而不是在 XHR 中被浏览器限制吞掉。
- `libs/Universal-PicGo-Core/src/plugins/uploader/aliyun/web.spec.ts`
  - 新增回归测试：验证 Date 头、`x-cors-headers.Date`、`proxy: true` 和 Authorization 签名使用同一个日期值。

## 2026-06-17 用户反馈测试仍失败后的新增证据
- 用户反馈测试不通过，并说明 `docs/aliyun-date-error-log.txt` 已更新。
- 读取日志后，文件 mtime 为 `Jun 17 11:28:35 2026`，日志内容仍指向 `index-DXnWUyWI.js?v=1781665919638`，错误时间为 `2026-06-17 11:27:42~43`。
- 日志中的网络请求仍是浏览器/axios 直接 `PUT https://static-rs-terwer.oss-cn-beijing.aliyuncs.com/test/20260617112742.jpg 403`，没有出现 `POST /api/network/forwardProxy`。
- 本地 `libs/Universal-PicGo-Core/dist/index.js` 已包含新代码片段：请求头 `Date`、`x-cors-headers.Date`、以及阿里云上传调用链中的新 date 变量。

## 新判断
- 真实上传脚本证明阿里云配置和 `Date` 头方案本身可用。
- 当前失败更像是运行时仍在执行旧的前端 bundle，或 app/插件安装目录没有使用刚构建的 `universal-picgo` 新产物。
- 下一步需要追踪实际运行的 `index-DXnWUyWI.js` 产物来源、包构建/链接流程，以及 workspace 插件目录是否已被更新。

## 2026-06-17 继续定位：新失败不是 OSS 签名方案本身
- 旧日志仍显示 `index-DXnWUyWI.js?v=1781665919638`，而当前重新构建后的 `artifacts/siyuan-plugin-picgo/dist/index.html` 指向 `assets/index-B1DCwUw8.js?v=1781674041297`。
- `test/data/plugins/siyuan-plugin-picgo` 是符号链接，指向本仓库 `artifacts/siyuan-plugin-picgo/dist`。
- 当前新 bundle 已确认包含：
  - 阿里云请求 `Date` 与 `x-cors-headers.Date`，并设置 `proxy:!0`。
  - `PicGoRequestWrapper` 对 `siyuan.proxy` 的监听。
  - `siyuanProxyInterceptor()` 中 `new Request(n.url || "http://localhost", ...)` 修复。
- 发现更关键的运行时 bug：`SiyuanPicgoPostApi.updateConfig()` 保存的是 `siyuan.proxy`，但 `PicGoRequestWrapper` 构造函数原先只监听 `picBed` / `picBed.proxy`，没有监听 `siyuan.proxy`。如果实例创建时 `siyuan.proxy` 还未初始化，后续保存不会同步到 `this.siyuanProxy`，于是即使阿里云请求设置 `proxy: true`，也会退回直连 OSS。
- 单测还暴露：真正进入思源代理路径时，`siyuanProxyInterceptor()` 使用 `new Request("")` 在 jsdom/标准 URL 实现里会抛 `Failed to parse URL from`；已改为用目标 URL 构造临时 Request。

## 第二轮修复实现
- `libs/Universal-PicGo-Core/src/lib/PicGoRequest.ts`
  - CONFIG_CHANGE 监听新增 `siyuan` 和 `siyuan.proxy`，确保运行期保存 `siyuan.proxy` 后请求 wrapper 立即可用。
  - `new Request("", ...)` 改为 `new Request(options.url || "http://localhost", ...)`，避免进入代理路径后因空 URL 抛错。
- `libs/Universal-PicGo-Core/src/lib/PicGoRequest.spec.ts`
  - 新增回归测试：实例创建时 `siyuan.proxy` 为空，随后通过 CONFIG_CHANGE 写入 `siyuan.proxy`，`proxy: true` 请求必须转成 `/api/network/forwardProxy`，并展开 `x-cors-headers` 中的 `Host/Date`。

## 2026-06-17 诊断日志收敛
- 用户明确要求：不允许改动 `isSameOrigin` 行为，只能在其前后加调试日志。
- 已确认 `isSiyuanProxyAvailable()` 当前逻辑保持为 `siyuanProxy === win.location.origin`，本轮只新增日志，不改变返回值。
- 新日志标记：`[isSiyuanProxyAvailable] before isSameOrigin` 与 `[isSiyuanProxyAvailable] after isSameOrigin`，用于下次用户测试时确认运行时 `siyuanProxy` 与 `origin` 是否一致。

## 2026-06-17 dev 启动链路发现
- 用户使用 `pnpm dev -F picgo-plugin-bootstrap` 时，只会 watch/build SiYuan 插件入口 `index.js`。
- 阿里云上传失败栈中的 `assets/index-0q_s3IrL.js` 属于 `picgo-plugin-app` 输出的 UI bundle，不属于 bootstrap watch 产物。
- 当前最新构建的 UI bundle 是 `artifacts/siyuan-plugin-picgo/dist/assets/index-Bkhftqr9.js`，`index.html` 引用 `?v=1781681142594`。
- 结论：上一次测试仍旧命中旧 UI bundle，不能证明 `win.siyuan` 运行时判断方案失败；需要用 `pnpm dev/build -F picgo-plugin-app` 更新 UI bundle 后再测。


## 2026-06-17 运行方式校验
- `pnpm dev -F picgo-plugin-bootstrap` 只监听/构建 bootstrap 入口，不会自动重建 `packages/picgo-plugin-app` 生成的 UI bundle。
- 日志中出现的 `index-0q_s3IrL.js` 是旧 UI bundle 文件名，而当前最新 UI bundle 是 `index-Bkhftqr9.js`。
- 因此“测试仍走旧逻辑”更可能是启动/加载了旧 UI 产物，而不是 `isSiyuanProxyAvailable()` 的 `win.siyuan` 判定本身失效。
- 现阶段不再修改 `win` 语义；要继续验证，应确保 bootstrap 启动时加载的是当前 `artifacts/siyuan-plugin-picgo/dist/index.html` 所引用的新 UI bundle。
## 2026-06-17 外层 Date 警告根因
- 上传成功但浏览器仍报 `Refused to set unsafe header "Date"`，不是 OSS 主链路失败。
- 代理分支中 `siyuanProxyInterceptor()` 已正确把 `Date/Host` 放进 forwardProxy body，但 `axios.create(this.options)` 的 `this.options.headers = userOptions.headers` 会让外层 XHR 也继承 OSS 请求头。
- 浏览器禁止 XHR 设置 `Date`，所以外层 XHR 会打印警告；同时由于 forwardProxy body 内仍有 Date，上传仍成功。
- 修复点应限定在外层 axios 实例 headers 清理，不改变 `win`、`forwardProxy` body 或 OSS 签名逻辑。
