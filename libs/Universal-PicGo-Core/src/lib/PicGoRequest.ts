/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 *
 */

import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import { IConfig, IConfigChangePayload, IFullResponse, IPicGo, IResponse, Undefinable } from "../types"
import { ILogger } from "zhi-lib-base"
import { picgoEventBus } from "../utils/picgoEventBus"
import { IBusEvent } from "../utils/enums"
import { browserPathJoin } from "../utils/browserUtils"
import { hasNodeEnv } from "universal-picgo-store"
import { ILocalesKey } from "../i18n/zh-CN"
import { isSiyuanProxyAvailable, safeParse } from "../utils/common"
import { CodingUtil } from "../utils/CodingUtil"

// legacy request adaptor start
// thanks for https://github.dev/request/request/blob/master/index.js
function appendFormData(form: FormData, key: string, data: any): void {
  if (typeof data === "object" && "value" in data && "options" in data) {
    form.append(key, data.value, data.options)
  } else {
    form.append(key, data)
  }
}

function requestInterceptor(options: any | AxiosRequestConfig): AxiosRequestConfig & {
  __isOldOptions?: boolean
} {
  let __isOldOptions = false
  const opt: AxiosRequestConfig<any> & {
    __isOldOptions?: boolean
  } = {
    ...options,
    url: (options.url as string) || "",
    headers: options.headers || {},
  }
  if ("formData" in options) {
    const form = new FormData() as any
    for (const key in options.formData) {
      const data = options.formData[key]
      appendFormData(form, key, data)
    }
    opt.data = form
    opt.headers = Object.assign(opt.headers || {}, form.getHeaders())
    __isOldOptions = true
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    delete opt.formData
  }
  if ("body" in options) {
    opt.data = options.body
    __isOldOptions = true
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    delete opt.body
  }
  if ("qs" in options) {
    opt.params = options.qs
    __isOldOptions = true
  }
  opt.__isOldOptions = __isOldOptions
  return opt
}

// legacy request adaptor end

function responseInterceptor(response: AxiosResponse): IFullResponse {
  return {
    ...response,
    statusCode: response.status,
    body: response.data,
  }
}

function responseErrorHandler(error: any) {
  const errorObj = {
    method: error?.config?.method?.toUpperCase() || "",
    url: error?.config?.url || "",
    statusCode: error?.response?.status || 0,
    message: error?.message || "",
    stack: error?.stack || {},
    response: {
      status: error?.response?.status || 0,
      statusCode: error?.response?.status || 0,
      body: error?.response?.data || "",
    },
  }
  return Promise.reject(errorObj)
}

// =====================================================================================================================
/**
 * 处理思源笔记代理
 *
 * @param siyuanProxyUrl
 * @param options
 */
async function siyuanProxyInterceptor(
  siyuanProxyUrl: Undefinable<string>,
  options: any | AxiosRequestConfig
): Promise<AxiosRequestConfig> {
  if (!siyuanProxyUrl) {
    return options
  }

  // contentType
  let contentType = options.headers["Content-Type"] || options.headers["content-type"] || "application/json"

  // header
  const headers = {
    ...options.headers,
  }
  const xCorsHeaders = safeParse(options.headers["x-cors-headers"] || "{}") as any
  for (const [key, value] of Object.entries(xCorsHeaders)) {
    headers[key] = value
  }
  delete headers["x-cors-headers"]

  // payload
  let payloadBuf = new ArrayBuffer(0)
  // GET or HEAD cannot have request body
  if (options.method !== "GET" && options.method !== "HEAD") {
    const myRequest = new Request("", { method: options.method, body: options.data })
    console.log("generate temp myRequest =>", myRequest)
    payloadBuf = await myRequest.arrayBuffer()
    // multipart/form-data 需要自动设置
    const formDataContentType = myRequest.headers.get("Content-Type") ?? ""
    if (formDataContentType.includes("multipart/form-data")) {
      contentType = formDataContentType
    }
  }
  const payload = CodingUtil.encodeToBase64String(payloadBuf)

  const body = {
    url: options.url,
    method: options.method,
    timeout: 7000,
    contentType: contentType,
    headers: [headers],
    payload: payload,
    payloadEncoding: "base64",
    responseEncoding: "base64",
  }

  const opt = {
    url: `${siyuanProxyUrl}/api/network/forwardProxy`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
  } as any

  if (options.__isOldOptions) {
    opt.__isOldOptions = options.__isOldOptions
  }

  return opt
}

// =====================================================================================================================

class PicGoRequestWrapper {
  private readonly ctx: IPicGo
  private readonly logger: ILogger
  private proxy: Undefinable<string> = ""
  private siyuanProxy: Undefinable<string> = ""
  private options: AxiosRequestConfig<any> = {}

  constructor(ctx: IPicGo) {
    this.ctx = ctx
    this.logger = ctx.getLogger("picgo-request")

    this.init()
    picgoEventBus.on(IBusEvent.CONFIG_CHANGE, (data: IConfigChangePayload<string | IConfig["picBed"]>) => {
      switch (data.configName) {
        case "picBed":
          if ((data.value as IConfig["picBed"])?.proxy) {
            this.proxy = (data.value as IConfig["picBed"]).proxy
          }
          break
        case "picBed.proxy":
          this.proxy = data.value as string
          break
      }
    })
  }

  private init(): void {
    const proxy = this.ctx.getConfig<Undefinable<string>>("picBed.proxy")
    const siyuanProxy = this.ctx.getConfig<Undefinable<string>>("siyuan.proxy")
    if (proxy) {
      this.proxy = proxy
    }
    if (siyuanProxy) {
      this.siyuanProxy = siyuanProxy
    }
  }

  private handleProxy(): AxiosRequestConfig["proxy"] | false {
    if (this.proxy) {
      try {
        const proxyOptions = new URL(this.proxy)
        return {
          host: proxyOptions.hostname,
          port: parseInt(proxyOptions.port || "0", 10),
          protocol: proxyOptions.protocol,
        }
      } catch (e) {
        /* empty */
      }
    }
    return false
  }

  /**
   * PicGo 统一请求封装，基于 axios
   *
   * @param userOptions
   * @constructor
   */
  public async PicGoRequest<T, U extends AxiosRequestConfig>(userOptions: U): Promise<IResponse<T, U>> {
    this.logger.debug("PicGoRequest before request, userOptions", userOptions)
    const that = this

    // handle options
    this.options.proxy = this.handleProxy()
    this.options.headers = userOptions.headers || {}
    this.options.maxBodyLength = Infinity
    this.options.maxContentLength = Infinity

    this.logger.debug("PicGoRequest start request, options", this.options)
    const instance = axios.create(this.options)
    instance.interceptors.response.use(responseInterceptor, responseErrorHandler)
    // handle Content-Type
    instance.interceptors.request.use(function (obj) {
      // handle Content-Type
      let contentType = ""
      if (obj?.headers?.contentType) {
        contentType = obj.headers.contentType as string
        delete obj.headers.contentType
      } else if (obj?.headers?.ContentType) {
        contentType = obj.headers.ContentType as string
        delete obj.headers.ContentType
      } else if (obj?.headers?.["content-type"]) {
        contentType = obj.headers["content-type"] as string
        delete obj.headers["content-type"]
      }
      if (contentType !== "" && obj.headers) {
        obj.headers["Content-Type"] = contentType
      }

      that.logger.debug("PicGoRequest request interceptor, obj", obj)
      return obj
    })

    // compatible with old request options to new options
    let opt = requestInterceptor(userOptions)

    // handle proxy
    //
    // 浏览器环境未配置代理 或者 配置了必须使用代理
    // userOptions.proxy = true | undefined
    const isBrowserUseSiyuanProxy = !hasNodeEnv && userOptions.proxy !== false
    // Node 环境配置了必须使用代理
    // userOptions.proxy = true
    const isNodeUseSiyuanProxy = hasNodeEnv && (userOptions.proxy as boolean)
    const isUseSiyuanProxy = isBrowserUseSiyuanProxy || isNodeUseSiyuanProxy
    if (isSiyuanProxyAvailable(this.siyuanProxy) && isUseSiyuanProxy) {
      // 处理思源笔记代理
      this.logger.debug("opt =>", opt)
      opt = await siyuanProxyInterceptor(this.siyuanProxy, opt)
      this.logger.debug("newopt =>", opt)

      // 处理返回值
      const siyuanResp = await instance.request(opt)
      this.logger.debug("siyuanResp =>", siyuanResp)
      if (siyuanResp.status !== 200 || siyuanResp.data.code !== 0) {
        this.logger.error(`siyuanProxy request error with proxy ${this.siyuanProxy}, siyuanResp =>`, siyuanResp)
        throw new Error(`siyuanProxy request error, msg => ${siyuanResp.data.msg}`)
      }

      const userRespData = siyuanResp.data.data
      this.logger.debug("userRespData =>", userRespData)

      let respBody = userRespData.body
      switch (userRespData.bodyEncoding) {
        case "base64":
          respBody = CodingUtil.decodeBase64(respBody)
          break
        case "hex":
          respBody = CodingUtil.decodeHex(respBody)
          break
      }
      const respContentType = userRespData.contentType
      switch (respContentType) {
        case "application/json":
          respBody = safeParse(respBody.toString())
          break
        case "application/json; charset=utf-8":
          respBody = safeParse(respBody.toString())
          break
        case "application/xml":
          respBody = respBody.toString()
          break
        case "text/html":
          respBody = respBody.toString()
          break
      }
      if (userOptions.responseType === "json") {
        respBody = safeParse(respBody.toString())
      }
      if (userOptions.responseType === "text") {
        respBody = respBody.toString()
      }
      // add code if resp is null
      if (typeof respBody === "string" && respBody.trim() === "") {
        respBody = `request error, code ${userRespData.status}`
      }
      this.logger.debug("respBody =>", respBody)

      if ("resolveWithFullResponse" in userOptions && userOptions.resolveWithFullResponse) {
        return {
          statusCode: userRespData.status,
          response: {
            body: respBody,
          },
          body: respBody,

          // AxiosResponse
          headers: userRespData.headers,
          status: userRespData.status,
          statusText: "",
          data: respBody,
          config: siyuanResp.config,   // just a placeholder, don't use it
          request: siyuanResp.request, // just a placeholder, don't use it
        } as any
      } else {
        let customResp: any

        // use old request option format
        if (opt.__isOldOptions) {
          if ("json" in userOptions) {
            if (userOptions.json) {
              customResp = respBody
            }
          } else {
            customResp = typeof respBody === "string" ? respBody : JSON.stringify(respBody)
          }
        } else {
          // new resp
          if (userOptions.responseType === "json") {
            customResp = typeof respBody === "string" ? safeParse(respBody) : respBody
          } else if (userOptions.responseType === "text") {
            customResp = typeof respBody === "string" ? respBody : JSON.stringify(respBody)
          } else {
            customResp = respBody
          }
        }
        return customResp
      }
    } else {
      if (!hasNodeEnv && userOptions.proxy !== false) {
        if (!this.proxy || this.proxy.trim() === "") {
          throw new Error(this.ctx.i18n.translate<ILocalesKey>("CORS_ANYWHERE_REQUIRED"))
        }
        if (opt.url?.includes("127.0.0.1") || opt.url?.includes("localhost")) {
          // 本地地址需要配置本地代理才启用
          if (this.proxy?.includes("127.0.0.1") || this.proxy?.includes("localhost")) {
            opt.url = browserPathJoin(this.proxy, opt.url ?? "")
          } else {
            throw new Error(this.ctx.i18n.translate<ILocalesKey>("CORS_ANYWHERE_REQUIRED_LOCALHOST"))
          }
        } else {
          opt.url = browserPathJoin(this.proxy, opt.url ?? "")
        }
      }

      if ("resolveWithFullResponse" in userOptions && userOptions.resolveWithFullResponse) {
        const resp = (await instance.request(opt)) as Promise<IResponse<T, U>>
        that.logger.debug("PicGoRequest request interceptor resolveWithFullResponse, resp", resp)
        return resp
      } else {
        return instance.request(opt).then((res) => {
          let customResp: any

          // use old request option format
          if (opt.__isOldOptions) {
            if ("json" in userOptions) {
              if (userOptions.json) {
                customResp = res.data
              }
            } else {
              customResp = JSON.stringify(res.data)
            }
          } else {
            // new resp
            if (userOptions.responseType === "json") {
              customResp = res.data
            } else if (userOptions.responseType === "text") {
              customResp = JSON.stringify(res.data)
            } else {
              customResp = res.data
            }
          }
          that.logger.debug("PicGoRequest request interceptor oldRequest, oldResp", customResp)
          return customResp
        }) as Promise<IResponse<T, U>>
      }
    }
  }
}

export { PicGoRequestWrapper }
