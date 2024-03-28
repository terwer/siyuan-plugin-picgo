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
} from "../types"
import { Lifecycle } from "./Lifecycle"
import uploaders from "../plugins/uploader"
import transformers from "../plugins/transformer"
import { PluginLoader } from "../lib/PluginLoader"
import { LifecyclePlugins, setCurrentPluginName } from "../lib/LifecyclePlugins"
import { PluginHandler } from "../lib/PluginHandler"
import _ from "lodash-es"
import getClipboardImage from "../utils/getClipboardImage"
import { IBuildInEvent, IBusEvent } from "../utils/enums"
import ConfigDb from "../db/config"
import { hasNodeEnv, win } from "universal-picgo-store"
import { ensureFileSync, ensureFolderSync, pathExistsSync } from "../utils/nodeUtils"
import { I18nManager } from "../i18n"
import { browserPathJoin, getBrowserDirectoryPath } from "../utils/browserUtils"
import { isConfigKeyInBlackList, isInputConfigValid } from "../utils/common"
import { picgoEventBus } from "../utils/picgoEventBus"
import { PicGoRequestWrapper } from "../lib/PicGoRequest"

/*
 * 通用 PicGO 对象定义
 *
 * @version 1.6.0
 * @since 1.4.5
 */
class UniversalPicGo extends EventEmitter implements IPicGo {
  private _config!: IConfig
  private lifecycle!: Lifecycle
  private db!: ConfigDb
  private _pluginLoader!: PluginLoader
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

  get pluginLoader(): IPluginLoader {
    return this._pluginLoader
  }

  public getLogger(name?: string): ILogger {
    return simpleLogger(name ?? "universal-picgo", "universal-picgo", this.isDev)
  }

  get request(): PicGoRequestWrapper["PicGoRequest"] {
    return this.requestWrapper.PicGoRequest.bind(this.requestWrapper)
  }

  constructor(configPath?: string, pluginBaseDir?: string, zhiNpmPath?: string, isDev?: boolean) {
    super()
    this.isDev = isDev ?? false
    this.log = this.getLogger()
    this.configPath = configPath ?? ""
    this.pluginBaseDir = pluginBaseDir ?? ""
    this.zhiNpmPath = zhiNpmPath ?? ""
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
    this.init()

    this.log.info("UniversalPicGo inited")
  }

  /**
   * easily mannually load a plugin
   * if provide plugin name, will register plugin by name
   * or just instantiate a plugin
   */
  use(plugin: IPicGoPlugin, name?: string): IPicGoPluginInterface {
    if (name) {
      this.pluginLoader.registerPlugin(name, plugin)
      return this.pluginLoader.getPlugin(name)!
    } else {
      const pluginInstance = plugin(this)
      return pluginInstance
    }
  }

  getConfig<T>(name?: string, defaultValue?: any): T {
    if (!name) {
      return this._config as unknown as T
    } else {
      return _.get(this._config, name, defaultValue)
    }
  }

  saveConfig(config: IStringKeyMap<any>): void {
    if (!isInputConfigValid(config)) {
      this.log.warn("the format of config is invalid, please provide object")
      return
    }
    this.setConfig(config)
    this.db.saveConfig(config)
  }

  removeConfig(key: string, propName: string): void {
    if (!key || !propName) return
    if (isConfigKeyInBlackList(key)) {
      this.log.warn(`the config.${key} can't be removed`)
      return
    }
    this.unsetConfig(key, propName)
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
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete config[name]
      }
      _.set(this._config, name, config[name])
      picgoEventBus.emit(IBusEvent.CONFIG_CHANGE, {
        configName: name,
        value: config[name],
      })
    })
  }

  unsetConfig(key: string, propName: string): void {
    if (!key || !propName) return
    if (isConfigKeyInBlackList(key)) {
      this.log.warn(`the config.${key} can't be unset`)
      return
    }
    _.unset(this.getConfig(key), propName)
  }

  async upload(input?: any[]): Promise<IImgInfo[] | Error> {
    if (this.configPath === "") {
      this.log.error("The configuration file only supports JSON format.")
      return []
    }
    // upload from clipboard
    if (input === undefined || input.length === 0) {
      try {
        const { imgPath, shouldKeepAfterUploading } = await getClipboardImage(this)
        if (imgPath === "no image") {
          throw new Error("image not found in clipboard")
        } else {
          this.once(IBuildInEvent.FAILED, () => {
            if (hasNodeEnv) {
              const fs = win.fs
              if (!shouldKeepAfterUploading) {
                // 删除 picgo 生成的图片文件，例如 `~/.picgo/20200621205720.png`
                fs.promises.rm(imgPath).catch((e: any) => {
                  this.log.error(e)
                })
              }
            }
          })
          this.once("finished", () => {
            if (hasNodeEnv) {
              const fs = win.fs
              if (!shouldKeepAfterUploading) {
                fs.promises.rm(imgPath).catch((e: any) => {
                  this.log.error(e)
                })
              }
            }
          })
          const { output } = await this.lifecycle.start([imgPath])
          return output
        }
      } catch (e) {
        this.emit(IBuildInEvent.FAILED, e)
        throw e
      }
    } else {
      // upload from path
      const { output } = await this.lifecycle.start(input)
      return output
    }
  }

  // ===================================================================================================================

  private getDefautBaseDir(): string {
    if (hasNodeEnv) {
      const os = win.require("os")
      const fs = win.fs
      const path = win.require("path")
      const { homedir } = os
      const dir = path.join(homedir(), ".universal-picgo")
      ensureFolderSync(fs, dir)
      return dir
    } else {
      return "universal-picgo"
    }
  }

  private initConfigPath(): void {
    if (this.configPath === "") {
      this.baseDir = this.getDefautBaseDir()
      if (hasNodeEnv) {
        const path = win.require("path")
        this.configPath = path.join(this.baseDir, "picgo.cfg.json")
      } else {
        this.configPath = browserPathJoin(this.baseDir, "picgo.cfg.json")
      }
    } else {
      if (hasNodeEnv) {
        const fs = win.fs
        const path = win.require("path")

        if (path.extname(this.configPath).toUpperCase() !== ".JSON") {
          this.configPath = ""
          throw Error("The configuration file only supports JSON format.")
        }
        this.baseDir = path.dirname(this.configPath)
        const exist = pathExistsSync(fs, path, this.configPath)
        if (!exist) {
          ensureFileSync(fs, path, `${this.configPath}`)
        }
      } else {
        this.baseDir = getBrowserDirectoryPath(this.configPath)
      }
    }

    if (this.pluginBaseDir === "") {
      this.pluginBaseDir = this.getDefautBaseDir()
    }

    this.log.debug("win =>", win)
    this.log.info(`hasNodeEnv => ${hasNodeEnv}`)
    this.log.info(`this.baseDir => ${this.baseDir}`)
    this.log.info(`this.pluginBaseDir => ${this.pluginBaseDir}`)
  }

  private initZhiNpmPath(): void {
    if (hasNodeEnv) {
      const fs = win.fs
      const path = win.require("path")

      if (this.zhiNpmPath === "") {
        this.zhiNpmPath = this.configPath
      }
      const dir = path.join(this.baseDir, "libs")
      ensureFolderSync(fs, dir)
    } else {
      this.log.warn("zhi is not supported in browser")
    }
  }

  private initConfig(): void {
    this.db = new ConfigDb(this)
    this._config = this.db.read(true) as IConfig
  }

  private init(): void {
    try {
      // init 18n at first
      this.i18n = new I18nManager(this)
      this._pluginLoader = new PluginLoader(this)
      // load self plugins
      setCurrentPluginName("picgo")
      uploaders(this).register(this)
      transformers(this).register(this)
      setCurrentPluginName("")
      // load third-party plugins
      this._pluginLoader.load()
      this.lifecycle = new Lifecycle(this)
    } catch (e: any) {
      this.emit(IBuildInEvent.UPLOAD_PROGRESS, -1)
      this.log.error(e)
      throw e
    }
  }
}

export { UniversalPicGo }
