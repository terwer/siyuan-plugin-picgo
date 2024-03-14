/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { isDev, siyuanApiToken, siyuanApiUrl } from "../Constants"
import { simpleLogger } from "zhi-lib-base"
import { ILogger } from "../appLogger"

/**
 * 思源 API 返回类型
 */
export interface SiyuanData {
  /**
   * 非 0 为异常情况
   */
  code: number

  /**
   * 正常情况下是空字符串，异常情况下会返回错误文案
   */
  msg: string

  /**
   * 可能为 \{\}、[] 或者 NULL，根据不同接口而不同
   */
  data: any[] | object | null | undefined
}

export class BaseApi {
  private logger: ILogger

  constructor() {
    this.logger = simpleLogger("base-api", "custom-slug", isDev)
  }

  /**
   * 以sql发送请求
   * @param sql sql
   */
  public async sql(sql: string): Promise<SiyuanData> {
    const sqldata = {
      stmt: sql,
    }
    const url = "/api/query/sql"
    return await this.siyuanRequest(url, sqldata)
  }

  /**
   * 向思源请求数据
   *
   * @param url - url
   * @param data - 数据
   */
  public async siyuanRequest(url: string, data: object): Promise<SiyuanData> {
    const reqUrl = `${siyuanApiUrl}${url}`

    const fetchOps = {
      body: JSON.stringify(data),
      method: "POST",
    }
    if (siyuanApiToken !== "") {
      Object.assign(fetchOps, {
        headers: {
          Authorization: `Token ${siyuanApiToken}`,
        },
      })
    }

    if (isDev) {
      this.logger.info("开始向思源请求数据，reqUrl=>", reqUrl)
      this.logger.info("开始向思源请求数据，fetchOps=>", fetchOps)
    }

    const response = await fetch(reqUrl, fetchOps)
    const resJson = (await response.json()) as SiyuanData
    if (isDev) {
      this.logger.info("思源请求数据返回，resJson=>", resJson)
    }
    return resJson
  }
}
