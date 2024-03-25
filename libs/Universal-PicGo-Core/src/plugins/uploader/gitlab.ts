/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IGitlabConfig, IPicGo } from "../../types"
import { ILocalesKey } from "../../i18n/zh-CN"
import { base64ToBuffer, safeParse } from "../../utils/common"
import { AxiosRequestConfig } from "axios"

const postOptions = (url: string, repo: string, token: string, image: Buffer, fileName: string): AxiosRequestConfig => {
  const formData = new FormData()
  formData.append("file", new Blob([image], { type: "image/png" }), fileName)

  return {
    method: "POST",
    url: `${url}/api/v4/projects/${encodeURIComponent(repo)}/uploads`,
    headers: {
      "Content-Type": "multipart/form-data",
      // "User-Agent": "PicGo",
      "PRIVATE-TOKEN": token,
    },
    data: formData,
    responseType: "json",
  }
}

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  const gitlabConfig = ctx.getConfig<IGitlabConfig>("picBed.gitlab")
  if (!gitlabConfig) {
    throw new Error("Can not find gitlab config!")
  }
  try {
    const imgList = ctx.output
    for (const img of imgList) {
      if (img.fileName) {
        let image = img.buffer
        if (!image && img.base64Image) {
          image = base64ToBuffer(img.base64Image)
        }
        if (!image) {
          ctx.log.error("Can not find image buffer")
          throw new Error("Can not find image buffer")
        }

        const postConfig = postOptions(gitlabConfig.url, gitlabConfig.repo, gitlabConfig.token, image, img.fileName)
        const res: string = await ctx.request(postConfig)
        const body = safeParse<any>(res)

        delete img.base64Image
        delete img.buffer
        img.imgUrl = body.full_url
      }
    }
  } catch (e: any) {
    let errMsg: any
    if (e?.statusCode === 400) {
      errMsg = e.response?.body?.error ?? e.stack ?? "unknown error"
    } else {
      errMsg = e.toString()
    }
    ctx.log.error(errMsg)
    throw new Error(errMsg)
  }
  return ctx
}

const config = (ctx: IPicGo) => {
  const userConfig = ctx.getConfig<IGitlabConfig>("picBed.gitlab") || {}
  return [
    {
      name: "url",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB_URL")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB_URL")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB_MESSAGE_URL")
      },
      default: userConfig.url || "",
      required: true,
    },
    {
      name: "repo",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB_REPO")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB_REPO")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB_MESSAGE_REPO")
      },
      default: userConfig.repo || "",
      required: true,
    },
    {
      name: "branch",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB_BRANCH")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB_BRANCH")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB_MESSAGE_BRANCH")
      },
      default: userConfig.branch || "main",
      required: true,
    },
    {
      name: "token",
      type: "password",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB_TOKEN")
      },
      default: userConfig.token || "",
      required: true,
    },
  ]
}

export default function register(ctx: IPicGo): void {
  ctx.helper.uploader.register("gitlab", {
    get name() {
      return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB")
    },
    handle,
    config,
  })
}
