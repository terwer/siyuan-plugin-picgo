# 会话进度：无本地图片时跳过 uploader 配置校验

## 2026-10-13

### 做了什么

1. 接收下游（siyuan-plugin-publisher issue #2050）排查结论，确认上游根因：
   - `SiyuanPicGoHeadlessManager.uploadMarkdownImages` 无图片时仍前置校验 uploader 配置
   - 底层 `uploadPostImagesToBed` 已有「文章中没有图片」正确短路
2. 读取上游源码确认：
   - `SiyuanPicGoHeadlessManager.ts` L84-96（根因）
   - `siyuanPicgoPostApi.ts` L240-340（检测 + 短路 + 上传）
   - `ImageParser.parseLocalImagesToArray` L198-225（assets/ 正则）
3. 调用点分析：`uploadMarkdownImages` 唯一消费者为 Publisher；`uploadPostImagesToBed` 唯一调用点为 manager
4. 契约检查：`picgo-publisher-integration-contract`（发版先于 Publisher 集成；校验职责在上游）
5. 发版流程确认（DEVELOPMENT_zh_CN.md）：build → pack → publish；本地 tgz 集成验证通道可用
6. 方案定稿：U1（抽取 `parsePostLocalImages` 复用，无本地图片时跳过 uploader 校验）

### 实施（U1）

1. `siyuanPicgoPostApi.ts`：新增 `parsePostLocalImages(pageId, mdContent)` 公共方法（原检测逻辑原样抽出）；`uploadPostImagesToBed` 改调该方法
2. `SiyuanPicGoHeadlessManager.ts`：`uploadMarkdownImages` 前置检测——无本地图片时跳过 uploader 配置校验，直接委托底层返回「文章中没有图片」
3. 测试：
   - `siyuanPicgoPostApi.spec.ts` 追加 `parsePostLocalImages` 2 例
   - 新建 `SiyuanPicGoHeadlessManager.spec.ts` 3 例（无图片跳过校验 / 有图片校验 / 配置无效抛错）

### 测试与验证结果

| 项 | 结果 |
| --- | --- |
| `pnpm --dir libs/zhi-siyuan-picgo test` | **7 文件 / 31 用例通过**（含新增 5 例） |
| `pnpm --dir libs/zhi-siyuan-picgo build` | 通过（dist/index.js 1,950.21 kB + d.ts） |
| dist 产物检查 | `parsePostLocalImages` 出现 3 处（定义 + 两处调用） |
| 产物运行时验证（Node + 真实 dist） | 三场景全部 PASS：无图片跳过校验并短路 / 有图片配置无效抛错不上传 / 有图片配置有效正常上传 |
| `pnpm --dir libs/zhi-siyuan-picgo pack` | `/tmp/picgo-headless-packs/zhi-siyuan-picgo-3.0.3.tgz` |

### 现状

- 阶段 1-3 完成；阶段 4 进行中（Publisher 安装 tgz 端到端回归待做——需 Publisher 插件侧改动就绪后一起）
- 发版待作者确认（版本号策略建议 3.0.4 patch）

### 错误

（暂无）

---

## 与下游（Publisher）的衔接

- 下游计划：`siyuan-plugin-publisher/.planning/2026-10-13-issue-2050-no-image-picgo/`
- 顺序（契约 + 作者指示）：**本库先改先发版 → Publisher 升级依赖 + 插件侧改动**
- Publisher 侧同期改动（不依赖本库改动）：
  1. SourceMode 不再做图床预处理（按 `picbedService` 分流 + 有图片时提示）
  2. `handlePicgo` 无图片短路（`getImageBlocksByID`）
- 本库发版后 Publisher 需做：升级 `zhi-siyuan-picgo` 依赖版本 + 回归 issue #2050 场景
