/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IAliyunConfig, IPicGo, IPluginConfig } from "../../../types"
import { ILocalesKey } from "../../../i18n/zh-CN"
import { handleWeb } from "./web"

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  // Use the host-neutral signed HTTP implementation for both browser and
  // SiYuan/Electron targets. The previous Node SDK path imported ali-oss
  // statically, which pulled core-js/lodash dynamic global fallbacks into the
  // generic library/browser bundles.
  return handleWeb(ctx)
}

const config = (ctx: IPicGo): IPluginConfig[] => {
  const userConfig = ctx.getConfig<IAliyunConfig>("picBed.aliyun") || {}
  const config: IPluginConfig[] = [
    {
      name: "accessKeyId",
      type: "input",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_ACCESSKEYID")
      },
      default: userConfig.accessKeyId || "",
      required: true,
    },
    {
      name: "accessKeySecret",
      type: "password",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_ACCESSKEYSECRET")
      },
      default: userConfig.accessKeySecret || "",
      required: true,
    },
    {
      name: "bucket",
      type: "input",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_BUCKET")
      },
      default: userConfig.bucket || "",
      required: true,
    },
    {
      name: "area",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_AREA")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_AREA")
      },
      default: userConfig.area || "",
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_MESSAGE_AREA")
      },
      required: true,
    },
    {
      name: "path",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_PATH")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_PATH")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_MESSAGE_PATH")
      },
      default: userConfig.path || "",
      required: false,
    },
    {
      name: "customUrl",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_CUSTOMURL")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_CUSTOMURL")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_MESSAGE_CUSTOMURL")
      },
      default: userConfig.customUrl || "",
      required: false,
    },
    {
      name: "options",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_OPTIONS")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_OPTIONS")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD_MESSAGE_OPTIONS")
      },
      default: userConfig.options || "",
      required: false,
    },
  ]
  return config
}

export default function register(ctx: IPicGo): void {
  ctx.helper.uploader.register("aliyun", {
    get name() {
      return ctx.i18n.translate<ILocalesKey>("PICBED_ALICLOUD")
    },
    handle,
    config,
  })
}
