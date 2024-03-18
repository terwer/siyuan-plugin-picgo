/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IPicGo, IPicGoPlugin, IPicGoPluginInterface, IPluginLoader } from "../types"
import { hasNodeEnv, win } from "universal-picgo-store/src"
import BrowserPluginLoaderDb from "../db/browserPluginLoderDb"

/**
 * Local plugin loader, file system is required
 */
export class PluginLoader implements IPluginLoader {
  private readonly ctx: IPicGo
  private browserPluginLoaderDb?: BrowserPluginLoaderDb
  private list: string[] = []
  private readonly fullList: Set<string> = new Set()
  private readonly pluginMap: Map<string, IPicGoPluginInterface> = new Map()

  constructor(ctx: IPicGo) {
    this.ctx = ctx
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

  private init(): void {
    if (hasNodeEnv) {
      const fs = win.fs
      const path = win.require("path")

      const packagePath = path.join(this.ctx.baseDir, "package.json")
      if (!fs.existsSync(packagePath)) {
        const pkg = {
          name: "picgo-plugins",
          description: "picgo-plugins",
          repository: "https://github.com/PicGo/PicGo-Core",
          license: "MIT",
        }
        fs.writeFileSync(packagePath, JSON.stringify(pkg), "utf8")
      }
    } else {
      this.browserPluginLoaderDb = new BrowserPluginLoaderDb(this.ctx)
    }
  }
}
