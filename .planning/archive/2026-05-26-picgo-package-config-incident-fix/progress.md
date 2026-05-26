# 进度日志

## 会话：2026-05-26
- 接管已有修改，创建本次事故修复计划。

- 补齐 UniversalPicGo 测试 fake fs 的 fd/writeSync/renameSync/unlinkSync 行为，使 JSONStore atomic write 能真实影响内存文件。
- 调整 fake fs closeSync 行为：atomic write 在 close 后仍需要 rename 从临时文件搬运内容，避免测试桩提前丢失 fd 映射。
- UniversalPicGo reload 测试同步写入 fake fs 与 jsdom localStorage，覆盖测试环境模块预加载时可能选择 localStorage adapter 的情况。
- 补齐 siyuanPicgoPaths 旧迁移测试 fake fs.readFileSync，以适配迁移逻辑需要判断已有 workspace 配置是否只是默认 smms。
- 加固 ConfigForm 初始化：切换/重开表单时清空旧字段并重置首次保存跳过标记，避免旧配置残留触发保存覆盖。
- 修正 ConfigForm 防初始化保存逻辑：移除会吞掉第一次真实用户修改的 skip 标记，改为仅在表单初始化期间通过 ready=false 抑制保存。
- 修正 scripts/package.py：zip/copy 阶段不再吞异常，只有真正完成后才打印“插件打包完毕”。
- 单测通过：UniversalPicGo/ConfigDb 6 个测试通过；zhi-siyuan-picgo path/helper 9 个测试通过。
- lint 通过：pnpm --filter picgo-plugin-app run lint。
- Python 语法检查通过：scripts/package.py、scripts/scriptutils.py。
- pnpm package 在正常权限下已完成，但 UniversalPicGo 构建过程中暴露 TS2741：createContext 缺少 reloadConfig，必须修掉后重跑打包。
- 修复 createContext：补充 reloadConfig 绑定，并新增单测防止 upload 子上下文缺少该方法。
- 修复 createContext 后复跑通过：UniversalPicGo/ConfigDb 7 个测试通过；zhi-siyuan-picgo path/helper 9 个测试通过；app lint 通过；Python py_compile 通过。
- pnpm package 最终通过：app/bootstrap 两段 turbo build 均 successful，scripts/package.py 打印“插件打包完毕”。
- zip 检查通过：build/siyuan-plugin-picgo-2.0.0.zip 与 build/package.zip 均存在，包含 index.html、index.js、plugin.json。

## 新增修复：2026-05-26 外联字体请求
- 用户明确：不是调整外链地址，而是不要外联字体请求。目标为移除远程 @font-face URL。
- 更正外联字体修复方向：用户要求参考 Zhihu theme 的 `siyuan.wiki/libs/fonts`，不是去掉外联。
- 已将 picgo-plugin-app/src/assets/webfont.css 中 99 个字体 URL 从 static-rs-terwer OSS 基准替换为 `https://siyuan.wiki/libs/fonts/`。
- 实测 `https://siyuan.wiki/libs/fonts/opensans/OpenSans-Regular.woff2` 为 200，但 `.woff` 为 404；已移除 OpenSans `.woff` fallback，只保留 woff2，避免继续 404。
- lint 通过：pnpm --filter picgo-plugin-app run lint。
- pnpm package 通过，产物 CSS 文件为 assets/index-BIEAal7K.css。
- 产物和 zip 检查：CSS 已不含 static-rs-terwer 字体基准；包含 siyuan.wiki/libs/fonts；OpenSans 只保留 woff2，不再包含 404 的 .woff fallback。
