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
import { bufferToBase64, safeParse } from "../../utils/common"
import { AxiosRequestConfig } from "axios"

const postOptions = (userConfig: IGitlabConfig, base64Image: string, fileName: string): AxiosRequestConfig => {
  const body = {
    branch: userConfig.branch,
    author_email: userConfig.authorMail,
    author_name: userConfig.authorName,
    encoding: "base64",
    commit_message: userConfig.commitMessage,
    content: base64Image,
  }

  const repo = encodeURIComponent(userConfig.repo)
  const filepath = encodeURIComponent(userConfig.path + fileName)
  return {
    method: "POST",
    url: `${userConfig.url}/api/v4/projects/${repo}/repository/files/${filepath}`,
    headers: {
      "Content-Type": "application/json",
      // "User-Agent": "PicGo",
      "PRIVATE-TOKEN": userConfig.token,
    },
    data: body,
    responseType: "json",
    // proxy=false 表示浏览器换无需代理也可以直接使用
    // proxy=true 表示浏览器需要设置代理
    proxy: false,
  }
}

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  const userConfig = ctx.getConfig<IGitlabConfig>("picBed.gitlab")
  if (!userConfig) {
    throw new Error("Can not find gitlab config!")
  }
  const imgList = ctx.output
  for (const img of imgList) {
    if (img.fileName) {
      try {
        let image = img.base64Image
        if (!image && img.buffer) {
          image = bufferToBase64(img.buffer)
        }
        if (!image) {
          ctx.log.error("Can not find image base64")
          throw new Error("Can not find image base64")
        }

        const postConfig = postOptions(userConfig, image, img.fileName)
        const res: any = await ctx.request(postConfig)
        const body = safeParse<any>(res)

        delete img.base64Image
        delete img.buffer

        // http://localhost:8002/api/v4/projects/terwer%2Fgitlab-upload/repository/files/img%2Fimage-20240321213215-uzrob4t.png
        // 需要转换成
        // http://localhost:8002/api/v4/projects/terwer%2Fgitlab-upload/repository/files/img%2Fimage-20240321213215-uzrob4t.png/raw?private_token=glpat-xxxxxxxxxxxxxxxx
        const repo = encodeURIComponent(userConfig.repo)
        const filepath = encodeURIComponent(body.file_path)
        img.imgUrl = `${userConfig.url}/api/v4/projects/${repo}/repository/files/${filepath}/raw?private_token=${userConfig.token}`
      } catch (e: any) {
        let errMsg: any
        // 处理重复图片
        if (e?.statusCode === 400 && e.response?.body?.message.indexOf("exists") > -1) {
          delete img.base64Image
          delete img.buffer
          const originalUrl = e.url
          img.imgUrl = originalUrl
        } else {
          if (e?.statusCode) {
            errMsg = e.response?.body?.error ?? e.response?.body?.message ?? e.stack ?? "unknown error"
          } else {
            errMsg = e.toString()
          }
          ctx.log.error(errMsg)
          throw new Error(errMsg)
        }
      }
    }
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
    {
      name: "path",
      type: "input",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB_PATH")
      },
      default: userConfig.path || "img/",
      required: false,
    },
    {
      name: "authorMail",
      type: "input",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB_AUTHOR_MAIL")
      },
      default: userConfig.authorMail || "youweics@163.com",
      required: false,
    },
    {
      name: "authorName",
      type: "input",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB_AUTHOR_NAME")
      },
      default: userConfig.authorName || "terwer",
      required: false,
    },
    {
      name: "commitMessage",
      type: "input",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_GITLAB_COMMIT_MESSAGE")
      },
      default: userConfig.commitMessage || "upload by PicGo via siyuan-plugin-picgo",
      required: false,
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
