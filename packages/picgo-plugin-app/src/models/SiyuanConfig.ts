/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * 思源笔记配置
 *
 * @author terwer
 * @since 1.0.0
 */
class SiyuanConfig {
  /**
   * 思源笔记伺服地址
   */
  public apiUrl = ""

  /**
   * 思源笔记 API token
   */
  public password = ""

  /**
   * 请求 cookie
   */
  public cookie = ""

  constructor(apiUrl?: string, password?: string) {
    this.apiUrl = apiUrl ?? "http://127.0.0.1:6806"
    this.password = password ?? ""
  }
}

export default SiyuanConfig
