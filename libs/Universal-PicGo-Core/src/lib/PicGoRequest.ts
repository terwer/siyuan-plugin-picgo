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
import { eventBus } from "../utils/eventBus"
import { IBusEvent } from "../utils/enums"
import { browserPathJoin } from "../utils/browserUtils"
import { hasNodeEnv } from "universal-picgo-store"
import { ILocalesKey } from "../i18n/zh-CN"

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

class PicGoRequestWrapper {
  private readonly ctx: IPicGo
  private readonly logger: ILogger
  private proxy: Undefinable<string> = ""
  private options: AxiosRequestConfig<any> = {}

  constructor(ctx: IPicGo) {
    this.ctx = ctx
    this.logger = ctx.getLogger("picgo-request")

    this.init()
    eventBus.on(IBusEvent.CONFIG_CHANGE, (data: IConfigChangePayload<string | IConfig["picBed"]>) => {
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
    if (proxy) {
      this.proxy = proxy
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

    // handle options
    this.options.proxy = this.handleProxy()
    this.options.headers = userOptions.headers || {}
    this.options.maxBodyLength = Infinity
    this.options.maxContentLength = Infinity

    this.logger.debug("PicGoRequest start request, options", this.options)
    const instance = axios.create(this.options)
    instance.interceptors.response.use(responseInterceptor, responseErrorHandler)

    // compatible with old request options to new options
    const opt = requestInterceptor(userOptions)
    if (!hasNodeEnv) {
      if (!this.proxy || this.proxy.trim() === "") {
        throw new Error(this.ctx.i18n.translate<ILocalesKey>("CORS_ANYWHERE_REQUIRED"))
      }
      opt.url = browserPathJoin(this.proxy, opt.url ?? "")
    }

    const that = this
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
    if ("resolveWithFullResponse" in userOptions && userOptions.resolveWithFullResponse) {
      const resp = (await instance.request(opt)) as Promise<IResponse<T, U>>
      that.logger.debug("PicGoRequest request interceptor resolveWithFullResponse, resp", resp)
      return resp
    } else {
      return instance.request(opt).then((res) => {
        // use old request option format
        let oldResp: any
        if (opt.__isOldOptions) {
          if ("json" in userOptions) {
            if (userOptions.json) {
              oldResp = res.data
            }
          } else {
            oldResp = JSON.stringify(res.data)
          }
        } else {
          oldResp = res.data
        }
        that.logger.debug("PicGoRequest request interceptor oldRequest, oldResp", oldResp)
        return oldResp
      }) as Promise<IResponse<T, U>>
    }
  }
}

export { PicGoRequestWrapper }
