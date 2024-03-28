/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IPicGo, IPluginHandler, IPluginHandlerOptions, IPluginHandlerResult, IProcessEnv } from "../types"
import { win } from "universal-picgo-store"

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
    const result = await this.execCommand("-v")
    console.log("npm result =>", result)
    throw new Error("PluginHandler.install not implemented")
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
   * @param path 命令路径
   * @param oargs - 其它参数
   * @param cwd 当前路径
   * @param env 环境变量
   * @returns 执行结果的 Promise
   */
  private async execCommand(
    subCommand: string,
    path?: string,
    oargs?: any[],
    cwd?: string,
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
      return win.zhi.npm.npmCmd(subCommand, path, oargs, cwd, env)
    } catch (e: any) {
      throw new Error("npm 命令执行异常 =>" + e.toString())
    }
  }
}
