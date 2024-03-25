/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { AxiosRequestConfig } from "axios"
import { IGithubConfig, IPicGo, IPluginConfig } from "../../types"
import mime from "mime-types"
import { ILocalesKey } from "../../i18n/zh-CN"

const postOptions = (fileName: string, options: IGithubConfig, data: any): AxiosRequestConfig => {
  const path = options.path || ""
  const { token, repo } = options
  return {
    method: "PUT",
    url: `https://api.github.com/repos/${repo}/contents/${encodeURI(path)}${encodeURIComponent(fileName)}`,
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "PicGo",
      "Content-Type": mime.lookup(fileName),
    },
    data: data,
  } as const
}

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  throw new Error("github plugin is not implemented")
}

const config = (ctx: IPicGo): IPluginConfig[] => {
  const userConfig = ctx.getConfig<IGithubConfig>("picBed.github") || {}
  const config: IPluginConfig[] = [
    {
      name: "repo",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITHUB_REPO")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITHUB_REPO")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITHUB_MESSAGE_REPO")
      },
      default: userConfig.repo || "",
      required: true,
    },
    {
      name: "branch",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITHUB_BRANCH")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITHUB_BRANCH")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITHUB_MESSAGE_BRANCH")
      },
      default: userConfig.branch || "main",
      required: true,
    },
    {
      name: "token",
      type: "password",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITHUB_TOKEN")
      },
      default: userConfig.token || "",
      required: true,
    },
    {
      name: "path",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITHUB_PATH")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITHUB_PATH")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITHUB_MESSAGE_PATH")
      },
      default: userConfig.path || "",
      required: false,
    },
    {
      name: "customUrl",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITHUB_CUSTOMURL")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITHUB_CUSTOMURL")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITHUB_MESSAGE_CUSTOMURL")
      },
      default: userConfig.customUrl || "",
      required: false,
    },
  ]
  return config
}

export default function register(ctx: IPicGo): void {
  ctx.helper.uploader.register("github", {
    get name() {
      return ctx.i18n.translate<ILocalesKey>("PICBED_GITHUB")
    },
    handle,
    config,
  })
}
