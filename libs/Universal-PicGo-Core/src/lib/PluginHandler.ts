/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import {
  IPicGo,
  IPluginHandler,
  IPluginHandlerOptions,
  IPluginHandlerResult,
  IPluginProcessResult,
  IProcessEnv,
  Undefinable,
} from "../types"
import { win } from "universal-picgo-store"
import { getNormalPluginName, getProcessPluginName } from "../utils/common"
import { ILocalesKey } from "../i18n/zh-CN"

export class PluginHandler implements IPluginHandler {
  // Thanks to feflow -> https://github.com/feflow/feflow/blob/master/lib/internal/install/plugin.js
  private readonly ctx: IPicGo

  constructor(ctx: IPicGo) {
    this.ctx = ctx
  }

  async install(
    plugins: string[],
    options: IPluginHandlerOptions,
    env: IProcessEnv | undefined
  ): Promise<IPluginHandlerResult<boolean>> {
    // const result = await this.execCommand("-v")
    // console.log("npm result =>", result)

    const installedPlugins: string[] = []
    const processPlugins = plugins
      .map((item: string) => handlePluginNameProcess(this.ctx, item))
      .filter((item) => {
        // detect if has already installed
        // or will cause error
        if (this.ctx.pluginLoader.hasPlugin(item.pkgName)) {
          installedPlugins.push(item.pkgName)
          this.ctx.log.info(`PicGo has already installed ${item.pkgName}`)
          return false
        }
        // if something wrong, filter it out
        if (!item.success) {
          return false
        }
        return true
      })
    const fullNameList = processPlugins.map((item: any) => item.fullName)
    const pkgNameList = processPlugins.map((item: any) => item.pkgName)

    if (fullNameList.length > 0) {
      // install plugins must use fullNameList:
      // 1. install remote pacage
      // 2. install local pacage
      const result = await this.execCommand("install", fullNameList, this.ctx.baseDir, options, env)
      if (result.success) {
        pkgNameList.forEach((pluginName: string) => {
          this.ctx.pluginLoader.registerPlugin(pluginName)
        })
        this.ctx.log.info(this.ctx.i18n.translate<ILocalesKey>("PLUGIN_HANDLER_PLUGIN_INSTALL_SUCCESS"))
        this.ctx.emit("installSuccess", {
          title: this.ctx.i18n.translate<ILocalesKey>("PLUGIN_HANDLER_PLUGIN_INSTALL_SUCCESS"),
          body: [...pkgNameList, ...installedPlugins],
        })
        const res: IPluginHandlerResult<true> = {
          success: true,
          body: [...pkgNameList, ...installedPlugins],
        }
        console.log("install plugin success =>", result)
        return res
      } else {
        const err = this.ctx.i18n.translate<ILocalesKey>("PLUGIN_HANDLER_PLUGIN_INSTALL_FAILED_REASON", {
          code: `-1`,
          data: result.body,
        })
        this.ctx.log.error(err)
        this.ctx.emit("installFailed", {
          title: this.ctx.i18n.translate<ILocalesKey>("PLUGIN_HANDLER_PLUGIN_INSTALL_FAILED"),
          body: err,
        })
        const res: IPluginHandlerResult<false> = {
          success: false,
          body: err,
        }
        return res
      }
    } else if (installedPlugins.length === 0) {
      const err = this.ctx.i18n.translate<ILocalesKey>("PLUGIN_HANDLER_PLUGIN_UNINSTALL_FAILED_VALID")
      this.ctx.log.error(err)
      this.ctx.emit("installFailed", {
        title: this.ctx.i18n.translate<ILocalesKey>("PLUGIN_HANDLER_PLUGIN_INSTALL_FAILED"),
        body: err,
      })
      const res: IPluginHandlerResult<false> = {
        success: false,
        body: err,
      }
      return res
    } else {
      this.ctx.log.info(this.ctx.i18n.translate<ILocalesKey>("PLUGIN_HANDLER_PLUGIN_INSTALL_SUCCESS"))
      this.ctx.emit("installSuccess", {
        title: this.ctx.i18n.translate<ILocalesKey>("PLUGIN_HANDLER_PLUGIN_INSTALL_SUCCESS"),
        body: [...pkgNameList, ...installedPlugins],
      })
      const res: IPluginHandlerResult<true> = {
        success: true,
        body: [...pkgNameList, ...installedPlugins],
      }
      return res
    }
  }

  async uninstall(plugins: string[]): Promise<IPluginHandlerResult<boolean>> {
    throw new Error("PluginHandler.uninstall not implemented")
  }

  async update(
    plugins: string[],
    options: IPluginHandlerOptions,
    env: IProcessEnv | undefined
  ): Promise<IPluginHandlerResult<boolean>> {
    throw new Error("PluginHandler.update not implemented")
  }

  // ===================================================================================================================
  /**
   * 执行 NPM 命令
   *
   * @param subCommand - 要执行的 NPM 命令
   * @param modules - 模块数组
   * @param cwd 当前路径
   * @param options
   * @param env 环境变量
   * @returns 执行结果的 Promise
   */
  private async execCommand(
    subCommand: string,
    modules: string[],
    cwd?: string,
    options: IPluginHandlerOptions = {},
    env?: Record<string, any>
  ): Promise<any> {
    try {
      // 1、 require zhi-infra
      const zhiInfraPath = `${this.ctx.baseDir}/libs/zhi-infra/index.cjs`
      const setupjsPath = `${this.ctx.baseDir}/libs/setup`
      const result = await win.require(zhiInfraPath).default([setupjsPath, true])

      // 2、await zhi.npm.checkAndInitNode()
      await win.zhi.npm.checkAndInitNode()
      console.log("node installed, start exec cmd...")

      // exec cmd
      // options first
      const registry =
        options.npmRegistry ||
        this.ctx.getConfig<Undefinable<string>>("settings.npmRegistry") ||
        "https://registry.npmmirror.com"
      const proxy = options.npmProxy || this.ctx.getConfig<Undefinable<string>>("settings.npmProxy")
      let args = modules.concat("--color=always").concat("--save")
      if (registry) {
        args = args.concat(`--registry=${registry}`)
      }
      if (proxy) {
        args = args.concat(`--proxy=${proxy}`)
      }

      const res = await win.zhi.npm.localNodeExecCmd("npm", subCommand, undefined, args, cwd, env)
      return {
        success: true,
        body: res,
      }
    } catch (e: any) {
      return {
        success: false,
        body: "npm 命令执行异常 =>" + e.toString(),
      }
    }
  }
}

/**
 * transform the input plugin name or path string to valid result
 * @param ctx
 * @param nameOrPath
 */
const handlePluginNameProcess = (ctx: IPicGo, nameOrPath: string): IPluginProcessResult => {
  const res = {
    success: false,
    fullName: "",
    pkgName: "",
  }
  const result = getProcessPluginName(nameOrPath, ctx.log)
  if (!result) {
    return res
  }
  // first get result then do this process
  // or some error will log twice
  const pkgName = getNormalPluginName(result, ctx.log)
  if (!pkgName) {
    return res
  }
  return {
    success: true,
    fullName: result,
    pkgName,
  }
}
