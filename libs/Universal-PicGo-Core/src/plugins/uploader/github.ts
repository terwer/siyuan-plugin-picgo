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
import { bufferToBase64 } from "../../utils/common"
import { IBuildInEvent } from "../../utils/enums"

const postOptions = (fileName: string, options: IGithubConfig, data: any): AxiosRequestConfig => {
  const path = options.path || ""
  const { token, repo } = options
  return {
    method: "PUT",
    url: `https://api.github.com/repos/${repo}/contents/${encodeURI(path)}${encodeURIComponent(fileName)}`,
    headers: {
      Authorization: `token ${token}`,
      // "User-Agent": "PicGo",
      "Content-Type": mime.lookup(fileName),
    },
    data: data,
    proxy: false,
  } as const
}

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  const githubOptions = ctx.getConfig<IGithubConfig>("picBed.github")
  if (!githubOptions) {
    throw new Error("Can't find github config")
  }
  try {
    const imgList = ctx.output
    for (const img of imgList) {
      if (img.fileName) {
        let base64Image = img.base64Image
        if (!base64Image && img.buffer) {
          base64Image = bufferToBase64(img.buffer)
        }
        if (!base64Image) {
          ctx.log.error("Can not find image base64")
          throw new Error("Can not find image base64")
        }
        const data = {
          message: "Upload by PicGo via siyuan-note",
          branch: githubOptions.branch,
          content: base64Image,
          path: githubOptions.path + encodeURI(img.fileName),
        }
        const postConfig = postOptions(img.fileName, githubOptions, data)
        try {
          const body: {
            content: {
              download_url: string
            }
          } = await ctx.request(postConfig)
          if (body) {
            delete img.base64Image
            delete img.buffer
            if (githubOptions.customUrl) {
              img.imgUrl = `${githubOptions.customUrl}/${encodeURI(githubOptions.path)}${encodeURIComponent(
                img.fileName
              )}`
            } else {
              img.imgUrl = body.content.download_url
            }
          } else {
            throw new Error("Server error, please try again")
          }
        } catch (e: any) {
          // handle duplicate images
          if (e.statusCode === 422) {
            delete img.base64Image
            delete img.buffer
            if (githubOptions.customUrl) {
              img.imgUrl = `${githubOptions.customUrl}/${encodeURI(githubOptions.path)}${encodeURIComponent(
                img.fileName
              )}`
            } else {
              img.imgUrl = `https://raw.githubusercontent.com/${githubOptions.repo}/${githubOptions.branch}/${encodeURI(
                githubOptions.path
              )}${encodeURIComponent(img.fileName)}`
            }
          } else {
            let errMsg: any
            if (e?.statusCode) {
              errMsg = e.response?.body?.error ?? e.response?.body?.message ?? e.stack ?? "unknown error"
            } else {
              errMsg = e.toString()
            }
            ctx.log.error(errMsg)
            ctx.emit(IBuildInEvent.NOTIFICATION, {
              title: ctx.i18n.translate<ILocalesKey>("UPLOAD_FAILED"),
              body: ctx.i18n.translate<ILocalesKey>("CHECK_SETTINGS"),
            })
            throw errMsg
          }
        }
      }
    }
    return ctx
  } catch (err) {
    ctx.emit(IBuildInEvent.NOTIFICATION, {
      title: ctx.i18n.translate<ILocalesKey>("UPLOAD_FAILED"),
      body: ctx.i18n.translate<ILocalesKey>("CHECK_SETTINGS_AND_NETWORK"),
    })
    throw err
  }
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
