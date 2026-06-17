# 任务计划：修复悬浮窗配置更新后不重载导致上传失败

## 目标
定位并修复 PC 客户端中悬浮窗每次打开未重新加载 PicGo 配置的问题，确保切换空间/下拉框修改配置后，拖拽上传使用当前工作空间配置，解决 `[drag-upload] 操作失败=>TypeError: undefined is not iterable (cannot read property Symbol(Symbol.iterator))`。

## 当前假设
- 用户环境为思源 PC 客户端。
- test 工作空间配置路径：`/Volumes/workspace/mydocs/SiYuanWorkspace/test/data/storage/syp/picgo`。
- 需要优先验证运行代码中配置读取、缓存和悬浮窗打开生命周期。

## 阶段
1. [complete] 建立上下文：检查仓库结构、已有规划、关键配置/上传代码入口。
2. [complete] 追踪配置加载链路：找到 PicGo 配置读取、缓存、切换、下拉框保存逻辑。
3. [complete] 追踪悬浮窗生命周期：确认打开/关闭/重开时是否复用旧实例或旧状态。
4. [complete] 定位 `undefined is not iterable` 根因：结合上传链路与配置数据结构验证。
5. [complete] 实施最小修复：保证悬浮窗打开时刷新当前工作空间配置，并避免旧配置污染上传。
6. [complete] 验证：运行类型检查/测试/构建或最小可执行验证，记录结果。

## 待确认问题
- 若存在多种刷新策略（每次打开强制读磁盘、监听配置变更事件、保存后主动刷新内存），需要在证据明确后向用户确认取舍。

## 错误记录
| 时间 | 错误 | 尝试次数 | 处理 |
|------|------|----------|------|
| 2026-06-17 | 用户报告 `[drag-upload] 操作失败=>TypeError: undefined is not iterable (cannot read property Symbol(Symbol.iterator))` | 1 | 定位到悬浮窗复用 iframe + 上传链路未强制 reload 配置，已修复并构建验证 |
