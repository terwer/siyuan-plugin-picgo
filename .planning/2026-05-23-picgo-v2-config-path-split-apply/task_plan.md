# picgo-v2-config-path-split 实施计划

## 目标

实施 OpenSpec 变更 `picgo-v2-config-path-split`：v2.0.0 将内置 PicGo 主配置 `picgo.cfg.json` 放回 SiYuan workspace 同步路径，同时保持 runtime、插件依赖、外部 PicGo 配置、缓存、日志等设备本地化。

## 边界

- 只操作当前项目 `siyuan-plugin-picgo`。
- SiYuan 运行验证只允许使用 `test` 工作空间。
- 不外部搜索。
- publisher 项目只做必要集成验证/文档说明，除非后续明确需要修改 publisher。

## 阶段

- [x] 阶段 1：恢复上下文并梳理路径调用点
- [x] 阶段 2：实现 core v2 路径 options 与 runtime/plugin 分离
- [x] 阶段 3：实现 zhi-siyuan-picgo workspace 配置解析与保守迁移
- [x] 阶段 4：修正 runtime/插件/clipboard/i18n 路径使用
- [x] 阶段 5：实现外部 lib / publisher v2 契约入口
- [x] 阶段 6：更新 README / DEVELOPMENT.md / 包内 README
- [ ] 阶段 7：增加 audit / 迁移测试并执行构建验证
- [ ] 阶段 8：等待或执行 SiYuan test 工作空间与 publisher smoke

## 当前状态

已完成 core、runtime、SiYuan 适配层、外部 lib v2 路径契约主体实现，已补 v2 path audit，并已更新 README、README_zh_CN、packages/picgo-plugin-app/README.md、DEVELOPMENT.md。下一步跑测试、构建和审计。
