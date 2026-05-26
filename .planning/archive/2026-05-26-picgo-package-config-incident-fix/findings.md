# 发现与决策

## 已知问题范围
- 打包链路：build 失败必须中断，不能继续压旧产物；root build 需保持 `turbo run build`。
- 配置链路：上传前需要刷新运行时配置，避免 UI 已更新但 bootstrap/core 仍读旧内存配置。
- 配置保存：编辑/新增配置不得无意覆盖当前选中；保存当前配置时保持选中并同步 picBed。
- 迁移：新 workspace 中由 ConfigDb 自动创建的默认 smms 配置不应阻止从 legacy home 配置迁移。

## 最终修复结论
- 打包链路恢复 root `build=turbo run build`，`pnpm package` 使用 subprocess check=True，清理旧 dist，并校验 index.html/index.js/plugin.json。
- 运行时上传前显式 reloadConfig，避免设置页保存后 bootstrap/core 内存配置仍旧导致上传走错图床。
- 配置编辑/新增不再覆盖已有 defaultId；只在编辑当前选中配置时同步 picBed。
- 新 workspace 默认 smms 配置可被 legacy home 配置替换，避免其他 workspace 迁移状态影响当前 workspace。
- createContext 已绑定 reloadConfig，防止 upload 子上下文类型/运行时缺方法。
