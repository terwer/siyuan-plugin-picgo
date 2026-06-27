/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { ILogger, simpleLogger } from "zhi-lib-base"
import { EventEmitter } from "../utils/nodePolyfill"
import {
  IConfig,
  IHelper,
  II18nManager,
  IImgInfo,
  IPicGo,
  IPicGoPlugin,
  IPicGoPluginInterface,
  IPluginLoader,
  IStringKeyMap,
  IUniversalPicGoOptions,
} from "../types"
import { Lifecycle } from "./Lifecycle"
import uploaders from "../plugins/uploader"
import transformers from "../plugins/transformer"
import { PluginLoader } from "../lib/PluginLoader"
import { LifecyclePlugins, setCurrentPluginName } from "../lib/LifecyclePlugins"
import { PluginHandler } from "../lib/PluginHandler"
import getClipboardImage from "../utils/getClipboardImage"
import { IBuildInEvent, IBusEvent } from "../utils/enums"
import ConfigDb from "../db/config"
import { hasNodeEnv, win } from "universal-picgo-store"
import type { StorageAdapter } from "universal-picgo-store"
import { ensureFileSync, ensureFolderSync, pathExistsSync } from "../utils/nodeUtils"
import { I18nManager } from "../i18n"
import { browserPathJoin, getBrowserDirectoryPath } from "../utils/browserUtils"
import { isConfigKeyInBlackList, isInputConfigValid } from "../utils/common"
import { getByPath, setByPath, unsetByPath } from "../utils/pathObject"
import { picgoEventBus } from "../utils/picgoEventBus"
import { PicGoRequestWrapper } from "../lib/PicGoRequest"
import { isThirdPartyPluginRuntimeAvailable } from "../utils/pluginRuntime"
import type { ReadyUnifiedPicGoConfigFacade } from "../config"

class UniversalPicGo extends EventEmitter implements IPicGo {
  private _config!: IConfig
  private lifecycle!: Lifecycle
  private db!: ConfigDb
  private _pluginLoader!: PluginLoader
  /** Storage adapter factory from options. Passed to DB constructors. */
  public readonly storageAdapterFactory?: (dbPath: string) => StorageAdapter
  configPath: string
  zhiNpmPath: string
  baseDir!: string
  pluginBaseDir!: string
  helper!: IHelper
  log: ILogger
  output: IImgInfo[]
  input: any[]
  pluginHandler: PluginHandler
  requestWrapper: PicGoRequestWrapper
  i18n!: II18nManager
  VERSION: string = process.env.PICGO_VERSION ?? "unknown"
  private readonly isDev: boolean
  private readonly usesOptionsObject: boolean
  private readyPromise: Promise<void>
  private unifiedConfigFacade?: ReadyUnifiedPicGoConfigFacade

  get pluginLoader(): IPluginLoader { return this._pluginLoader }

  get storageMode(): "sync" | "async" {
    return this.db?.isAsync ? "async" : "sync"
  }

  public getLogger(name?: string): ILogger {
    return simpleLogger(name ?? "universal-picgo", "universal-picgo", this.isDev)
  }

  get request(): PicGoRequestWrapper["PicGoRequest"] {
    return this.requestWrapper.PicGoRequest.bind(this.requestWrapper)
  }

  constructor(options?: IUniversalPicGoOptions)
  constructor(configPath?: string, pluginBaseDir?: string, zhiNpmPath?: string, isDev?: boolean)
  constructor(
    configPathOrOptions?: string | IUniversalPicGoOptions,
    pluginBaseDir?: string,
    zhiNpmPath?: string,
    isDev?: boolean
  ) {
    super()
    this.usesOptionsObject = typeof configPathOrOptions === "object" && configPathOrOptions !== null
    const options = this.normalizeOptions(configPathOrOptions, pluginBaseDir, zhiNpmPath, isDev)
    this.isDev = options.isDev ?? false
    this.log = this.getLogger()
    this.configPath = options.configPath ?? ""
    this.baseDir = options.baseDir ?? options.runtimeDir ?? ""
    this.pluginBaseDir = options.pluginBaseDir ?? ""
    this.zhiNpmPath = options.zhiNpmPath ?? ""
    this.storageAdapterFactory = options.storageAdapterFactory
    this.output = []
    this.input = []
    this.helper = {
      transformer: new LifecyclePlugins("transformer"),
      uploader: new LifecyclePlugins("uploader"),
      beforeTransformPlugins: new LifecyclePlugins("beforeTransformPlugins"),
      beforeUploadPlugins: new LifecyclePlugins("beforeUploadPlugins"),
      afterUploadPlugins: new LifecyclePlugins("afterUploadPlugins"),
    }
    this.initConfigPath()
    this.initZhiNpmPath()
    this.initConfig()
    this.pluginHandler = new PluginHandler(this)
    this.requestWrapper = new PicGoRequestWrapper(this)

    // Plugin loader / i18n / lifecycle init synchronously (uploader list needed immediately)
    try {
      this.i18n = new I18nManager(this)
      this._pluginLoader = new PluginLoader(this)
      setCurrentPluginName("picgo")
      uploaders(this).register(this)
      transformers(this).register(this)
      setCurrentPluginName("")
      if (isThirdPartyPluginRuntimeAvailable()) {
        this._pluginLoader.load()
      } else {
        this.log.info("third-party PicGo plugins are ignored outside Electron runtime")
      }
      this.lifecycle = new Lifecycle(this)
    } catch (e: any) {
      this.emit(IBuildInEvent.UPLOAD_PROGRESS, -1)
      this.log.error(e)
      throw e
    }

    // Defer async storage readiness check (kernel API adapter only)
    this.readyPromise = this.initAsync()

    this.log.info("UniversalPicGo inited")
  }

  /** Async init: wait for config DB from remote storage, then refresh config. */
  private async initAsync(): Promise<void> {
    await this.db.ensureReady()
    this._config = this.db.read(true) as IConfig
  }

  /** Wait for config and plugins to be ready. */
  async init(): Promise<void> { await this.readyPromise }

  attachConfigFacade(facade: ReadyUnifiedPicGoConfigFacade): void {
    this.unifiedConfigFacade = facade
    this._config = cloneSerializable(facade.getSnapshot().picgo) as IConfig
  }

  getConfigFacade(): ReadyUnifiedPicGoConfigFacade | undefined {
    return this.unifiedConfigFacade
  }

  use(plugin: IPicGoPlugin, name?: string): IPicGoPluginInterface {
    if (name) {
      this.pluginLoader.registerPlugin(name, plugin)
      return this.pluginLoader.getPlugin(name)!
    }
    const pluginInstance = plugin(this)
    return pluginInstance
  }

  getConfig<T>(name?: string, defaultValue?: any): T {
    if (!name) return this._config as unknown as T
    return getByPath(this._config, name, defaultValue)
  }

  reloadConfig(): IConfig {
    if (this.unifiedConfigFacade) {
      this._config = cloneSerializable(this.unifiedConfigFacade.getSnapshot().picgo) as IConfig
      return this._config
    }
    this._config = this.db.read(true) as IConfig
    return this._config
  }

  async reloadConfigAsync(): Promise<IConfig> {
    if (this.unifiedConfigFacade) {
      const snapshot = await this.unifiedConfigFacade.reload()
      this._config = cloneSerializable(snapshot.picgo) as IConfig
      return this._config
    }
    if (this.storageMode === "async") {
      await (this.db as any).refreshAsync?.()
    }
    return this.reloadConfig()
  }

  async flushConfig(): Promise<void> {
    if (this.unifiedConfigFacade) {
      await this.unifiedConfigFacade.flush()
      return
    }
    await this.db.flush?.()
  }

  saveConfig(config: IStringKeyMap<any>): void {
    if (!isInputConfigValid(config)) {
      this.log.warn("the format of config is invalid, please provide object")
      return
    }
    this.setConfig(config)
    if (this.unifiedConfigFacade) {
      this.unifiedConfigFacade.updatePicGoConfig((draft) => {
        Object.keys(config).forEach((name: string) => {
          setByPath(draft, name, config[name])
        })
      }).catch((e) => this.log.error(e))
      return
    }
    this.db.saveConfig(config)
  }

  removeConfig(key: string, propName: string): void {
    if (!key || !propName) return
    if (isConfigKeyInBlackList(key)) {
      this.log.warn(`the config.${key} can't be removed`)
      return
    }
    const removed = unsetByPath(this.getConfig(key), propName)
    if (!removed) return
    if (this.unifiedConfigFacade) {
      this.unifiedConfigFacade.updatePicGoConfig((draft) => {
        const target = getByPath(draft, key)
        if (target) unsetByPath(target, propName)
      }).catch((e) => this.log.error(e))
      return
    }
    this.db.unset(key, propName)
  }

  setConfig(config: IStringKeyMap<any>): void {
    if (!isInputConfigValid(config)) {
      this.log.warn("the format of config is invalid, please provide object")
      return
    }
    Object.keys(config).forEach((name: string) => {
      if (isConfigKeyInBlackList(name)) {
        this.log.warn(`the config.${name} can't be modified`)
        delete config[name]
      }
      setByPath(this._config, name, config[name])
      picgoEventBus.emit(IBusEvent.CONFIG_CHANGE, { configName: name, value: config[name] })
    })
  }

  unsetConfig(key: string, propName: string): void {
    if (!key || !propName) return
    if (isConfigKeyInBlackList(key)) {
      this.log.warn(`the config.${key} can't be unset`)
      return
    }
    unsetByPath(this.getConfig(key), propName)
  }

  async upload(input?: any[]): Promise<IImgInfo[] | Error> {
    if (this.configPath === "") {
      this.log.error("The configuration file only supports JSON format.")
      return []
    }
    if (input === undefined || input.length === 0) {
      try {
        const { imgPath, shouldKeepAfterUploading } = await getClipboardImage(this)
        if (imgPath === "no image") throw new Error("image not found in clipboard")
        this.once(IBuildInEvent.FAILED, () => {
          if (hasNodeEnv) {
            const fs = win.fs
            if (!shouldKeepAfterUploading) fs.promises.rm(imgPath).catch((e: any) => this.log.error(e))
          }
        })
        this.once("finished", () => {
          if (hasNodeEnv) {
            const fs = win.fs
            if (!shouldKeepAfterUploading) fs.promises.rm(imgPath).catch((e: any) => this.log.error(e))
          }
        })
        const { output } = await this.lifecycle.start([imgPath])
        return output
      } catch (e) {
        this.emit(IBuildInEvent.FAILED, e)
        throw e
      }
    } else {
      const { output } = await this.lifecycle.start(input)
      return output
    }
  }

  private normalizeOptions(
    configPathOrOptions?: string | IUniversalPicGoOptions,
    pluginBaseDir?: string, zhiNpmPath?: string, isDev?: boolean
  ): IUniversalPicGoOptions {
    if (typeof configPathOrOptions === "object" && configPathOrOptions !== null) return configPathOrOptions
    return { configPath: configPathOrOptions ?? "", pluginBaseDir: pluginBaseDir ?? "", zhiNpmPath: zhiNpmPath ?? "", isDev: isDev ?? false } as IUniversalPicGoOptions
  }

  private getDefautBaseDir(): string {
    if (hasNodeEnv) {
      const os = win.require("os"); const fs = win.fs; const path = win.require("path")
      const dir = path.join(os.homedir(), ".universal-picgo"); ensureFolderSync(fs, dir); return dir
    }
    return "universal-picgo"
  }

  private initConfigPath(): void {
    if (this.configPath === "") {
      if (this.baseDir === "") this.baseDir = this.getDefautBaseDir()
      else if (hasNodeEnv) ensureFolderSync(win.fs, this.baseDir)
      if (hasNodeEnv) { const path = win.require("path"); this.configPath = path.join(this.baseDir, "picgo.cfg.json") }
      else this.configPath = browserPathJoin(this.baseDir, "picgo.cfg.json")
    } else {
      if (hasNodeEnv) {
        const fs = win.fs; const path = win.require("path")
        if (path.extname(this.configPath).toUpperCase() !== ".JSON") { this.configPath = ""; throw Error("The configuration file only supports JSON format.") }
        if (this.baseDir === "") this.baseDir = this.usesOptionsObject ? this.getDefautBaseDir() : path.dirname(this.configPath)
        ensureFolderSync(fs, this.baseDir)
        if (!pathExistsSync(fs, path, this.configPath)) ensureFileSync(fs, path, `${this.configPath}`)
      } else {
        if (this.baseDir === "") this.baseDir = this.usesOptionsObject ? this.getDefautBaseDir() : getBrowserDirectoryPath(this.configPath)
      }
    }
    if (this.pluginBaseDir === "") this.pluginBaseDir = this.getDefautBaseDir()
  }

  private initZhiNpmPath(): void {
    if (hasNodeEnv) {
      const fs = win.fs; const path = win.require("path")
      if (this.zhiNpmPath === "") this.zhiNpmPath = path.join(this.baseDir, "libs")
      ensureFolderSync(fs, path.join(this.baseDir, "libs"))
    } else this.log.warn("zhi is not supported in browser")
  }

  private initConfig(): void {
    this.db = new ConfigDb(this)
    this._config = this.db.read(true) as IConfig
  }
}

function cloneSerializable<T>(value: T): T {
  if (typeof value === "undefined") return value
  return JSON.parse(JSON.stringify(value)) as T
}

export { UniversalPicGo }
