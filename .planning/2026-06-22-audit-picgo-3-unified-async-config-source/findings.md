# 发现记录：picgo-3-unified-async-config-source 审计

## 用户目标
审计提案实现；关注 `fix(zhi-siyuan-picgo): add missing PicListUploader import` 之后今天的修改；审计结果保存到 `docs/audits`。

## 关键发现
待补充。

## 变更边界
- 基准提交：`f049f8da5ba78d01fcda5f47576837d4bbff0ec5` / `fix(zhi-siyuan-picgo): add missing PicListUploader import`。
- 需审计提交：
  - `3b5bf00c14ce4cf913b95d3e990fa85177674a0e` / `feat(picgo): implement Docker configuration persistence with SiYuan kernel API`
  - `8a142fe4b8cf7d8cbf202297ea1aa8168f66489f` / `feat(config)!: unify PicGo config persistence strategy`
  - `d687fd73cdb294ba8bc554e033a64d693b7b0e3a` / `feat(core): implement PicGo 3.0 unified async config source and default recognition utils`
- 未提交改动：`SettingsStorePattern.spec.ts`、`db/externalPicGo/index.ts`。

## OpenSpec 摘要
- `picgo-3-unified-async-config-source` 目标：所有 PicGo/plugin 用户配置域统一通过 async ready facade，按 owner file 路由，并在 Kernel-backed runtime 下进入 workspace。
- 核心验收：ready-before-read、per-domain routing、migration v3、sensitive mask、external/PicList 防覆盖、Lsky token final path、paste 不读旧 localStorage、OpenSpec strict validation、受影响测试/构建。
- 变更实际影响范围很大：core/store/zhi-siyuan-picgo/app/bootstrap/pnpm-lock 以及 OpenSpec 文档。

## 验证结果
- Build：store/core/zhi 三个受影响包均可构建。
- Unit tests：store 与 zhi 通过；core 当前失败（Vitest unhandled rejection），这与今日未提交测试/Facade 错误处理有关。
- OpenSpec strict：单 change 验证通过，但只证明文档格式有效，不证明实现满足规格。

## 关键代码证据
- `createUnifiedPicGoConfigFacade` 在生产调用方中没有被真正接入：grep 命中主要为导出、类型、facade 自身与注释。
- settings UI 仍通过 `useBundledPicGoSetting`、`useExternalPicGoSetting`、`useSiyuanSetting` 读写旧 DB/localStorage/ctx config。
- upload dispatch 仍由 `SiyuanPicGoUploadApi` + `ExternalPicgo` + `PicListUploader` 直接读取 `ExternalPicgoConfigDb`。
- paste/bootstrap 仍在 paste 事件回调内等待 `SiyuanPicGo.getInstance()` 后再读取 ctx config，没有在 listener 注册前预热 unified snapshot。

## 审计结论
- 不建议视为完成：生产路径未真正接入 unified facade，core 单测失败，且多个关键 OpenSpec MUST 未满足。
- 已在审计报告内给出可直接用于修复的 prompt。
- 补充：当前 `SiYuanKernelStorageAdapter` 未提交改动把 Kernel unavailable 也当成 missing/localStorage/default 处理，进一步违反 Kernel failure 必须显式的要求。
