/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IPicGo, IPluginHandler, IPluginHandlerOptions, IPluginHandlerResult, IProcessEnv } from "../types"

export class PluginHandler implements IPluginHandler {
  // Thanks to feflow -> https://github.com/feflow/feflow/blob/master/lib/internal/install/plugin.js
  private readonly ctx: IPicGo
  constructor(ctx: IPicGo) {
    this.ctx = ctx
  }

  install(
    plugins: string[],
    options: IPluginHandlerOptions,
    env: IProcessEnv | undefined
  ): Promise<IPluginHandlerResult<boolean>> {
    throw new Error("PluginHandler.install not implemented")
  }

  uninstall(plugins: string[]): Promise<IPluginHandlerResult<boolean>> {
    throw new Error("PluginHandler.uninstall not implemented")
  }

  update(
    plugins: string[],
    options: IPluginHandlerOptions,
    env: IProcessEnv | undefined
  ): Promise<IPluginHandlerResult<boolean>> {
    throw new Error("PluginHandler.update not implemented")
  }
}
