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
    version: "1.12.1",
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
  const pasteListenerMatch = bootstrapIndex.match(
    /picturePasteEventListener[\s\S]*?tryTakeoverWithConfig[\s\S]*?SiyuanPicGo\.getInstance/
  )
  if (!pasteListenerMatch) {
    failures.push("bootstrap paste listener must call tryTakeoverWithConfig before async SiyuanPicGo.getInstance")
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

function checkV2PathContract() {
  const failures = []

  const universalPicGo = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/core/UniversalPicGo.ts"))
  for (const expected of [
    "IUniversalPicGoOptions",
    "this.usesOptionsObject ? this.getDefautBaseDir() : path.dirname(this.configPath)",
    'this.zhiNpmPath = path.join(this.baseDir, "libs")',
    "this.log.info(`this.configPath => ${this.configPath}`)",
    "this.log.info(`this.baseDir => ${this.baseDir}`)",
    "this.log.info(`this.pluginBaseDir => ${this.pluginBaseDir}`)",
  ]) {
    if (!universalPicGo.includes(expected)) {
      failures.push(`UniversalPicGo v2 path contract missing: ${expected}`)
    }
  }

  const types = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/types/index.d.ts"))
  for (const expected of ["interface IUniversalPicGoOptions", "runtimeDir?: string", "pluginBaseDir?: string"]) {
    if (!types.includes(expected)) failures.push(`IUniversalPicGoOptions contract missing: ${expected}`)
  }

  const configDb = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/db/config/index.ts"))
  if (!configDb.includes("this.key = this.ctx.configPath")) {
    failures.push("ConfigDb must keep using ctx.configPath as picgo.cfg.json storage key")
  }

  const externalDb = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/db/externalPicGo/index.ts"))
  if (!externalDb.includes('path.join(this.ctx.pluginBaseDir, "external-picgo-cfg.json")')) {
    failures.push("ExternalPicgoConfigDb must store external-picgo-cfg.json under ctx.pluginBaseDir")
  }

  const pluginLoaderDb = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/db/pluginLoder/index.ts"))
  if (!pluginLoaderDb.includes('path.join(this.ctx.pluginBaseDir, "package.json")')) {
    failures.push("PluginLoaderDb must store PicGo plugin package.json under ctx.pluginBaseDir")
  }

  const pluginLoader = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/lib/PluginLoader.ts"))
  if (!pluginLoader.includes('path.join(this.ctx.pluginBaseDir, "node_modules/")')) {
    failures.push("PluginLoader must load node_modules from ctx.pluginBaseDir")
  }
  if (!pluginLoader.includes('path.join(ctx.pluginBaseDir, "node_modules", name)')) {
    failures.push("PluginLoader dependency resolver must resolve plugins through ctx.pluginBaseDir")
  }

  const pluginHandler = read(path.join(repoRoot, "libs/Universal-PicGo-Core/src/lib/PluginHandler.ts"))
  for (const legacy of [
    'execCommand("install", fullNameList, this.ctx.baseDir',
    'execCommand("uninstall", pkgNameList, this.ctx.baseDir',
    'execCommand("update", pkgNameList, this.ctx.baseDir',
  ]) {
    if (pluginHandler.includes(legacy)) {
      failures.push(`PluginHandler npm cwd still uses runtime baseDir instead of pluginBaseDir: ${legacy}`)
    }
  }
  for (const expected of [
    'execCommand("install", fullNameList, this.ctx.pluginBaseDir',
    'execCommand("uninstall", pkgNameList, this.ctx.pluginBaseDir',
    'execCommand("update", pkgNameList, this.ctx.pluginBaseDir',
    "`${this.ctx.baseDir}/libs/zhi-infra/index.cjs`",
  ]) {
    if (!pluginHandler.includes(expected)) failures.push(`PluginHandler v2 path usage missing: ${expected}`)
  }

  const helper = read(path.join(repoRoot, "libs/zhi-siyuan-picgo/src/lib/picgoHelper.ts"))
  if (!helper.includes("this.ctx.pluginBaseDir")) {
    failures.push("PicgoHelper.getPluginList must read plugins from ctx.pluginBaseDir")
  }

  const siyuanPaths = read(path.join(repoRoot, "libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPaths.ts"))
  for (const expected of [
    '"data",',
    '"storage",',
    '"syp",',
    '"picgo",',
    '"picgo.cfg.json"',
    "getDefaultLocalPicGoDir",
    "migrateV2WorkspacePicGoConfig",
    "fs.copyFileSync(homeConfigPath, workspaceConfigPath)",
  ]) {
    if (!siyuanPaths.includes(expected)) failures.push(`siyuanPicgoPaths v2 helper missing: ${expected}`)
  }
  for (const forbidden of ["renameSync", "rmSync", "rmdirSync", "unlinkSync", "fs.rm", "fs.rename"]) {
    if (siyuanPaths.includes(forbidden)) {
      failures.push(`siyuanPicgoPaths migration must be copy-only, found destructive primitive: ${forbidden}`)
    }
  }

  const siyuanPost = read(path.join(repoRoot, "libs/zhi-siyuan-picgo/src/lib/siyuanPicgoPostApi.ts"))
  for (const forbidden of ["moveFile(", "fs.promises.rmdir(from", "fs.rmdirSync(from", "fs.rmSync(from", "fs.unlinkSync(from"]) {
    if (siyuanPost.includes(forbidden)) {
      failures.push(`SiyuanPicgoPostApi must not move/delete migration source: ${forbidden}`)
    }
  }
  if (!siyuanPost.includes("copyRuntimeFolder")) {
    failures.push("SiyuanPicgoPostApi must copy runtime libs without reintroducing old directory migration")
  }

  const workspaceDir = process.env.SIYUAN_PICGO_AUDIT_WORKSPACE_DIR
  if (workspaceDir) {
    const configDir = path.join(workspaceDir, "data", "storage", "syp", "picgo")
    if (fs.existsSync(configDir)) {
      const forbiddenEntries = [
        "node_modules",
        "package.json",
        "package-lock.json",
        "libs",
        "i18n-cli",
        "picgo-clipboard-images",
        "mac.applescript",
        "windows.ps1",
        "windows10.ps1",
        "linux.sh",
        "wsl.sh",
        "picgo.log",
        "external-picgo-cfg.json",
      ]
      for (const entry of forbiddenEntries) {
        if (fs.existsSync(path.join(configDir, entry))) {
          failures.push(`workspace PicGo config dir contains device-local/runtime entry: ${path.join(configDir, entry)}`)
        }
      }
    }
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
  "v2-paths": checkV2PathContract,
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
