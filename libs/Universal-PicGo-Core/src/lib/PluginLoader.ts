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

/**
 * Local plugin loader, file system is required
 */
export class PluginLoader implements IPluginLoader {
  private readonly ctx: IPicGo
  private db: PluginLoaderDb
  private list: string[] = []
  private readonly fullList: Set<string> = new Set()
  private readonly pluginMap: Map<string, IPicGoPluginInterface> = new Map()

  constructor(ctx: IPicGo) {
    this.ctx = ctx
    this.db = new PluginLoaderDb(this.ctx)
    this.init()
  }

  getFullList(): string[] {
    return []
  }

  getList(): string[] {
    return []
  }

  getPlugin(name: string): IPicGoPluginInterface | undefined {
    return undefined
  }

  hasPlugin(name: string): boolean {
    return false
  }

  registerPlugin(name: string, plugin: IPicGoPlugin | undefined): void {
    return
  }

  unregisterPlugin(name: string): void {
    return
  }

  // ===================================================================================================================

  private init(): void {}
}
