# 任务计划：排查阿里云日期/签名报错

## 目标
仅关注阿里云 OSS 图床本身问题：在用户已确认阿里云配置正确的前提下，依据 `docs/aliyun-date-error-log.txt` 和当前运行代码，定位报错根因并给出可复现修复方案。忽略另一个 agent 正在处理的配置重载/“配置为孩子”等其他问题。

## 范围
- 关注：阿里云 OSS provider、请求签名、Date/时间头、endpoint/bucket/objectKey 相关代码与日志。
- 不关注：悬浮窗配置重载、跨空间配置缓存、其他图床 provider。

## 阶段
1. [complete] 建立上下文：读取日志，抽取关键错误、请求参数和调用栈。
2. [complete] 定位阿里云上传实现：梳理 OSS provider、签名、Date 生成、请求发送链路。
3. [complete] 证据对照：将日志中的错误与代码路径逐项匹配，确认根因。
4. [complete] 修复方案：若根因明确，实施最小代码修复；若涉及业务/设计取舍，先向用户确认。
5. [complete] 验证：运行相关单测/类型检查/最小脚本验证，并记录结果。
6. [complete] 运行产物追踪：确认当前 SiYuan 插件实际加载的 app bundle 是否包含阿里云 Date 修复。
7. [complete] 第二轮修复：同步 `siyuan.proxy` 到请求 wrapper，并修复代理路径空 URL Request。
8. [complete] dev 启动链路修正：确认 `pnpm dev -F picgo-plugin-bootstrap` 不会重建 UI bundle，已补齐验证/说明。

## 待确认问题
- 暂无。若需要改变用户可见配置项、兼容策略或引入依赖，将先暂停并向用户确认。

## 错误记录
| 时间 | 错误 | 尝试次数 | 处理 |
|------|------|----------|------|
| 2026-06-17 | OSS 返回 `OSS authentication requires a valid Date.` | 1 | 已定位为阿里云 PUT 未实际携带有效 `Date`；已修复并真实上传验证 HTTP 200 |
