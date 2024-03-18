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
import { PluginLoader } from "../lib/PluginLoader"
import { LifecyclePlugins } from "../lib/LifecyclePlugins"
import { PluginHandler } from "../lib/PluginHandler"
import _ from "lodash-es"
import getClipboardImage from "../utils/getClipboardImage"
import { IBuildInEvent } from "../utils/enums"
import DB from "../db/db"
import { hasNodeEnv, win } from "universal-picgo-store"
import { ensureFileSync, pathExistsSync } from "../utils/nodeUtils"
import { I18nManager } from "../i18n"
import { browserPathJoin, getBrowserDirectoryPath } from "../utils/browserUtils"
import { isConfigKeyInBlackList, isInputConfigValid } from "../utils/common"

/*
 * 通用 PicGO 对象定义
 *
 * @version 1.6.0
 * @since 1.4.5
 */
class UniversalPicGo extends EventEmitter implements IPicGo {
  private _config!: IConfig
  private lifecycle!: Lifecycle
  private db!: DB
  private _pluginLoader!: PluginLoader
  configPath: string
  baseDir!: string
  helper!: IHelper
  log: ILogger
  // cmd: Commander
  output: IImgInfo[]
  input: any[]
  pluginHandler: PluginHandler
  i18n!: II18nManager
  VERSION: string = process.env.PICGO_VERSION ?? "unknown"

  // GUI_VERSION?: string

  get pluginLoader(): IPluginLoader {
    return this._pluginLoader
  }

  constructor(configPath = "", isDev?: boolean) {
    super()
    this.log = simpleLogger("universal-picgo-api", "universal-picgo", isDev ?? false)
    this.configPath = configPath
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
    // this.cmd = new Commander(this)
    this.pluginHandler = new PluginHandler(this)
    this.initConfig()
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

  // registerCommands(): void {
  //   if (this.configPath !== "") {
  //     this.cmd.init()
  //     this.cmd.loadCommands()
  //   }
  // }

  getConfig<T>(name?: string): T {
    if (!name) {
      return this._config as unknown as T
    } else {
      return _.get(this._config, name)
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
      // eventBus.emit(IBusEvent.CONFIG_CHANGE, {
      //   configName: name,
      //   value: config[name],
      // })
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
            if (!shouldKeepAfterUploading) {
              // 删除 picgo 生成的图片文件，例如 `~/.picgo/20200621205720.png`
              // fs.remove(imgPath).catch((e) => {
              //   this.log.error(e)
              // })
            }
          })
          this.once("finished", () => {
            if (!shouldKeepAfterUploading) {
              // fs.remove(imgPath).catch((e) => {
              //   this.log.error(e)
              // })
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

  private initConfigPath(): void {
    this.log.debug("win =>", win)
    this.log.info(`hasNodeEnv => ${hasNodeEnv}`)
    if (hasNodeEnv) {
      const os = win.require("os")
      const fs = win.fs
      const path = win.require("path")
      const { homedir } = os
      if (this.configPath === "") {
        this.configPath = homedir() + "/.universal-picgo/config.json"
      }
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
      if (this.configPath === "") {
        this.baseDir = "universal-picgo"
        this.configPath = browserPathJoin(this.baseDir, "config.json")
      } else {
        // 模拟 path.dirname 的功能，获取路径的目录部分赋值给 baseDir
        this.baseDir = getBrowserDirectoryPath(this.configPath)
      }
    }
  }

  private initConfig(): void {
    this.db = new DB(this)
    this._config = this.db.read(true) as IConfig
  }

  private init(): void {
    try {
      // init 18n at first
      this.i18n = new I18nManager(this)
      this._pluginLoader = new PluginLoader(this)
    } catch (e: any) {
      this.emit(IBuildInEvent.UPLOAD_PROGRESS, -1)
      this.log.error(e)
      throw e
    }
  }
}

export { UniversalPicGo }
