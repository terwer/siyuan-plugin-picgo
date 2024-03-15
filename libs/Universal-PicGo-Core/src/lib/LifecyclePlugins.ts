/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { ILifecyclePlugins, IPlugin } from "../types"

export class LifecyclePlugins implements ILifecyclePlugins {
  static currentPlugin: string | null
  private readonly list: Map<string, IPlugin>
  private readonly pluginIdMap: Map<string, string[]>
  private readonly name: string

  constructor(name: string) {
    this.name = name
    this.list = new Map()
    this.pluginIdMap = new Map()
  }

  get(id: string): IPlugin | undefined {
    return undefined
  }

  getIdList(): string[] {
    return []
  }

  getList(): IPlugin[] {
    return []
  }

  getName(): string {
    return ""
  }

  register(id: string, plugin: IPlugin): void {
    return
  }

  unregister(id: string): void {
    return
  }
}
