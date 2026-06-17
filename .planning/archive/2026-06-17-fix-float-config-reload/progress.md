# 进度日志

## 2026-06-17
- 创建规划：`2026-06-17-fix-float-config-reload`。
- 准备开始检查仓库代码、配置文件与上传链路。
- 完成初步仓库扫描，记录了关键包和可能的对照点：粘贴上传会在上传前 `reloadConfig()`。
- 已确认两个根因方向：悬浮窗同页重复打开不会重载 iframe；拖拽上传链路缺少上传前 reloadConfig。
- 已实施两处修复：`shell.ts` 每次打开同一悬浮窗页面时强制 reload iframe；`siyuanPicgoPostApi.ts` 在所有单图上传入口前执行 `ctx.reloadConfig()`。
- 已运行构建/类型检查：核心库 build、bootstrap build、app lint、app build 均通过。
- 已确认 test 工作空间插件目录链接到本仓库构建产物，因此当前构建已覆盖 PC 客户端 test 空间使用的插件文件。
