/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IPicGo, IPicGoPlugin, IPicGoPluginInterface, IPluginLoader } from "../types"
import PluginLoaderDb from "../db/pluginLoder"
import { hasNodeEnv, win } from "universal-picgo-store"
import { readJSONSync } from "../utils/nodeUtils"
import { IBuildInEvent } from "../utils/enums"
import { setCurrentPluginName } from "./LifecyclePlugins"
import { ILogger } from "zhi-lib-base"

/**
 * Local plugin loader, file system is required
 */
export class PluginLoader implements IPluginLoader {
  private readonly ctx: IPicGo
  private readonly logger: ILogger
  private db: PluginLoaderDb
  private list: string[] = []
  private readonly fullList: Set<string> = new Set()
  private readonly pluginMap: Map<string, IPicGoPluginInterface> = new Map()

  constructor(ctx: IPicGo) {
    this.ctx = ctx
    this.logger = ctx.getLogger("plugin-loader")
    this.db = new PluginLoaderDb(this.ctx)
    this.init()
  }

  // load all third party plugin
  load(): boolean {
    if (hasNodeEnv) {
      const fs = win.fs
      const path = win.require("path")
      const packagePath = path.join(this.ctx.baseDir, "package.json")
      const pluginDir = path.join(this.ctx.baseDir, "node_modules/")
      // Thanks to hexo -> https://github.com/hexojs/hexo/blob/master/lib/hexo/load_plugins.js
      if (!fs.existsSync(pluginDir)) {
        return false
      }
      const json = readJSONSync(fs, packagePath)
      const deps = Object.keys(json.dependencies || {})
      const devDeps = Object.keys(json.devDependencies || {})
      const modules = deps.concat(devDeps).filter((name: string) => {
        if (!/^picgo-plugin-|^@[^/]+\/picgo-plugin-/.test(name)) return false
        const path = this.resolvePlugin(this.ctx, name)
        return fs.existsSync(path)
      })
      for (const module of modules) {
        this.registerPlugin(module)
      }
      return true
    } else {
      this.logger.warn("load is not supported in browser")
      return false
    }
  }

  registerPlugin(name: string, plugin?: IPicGoPlugin): void {
    if (hasNodeEnv) {
      if (!name) {
        this.ctx.log.warn("Please provide valid plugin")
        return
      }
      this.fullList.add(name)
      try {
        // register local plugin
        if (!plugin) {
          if (this.ctx.getConfig(`picgoPlugins.${name}`) || this.ctx.getConfig(`picgoPlugins.${name}`) === undefined) {
            this.list.push(name)
            setCurrentPluginName(name)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.getPlugin(name)!.register(this.ctx)
            const plugin = `picgoPlugins[${name}]`
            this.ctx.saveConfig({
              [plugin]: true,
            })
          }
        } else {
          // register provided plugin
          // && won't write config to files
          this.list.push(name)
          setCurrentPluginName(name)
          const pluginInterface = plugin(this.ctx)
          this.pluginMap.set(name, pluginInterface)
          pluginInterface.register(this.ctx)
        }
      } catch (e) {
        this.pluginMap.delete(name)
        this.list = this.list.filter((item: string) => item !== name)
        this.fullList.delete(name)
        this.ctx.log.error(e as Error)
        this.ctx.emit(IBuildInEvent.NOTIFICATION, {
          title: `Plugin ${name} Load Error`,
          body: e,
        })
      }
    } else {
      throw new Error("registerPlugin is not supported in browser")
    }
  }

  unregisterPlugin(name: string): void {
    this.list = this.list.filter((item: string) => item !== name)
    this.fullList.delete(name)
    this.pluginMap.delete(name)
    setCurrentPluginName(name)
    this.ctx.helper.uploader.unregister(name)
    this.ctx.helper.transformer.unregister(name)
    this.ctx.helper.beforeTransformPlugins.unregister(name)
    this.ctx.helper.beforeUploadPlugins.unregister(name)
    this.ctx.helper.afterUploadPlugins.unregister(name)
    // this.ctx.cmd.unregister(name)
    this.ctx.removeConfig("picgoPlugins", name)
  }

  // get plugin by name
  getPlugin(name: string): IPicGoPluginInterface | undefined {
    if (this.pluginMap.has(name)) {
      return this.pluginMap.get(name)
    }
    if (!hasNodeEnv) {
      return undefined
    }

    const path = win.require("path")
    const pluginDir = path.join(this.ctx.baseDir, "node_modules/")
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const plugin = require(pluginDir + name)(this.ctx)
    this.pluginMap.set(name, plugin)
    return plugin
  }

  /**
   * Get the list of enabled plugins
   */
  getList(): string[] {
    return this.list
  }

  hasPlugin(name: string): boolean {
    return this.fullList.has(name)
  }

  /**
   * Get the full list of plugins, whether it is enabled or not
   */
  getFullList(): string[] {
    return [...this.fullList]
  }
  // ===================================================================================================================

  private init(): void {}

  // get plugin entry
  private resolvePlugin(ctx: IPicGo, name: string): string {
    if (hasNodeEnv) {
      const path = win.require("path")
      return path.join(ctx.baseDir, "node_modules", name)
    } else {
      throw new Error("resolvePlugin is not supported in browser")
    }
  }
}
