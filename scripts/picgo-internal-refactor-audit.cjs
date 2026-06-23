const fs = require("fs")
const path = require("path")

const repoRoot = path.resolve(__dirname, "..")

const sourceExtensions = new Set([".ts", ".tsx", ".vue", ".js", ".cjs", ".mjs"])
const textExtensions = new Set([".js", ".cjs", ".mjs", ".html", ".css", ".map"])
const ignoredDirs = new Set(["node_modules", ".git", ".turbo", "archive", "coverage"])
const approvedBundleExceptions = [
  {
    name: "eruda devtools runtime",
    owner: "picgo-plugin-app dev HTML injection",
    reason: "third-party debug console copied under public libs for dev-mode tooling; production HTML only injects it when isDev is true",
    containment: "artifacts/siyuan-plugin-picgo/dist/libs/eruda/",
    matches(relativeFile, patternName) {
      return (
        relativeFile.startsWith("artifacts/siyuan-plugin-picgo/dist/libs/eruda/") &&
        ["direct eval", "new Function", "Function(return this)", "eval(require)"].includes(patternName)
      )
    },
  },
  {
    name: "zhi-infra host npm helper",
    owner: "UniversalPicGo PluginHandler host adapter",
    reason: "CommonJS helper executed through SiYuan/Electron host win.zhi.npm for npm plugin management, not browser-facing app/bootstrap code",
    containment: "artifacts/siyuan-plugin-picgo/dist/libs/zhi-infra/",
    matches(relativeFile, patternName) {
      return (
        relativeFile.startsWith("artifacts/siyuan-plugin-picgo/dist/libs/zhi-infra/") &&
        ["direct eval", "new Function", "Function(return this)", "dynamic require stream"].includes(patternName)
      )
    },
  },
]

function walk(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) continue
      walk(full, predicate, out)
    } else if (predicate(full)) {
      out.push(full)
    }
  }
  return out
}

function rel(file) {
  return path.relative(repoRoot, file).split(path.sep).join("/")
}

function read(file) {
  return fs.readFileSync(file, "utf8")
}

function sectionBetween(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker)
  if (start < 0) return ""
  const end = content.indexOf(endMarker, start + startMarker.length)
  return end < 0 ? content.slice(start) : content.slice(start, end)
}

function fail(messages) {
  for (const msg of messages) console.error(`- ${msg}`)
  process.exitCode = 1
}

function findApprovedBundleException(relativeFile, patternName) {
  return approvedBundleExceptions.find((exception) => exception.matches(relativeFile, patternName))
}

function checkContract() {
  const failures = []
  const plugin = JSON.parse(read(path.join(repoRoot, "plugin.json")))
  const expectedPlugin = {
    name: "siyuan-plugin-picgo",
    minAppVersion: "2.9.0",
  }
  for (const [key, value] of Object.entries(expectedPlugin)) {
    if (plugin[key] !== value) failures.push(`plugin.json ${key} changed: expected ${value}, got ${plugin[key]}`)
  }

  const packageExports = {
    "libs/Universal-PicGo-Core/src/index.ts": [
      "UniversalPicGo",
      "ExternalPicgo",
      "picgoEventBus",
      "ConfigDb",
      "PluginLoaderDb",
      "ExternalPicgoConfigDb",
      "PicgoTypeEnum",
      "IBusEvent",
      "isFileOrBlob",
      "calculateMD5",
      "isSiyuanProxyAvailable",
      "win",
      "currentWin",
      "parentWin",
      "hasNodeEnv",
    ],
    "libs/Universal-PicGo-Store/src/index.ts": ["JSONStore", "win", "currentWin", "parentWin", "hasNodeEnv"],
    "libs/zhi-siyuan-picgo/src/index.ts": [
      "ConfigDb",
      "ExternalPicgoConfigDb",
      "ImageItem",
      "ImageParser",
      "ParsedImage",
      "PicgoHelper",
      "PicgoHelperEvents",
      "PicgoTypeEnum",
      "PluginLoaderDb",
      "SIYUAN_PICGO_FILE_MAP_KEY",
      "SiyuanPicGo",
      "SiyuanPicgoPostApi",
      "calculateMD5",
      "copyToClipboardInBrowser",
      "generateUniqueName",
      "handleConfigWithFunction",
      "handleStreamlinePluginName",
      "isSiyuanProxyAvailable",
      "replaceImageLink",
      "retrieveImageFromClipboardAsBlob",
      "win",
    ],
  }

  for (const [file, symbols] of Object.entries(packageExports)) {
    const content = read(path.join(repoRoot, file))
    for (const symbol of symbols) {
      const symbolPattern = new RegExp(`\\b${symbol}\\b`)
      if (!symbolPattern.test(content)) failures.push(`${file} no longer exposes baseline symbol ${symbol}`)
    }
  }

  const constants = read(path.join(repoRoot, "libs/zhi-siyuan-picgo/src/lib/constants.ts"))
  if (!constants.includes('SIYUAN_PICGO_FILE_MAP_KEY = "custom-picgo-file-map-key"')) {
    failures.push("SIYUAN_PICGO_FILE_MAP_KEY contract changed")
  }

  const settings = read(path.join(repoRoot, "packages/picgo-plugin-app/src/components/setting/PicgoSetting.vue"))
  for (const expected of [
    "siyuan.waitTimeout = bundledPicGoSettingForm.value.siyuan.waitTimeout ?? 2",
    "siyuan.retryTimes = bundledPicGoSettingForm.value.siyuan.retryTimes ?? 5",
    "siyuan.autoUpload = bundledPicGoSettingForm.value.siyuan.autoUpload ?? true",
    "siyuan.replaceLink = bundledPicGoSettingForm.value.siyuan.replaceLink ?? true",
    "siyuan.txtImageSwitch = bundledPicGoSettingForm.value.siyuan.txtImageSwitch ?? false",
  ]) {
    if (!settings.includes(expected)) failures.push(`setting default contract missing: ${expected}`)
  }
  for (const legacyUiBinding of [
    'v-model="bundledPicGoSettingForm.siyuan.waitTimeout"',
    'v-model="bundledPicGoSettingForm.siyuan.retryTimes"',
  ]) {
    if (settings.includes(legacyUiBinding)) {
      failures.push(`legacy paste polling setting is still exposed in UI: ${legacyUiBinding}`)
    }
  }

  const configDb = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/db/config/index.ts"))
  for (const expected of [
    "autoUpload: true",
    "replaceLink: true",
    "txtImageSwitch: false",
    'this.safeSet("siyuan.autoUpload", this.initialValue.siyuan.autoUpload)',
    'this.safeSet("siyuan.replaceLink", this.initialValue.siyuan.replaceLink)',
  ]) {
    if (!configDb.includes(expected)) failures.push(`ConfigDb first-run Siyuan default missing: ${expected}`)
  }

  return failures
}

function checkBoundaries() {
  const failures = []
  const files = walk(repoRoot, (file) => sourceExtensions.has(path.extname(file)))

  for (const file of files) {
    const relative = rel(file)
    if (relative.startsWith("openspec/") || relative.startsWith(".planning/")) continue
    const content = read(file)
    if (/from\s+["']zhi-siyuan-picgo\/src/.test(content) || /import\(["']zhi-siyuan-picgo\/src/.test(content)) {
      failures.push(`${relative} imports zhi-siyuan-picgo/src directly`)
    }
  }

  const bootstrapIndex = read(path.join(repoRoot, "packages/picgo-plugin-bootstrap/src/index.ts"))
  for (const forbidden of ["uploadAsset(", "JsTimer", "handleAfterUpload", "doUpdatePictureMetadata"]) {
    if (bootstrapIndex.includes(forbidden)) failures.push(`bootstrap paste path still contains ${forbidden}`)
  }
  for (const expected of [
    "await this.prewarmPicGoRuntimeForPaste()",
    "tryTakeoverFromSnapshot(e, pasteTakeoverSnapshot)",
    "PicGo paste snapshot unavailable; skip takeover",
  ]) {
    if (!bootstrapIndex.includes(expected)) failures.push(`bootstrap v3 paste prewarm/snapshot contract missing: ${expected}`)
  }

  const pasteDir = path.join(repoRoot, "packages/picgo-plugin-bootstrap/src/paste")
  const pasteFiles = walk(pasteDir, (file) => sourceExtensions.has(path.extname(file)))
  const pasteText = pasteFiles.map(read).join("\n")
  for (const required of ["PasteEventAdapter", "PasteUploadTransaction", "DocumentMutationPort", "MetadataRepository"]) {
    if (!pasteText.includes(required)) failures.push(`paste transaction boundary missing ${required}`)
  }
  for (const forbidden of ["uploadAsset(", "document.querySelector", "JsTimer"]) {
    if (pasteText.includes(forbidden)) failures.push(`paste transaction uses forbidden legacy primitive ${forbidden}`)
  }

  const zhiPost = read(path.join(repoRoot, "libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts"))
  if (!zhiPost.includes("if (!ignoreReplaceLink)")) {
    failures.push("SiyuanPicgoPostApi no longer gates metadata/link replacement by ignoreReplaceLink")
  }

  return failures
}

function isProductionSource(relative) {
  if (!relative.startsWith("libs/") && !relative.startsWith("packages/")) return false
  if (relative.includes("/dist/") || relative.includes("/node_modules/") || relative.includes("/public/libs/")) return false
  if (/\.(spec|test)\.(ts|tsx|js|mjs|cjs)$/.test(relative)) return false
  return sourceExtensions.has(path.extname(relative))
}

function checkV3UnifiedConfigGates() {
  const failures = []

  const rootPackage = JSON.parse(read(path.join(repoRoot, "package.json")))
  const plugin = JSON.parse(read(path.join(repoRoot, "plugin.json")))
  if (plugin.version !== rootPackage.version) {
    failures.push(`plugin.json version must stay aligned with root package before release auto-bump: plugin=${plugin.version}, root=${rootPackage.version}`)
  }
  if (!/^\d+\.\d+\.\d+/.test(plugin.version)) {
    failures.push(`plugin.json version is not semver-like: ${plugin.version}`)
  }

  const coreIndex = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/index.ts"))
  for (const expected of [
    "createUnifiedPicGoConfigFacade",
    "type ConfigDomain",
    "type ReadyUnifiedPicGoConfigFacade",
    "type UnifiedConfigMigrationState",
    "ConfigReadError",
    "ConfigFlushError",
    "ConfigNotReadyError",
    "UNIFIED_CONFIG_MIGRATION_VERSION",
  ]) {
    if (!coreIndex.includes(expected)) failures.push(`unified config public export missing: ${expected}`)
  }

  const unifiedTypes = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/config/UnifiedConfigTypes.ts"))
  for (const expected of [
    'picgoMain: "picgo.cfg.json"',
    'externalPicList: "external-picgo-cfg.json"',
    'siyuanConnection: "siyuan-cfg"',
    'export const MASK_VALUE = "******"',
    'version: "v3.0-unified-async-config-source"',
    'retryMigration(domains?: ConfigDomain[])',
  ]) {
    if (!unifiedTypes.includes(expected)) failures.push(`v3 unified config type contract missing: ${expected}`)
  }

  const unifiedFacade = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts"))
  for (const expected of [
    "UNIFIED_CONFIG_MIGRATION_VERSION",
    "retryV3MigrationInternal(state, options, logger, domains)",
    "retryMigrationService(migrationOptions, domains)",
    "createFacadeInstanceKey(options, state.ownerFiles)",
    "owners: ownerIdentity",
    "workspaceDir: options.paths?.workspaceDir",
    "externalConfigPath: options.paths?.externalConfigPath",
    "siyuanConnectionConfigPath: options.paths?.siyuanConnectionConfigPath",
    "resolveNodeOwnerPath(ownerFile, logicalKey, options)",
  ]) {
    if (!unifiedFacade.includes(expected)) failures.push(`UnifiedConfigFacade v3 lifecycle/instanceKey contract missing: ${expected}`)
  }
  const retryMigrationBody = sectionBetween(unifiedFacade, "async retryMigration(domains?: ConfigDomain[])", "maskSnapshot(snapshot")
  if (!retryMigrationBody.includes("retryV3MigrationInternal(state, options, logger, domains)")) {
    failures.push("UnifiedConfigFacade retryMigration(domains?) must call domain-scoped retryV3MigrationInternal")
  }
  if (retryMigrationBody.includes("runV3MigrationInternal")) {
    failures.push("UnifiedConfigFacade retryMigration(domains?) must not call full runV3MigrationInternal")
  }
  const instanceKeyBody = sectionBetween(unifiedFacade, "function createFacadeInstanceKey", "// ── Ready Facade Construction")
  for (const expected of ["storage", "workspace", "owners", "logicalKey", "storageKind", "domains"]) {
    if (!instanceKeyBody.includes(expected)) failures.push(`facade instanceKey missing non-sensitive identity field: ${expected}`)
  }
  for (const forbidden of ["password", "cookie", "picListApiKey"]) {
    if (instanceKeyBody.includes(forbidden)) failures.push(`facade instanceKey must not include sensitive field name/value: ${forbidden}`)
  }

  const zhiPaths = read(path.join(repoRoot, "libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.ts"))
  for (const expected of [
    "SIYUAN_PICGO_KERNEL_CONFIG_PATH",
    "SIYUAN_PICGO_KERNEL_EXTERNAL_PATH",
    "SIYUAN_PICGO_KERNEL_SIYUAN_CONNECTION_PATH",
    "SIYUAN_PICGO_EXTERNAL_CONFIG_KEY",
    "SIYUAN_PICGO_SIYUAN_CONNECTION_KEY",
    "externalConfigPath",
    "siyuanConnectionConfigPath",
    "workspaceDir",
    "getWorkspacePicGoExternalConfigPath",
    "getWorkspaceSiyuanConnectionConfigPath",
    "resolveSiyuanPicGoOwnerFilePath",
    "hasV3MigrationMarker",
    "PicGo v3 migration marker exists in workspace config",
  ]) {
    if (!zhiPaths.includes(expected)) failures.push(`zhi owner path mapping missing: ${expected}`)
  }

  const zhiRuntime = read(path.join(repoRoot, "libs/zhi-siyuan-picgo/src/lib/siyuanPicgo.ts"))
  for (const expected of [
    "SIYUAN_PICGO_KERNEL_EXTERNAL_PATH",
    "SIYUAN_PICGO_KERNEL_SIYUAN_CONNECTION_PATH",
    "createNodeWorkspaceFactory(paths)",
    "resolveSiyuanPicGoOwnerFilePath(dbPath, paths)",
    "paths.externalConfigPath",
    "paths.siyuanConnectionConfigPath",
    "new SiYuanKernelStorageAdapter",
  ]) {
    if (!zhiRuntime.includes(expected)) failures.push(`Kernel owner route missing: ${expected}`)
  }
  if (!zhiRuntime.includes("formatMigrationError")) {
    failures.push("SiyuanPicGo lifecycle must surface v3 per-domain migration errors")
  }

  const zhiPost = read(path.join(repoRoot, "libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts"))
  for (const expected of [
    "getSnapshot().migration",
    "facade.getMigrationState()",
    "facade.retryMigration(domains)",
    "await facade.flush()",
    "await facade.reload()",
  ]) {
    if (!zhiPost.includes(expected)) failures.push(`SiyuanPicgoPostApi v3 migration bridge missing: ${expected}`)
  }
  for (const forbidden of [
    "getSiyuanPicGoMigrationSnapshot",
    "this.ensureConfigInitialized(true)",
  ]) {
    if (zhiPost.includes(forbidden)) failures.push(`SiyuanPicgoPostApi still uses v2 migration UI/retry path: ${forbidden}`)
  }

  const settings = read(path.join(repoRoot, "packages/picgo-plugin-app/src/components/setting/PicgoSetting.vue"))
  for (const expected of [
    "failedMigrationDomains",
    "migrationState.value = await siyuanPicgo.retryConfigMigration()",
    "migrationState.value.domains",
  ]) {
    if (!settings.includes(expected)) failures.push(`settings UI v3 migration state/retry evidence missing: ${expected}`)
  }

  const defaultRecognition = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/config/DefaultRecognition.ts"))
  for (const expected of [
    "isPicgoSettingsDomainGeneratedDefault",
    "isSiyuanBehaviorDomainGeneratedDefault",
    "isPluginValuesDomainGeneratedDefault",
    "isUploaderConfigDomainGeneratedDefault",
    "picgoMigration",
  ]) {
    if (!defaultRecognition.includes(expected)) failures.push(`per-domain default recognition missing: ${expected}`)
  }

  const migrationService = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/config/V3MigrationService.ts"))
  for (const expected of [
    "extractPicgoDomainSlice",
    "mergePicgoDomainSlice",
    "SIYUAN_BEHAVIOR_KEYS",
    "PICGO_MAIN_PICBED_KEYS",
  ]) {
    if (!migrationService.includes(expected)) failures.push(`per-domain migration apply missing: ${expected}`)
  }

  const picListUploader = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/core/PicListUploader.ts"))
  if (!picListUploader.includes("requestUrl.replace(apiKey, MASK_VALUE)")) {
    failures.push("PicListUploader must mask API key logs with MASK_VALUE")
  }
  if (picListUploader.includes('requestUrl.replace(apiKey, "***")')) {
    failures.push("PicListUploader still uses legacy *** mask")
  }

  const files = walk(repoRoot, (file) => isProductionSource(rel(file)))
  for (const file of files) {
    const relative = rel(file)
    const content = read(file)

    if (content.includes('window.localStorage.getItem("universal-picgo/picgo.cfg.json")')) {
      failures.push(`${relative} contains production legacy main localStorage read`)
    }

    if (content.includes("siyuan_picgo_plugin_lsky_token") && relative !== "libs/Universal-PicGo-Core/src/config/V3MigrationService.ts") {
      failures.push(`${relative} contains direct legacy Lsky token access outside migration`)
    }

    if (/new\s+ExternalPicgoConfigDb\s*\(/.test(content) && !relative.includes("/db/externalPicGo/")) {
      failures.push(`${relative} directly constructs ExternalPicgoConfigDb in production route decision`)
    }

    if (content.includes("/api/file/")) {
      failures.push(`${relative} contains direct Kernel /api/file/ owner access; use SiyuanKernelApi wrapper`)
    }
  }

  // PC-only runtime artifacts still remain local/pluginBaseDir, while user
  // configuration owner files are handled by the unified facade gates above.
  const pluginLoaderDb = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/db/pluginLoder/index.ts"))
  if (!pluginLoaderDb.includes('path.join(this.ctx.pluginBaseDir, "package.json")')) {
    failures.push("PluginLoaderDb must keep PicGo plugin package.json under pluginBaseDir")
  }
  const pluginLoader = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/lib/PluginLoader.ts"))
  if (!pluginLoader.includes('path.join(this.ctx.pluginBaseDir, "node_modules/")')) {
    failures.push("PluginLoader must keep node_modules under pluginBaseDir")
  }
  const pluginHandler = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/lib/PluginHandler.ts"))
  for (const expected of [
    'execCommand("install", fullNameList, this.ctx.pluginBaseDir',
    'execCommand("uninstall", pkgNameList, this.ctx.pluginBaseDir',
    'execCommand("update", pkgNameList, this.ctx.pluginBaseDir',
    "`${this.ctx.baseDir}/libs/zhi-infra/index.cjs`",
  ]) {
    if (!pluginHandler.includes(expected)) failures.push(`PluginHandler runtime artifact boundary missing: ${expected}`)
  }

  return failures
}

function checkBundleArtifacts() {
  const failures = []
  const artifactDirs = [
    "artifacts",
    "packages/picgo-plugin-bootstrap/dist",
    "packages/picgo-plugin-app/dist",
    "libs/Universal-PicGo-Core/dist",
    "libs/Universal-PicGo-Store/dist",
    "libs/zhi-siyuan-picgo/dist",
  ].map((p) => path.join(repoRoot, p))

  const files = artifactDirs.flatMap((dir) => walk(dir, (file) => textExtensions.has(path.extname(file))))
  if (files.length === 0) {
    console.warn("[audit] no bundle artifacts found; build before relying on bundle audit")
    return failures
  }

  const patterns = [
    { name: "direct eval", pattern: /\beval\s*\(/ },
    { name: "new Function", pattern: /new\s+Function\s*\(/ },
    { name: "Function(return this)", pattern: /\bFunction\s*\(\s*["']return this["']\s*\)/ },
    { name: "eval(require)", pattern: /eval\s*\(\s*["']require["']\s*\)/ },
    { name: "vm-browserify", pattern: /vm-browserify/ },
    { name: "dynamic require stream", pattern: /require\s*\(\s*["']stream["']\s*\)/ },
  ]
  const usedExceptions = new Map()

  for (const file of files) {
    const content = read(file)
    const relativeFile = rel(file)
    for (const { name, pattern } of patterns) {
      if (!pattern.test(content)) continue
      const exception = findApprovedBundleException(relativeFile, name)
      if (exception) {
        usedExceptions.set(exception.name, exception)
        continue
      }
      failures.push(`${relativeFile} contains forbidden bundle pattern: ${name}`)
    }
  }

  for (const exception of usedExceptions.values()) {
    console.warn(
      `[audit] approved bundle exception: ${exception.name}; owner=${exception.owner}; containment=${exception.containment}; reason=${exception.reason}`
    )
  }

  return failures
}

const checks = {
  contract: checkContract,
  boundaries: checkBoundaries,
  "v3-unified-config": checkV3UnifiedConfigGates,
  bundle: checkBundleArtifacts,
}

const selected = process.argv.slice(2)
const names = selected.length > 0 ? selected : Object.keys(checks)
let allFailures = []
for (const name of names) {
  if (!checks[name]) {
    allFailures.push(`unknown audit check: ${name}`)
    continue
  }
  const failures = checks[name]()
  if (failures.length === 0) {
    console.log(`[audit] ${name}: ok`)
  } else {
    console.error(`[audit] ${name}: failed`)
    allFailures = allFailures.concat(failures)
  }
}

if (allFailures.length > 0) {
  fail(allFailures)
}
