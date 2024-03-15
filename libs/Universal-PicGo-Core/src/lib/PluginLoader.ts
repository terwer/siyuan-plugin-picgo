/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IPicGoPlugin, IPicGoPluginInterface, IPluginLoader } from "../types"

/**
 * Local plugin loader, file system is required
 */
export class PluginLoader implements IPluginLoader {
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
}
