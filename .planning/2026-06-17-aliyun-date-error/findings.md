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
