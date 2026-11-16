/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { EventEmitter } from "../utils/nodePolyfill"
import { ILifecyclePlugins, IPicGo, IPlugin, Undefinable } from "../types"
import { createContext } from "../utils/createContext"
import { IBuildInEvent } from "../utils/enums"

export class Lifecycle extends EventEmitter {
  private readonly ctx: IPicGo

  constructor(ctx: IPicGo) {
    super()
    this.ctx = ctx
  }

  async start(input: any[]): Promise<IPicGo> {
    // ensure every upload process has an unique context
    const ctx = createContext(this.ctx)
    try {
      // images input
      if (!Array.isArray(input)) {
        throw new Error("Input must be an array.")
      }
      ctx.input = input
      ctx.output = []

      // lifecycle main
      await this.beforeTransform(ctx)
      await this.doTransform(ctx)
      await this.beforeUpload(ctx)
      await this.doUpload(ctx)
      await this.afterUpload(ctx)
      return ctx
    } catch (e: any) {
      ctx.emit(IBuildInEvent.UPLOAD_PROGRESS, -1)
      ctx.emit(IBuildInEvent.FAILED, e)
      // if (ctx.getConfig<Undefinable<string>>("debug")) {
      // }
      // should throw error to stop the process
      throw e
      // return ctx
    }
  }

  private async beforeTransform(ctx: IPicGo): Promise<IPicGo> {
    ctx.emit(IBuildInEvent.UPLOAD_PROGRESS, 0)
    ctx.emit(IBuildInEvent.BEFORE_TRANSFORM, ctx)
    await this.handlePlugins(ctx.helper.beforeTransformPlugins, ctx)
    return ctx
  }

  private async doTransform(ctx: IPicGo): Promise<IPicGo> {
    ctx.emit(IBuildInEvent.UPLOAD_PROGRESS, 30)
    const type = ctx.getConfig<Undefinable<string>>("picBed.transformer") || "path"
    let transformer = ctx.helper.transformer.get(type)
    if (!transformer) {
      transformer = ctx.helper.transformer.get("path")
      ctx.log.warn(`Can't find transformer - ${type}, switch to default transformer - path`)
    }
    await transformer?.handle(ctx)
    return ctx
  }

  private async beforeUpload(ctx: IPicGo): Promise<IPicGo> {
    ctx.emit(IBuildInEvent.UPLOAD_PROGRESS, 60)
    ctx.emit(IBuildInEvent.BEFORE_UPLOAD, ctx)
    await this.handlePlugins(ctx.helper.beforeUploadPlugins, ctx)
    return ctx
  }

  private async doUpload(ctx: IPicGo): Promise<IPicGo> {
    let type =
      ctx.getConfig<Undefinable<string>>("picBed.uploader") ||
      ctx.getConfig<Undefinable<string>>("picBed.current") ||
      "smms"
    let uploader = ctx.helper.uploader.get(type)
    if (!uploader) {
      type = "smms"
      uploader = ctx.helper.uploader.get("smms")
      ctx.log.warn(`Can't find uploader - ${type}, switch to default uploader - smms`)
    }
    await uploader?.handle(ctx)
    for (const outputImg of ctx.output) {
      outputImg.type = type
    }
    return ctx
  }

  private async afterUpload(ctx: IPicGo): Promise<IPicGo> {
    ctx.emit(IBuildInEvent.AFTER_UPLOAD, ctx)
    ctx.emit(IBuildInEvent.UPLOAD_PROGRESS, 100)
    await this.handlePlugins(ctx.helper.afterUploadPlugins, ctx)
    let msg = ""
    const length = ctx.output.length
    for (let i = 0; i < length; i++) {
      if (typeof ctx.output[i].imgUrl !== "undefined") {
        msg += ctx.output[i].imgUrl!
        if (i !== length - 1) {
          msg += "\n"
        }
      }
      delete ctx.output[i].base64Image
      delete ctx.output[i].buffer
    }
    ctx.emit(IBuildInEvent.FINISHED, ctx)
    if (msg === "") {
      throw new Error("image upload occured an error, please read log for details")
    }
    return ctx
  }

  // ===================================================================================================================

  private async handlePlugins(lifeCyclePlugins: ILifecyclePlugins, ctx: IPicGo): Promise<IPicGo> {
    const plugins = lifeCyclePlugins.getList()
    const pluginNames = lifeCyclePlugins.getIdList()
    const lifeCycleName = lifeCyclePlugins.getName()
    await Promise.all(
      plugins.map(async (plugin: IPlugin, index: number) => {
        try {
          await plugin.handle(ctx)
        } catch (e) {
          ctx.log.error(`${lifeCycleName}: ${pluginNames[index]} error`)
          throw e
        }
      })
    )
    return ctx
  }
}
