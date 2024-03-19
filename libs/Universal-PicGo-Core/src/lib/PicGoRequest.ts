/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 *
 */

import { AxiosRequestConfig } from "axios"
import { IResponse } from "../types"
import { simpleLogger } from "zhi-lib-base"

const logger = simpleLogger("picgo-request", "universal-picgo")

// #64 dynamic get proxy value
/**
 * PicGo 统一请求封装，基于 axios
 *
 * @param options
 * @constructor
 */
function PicGoRequest<T, U extends AxiosRequestConfig>(options: U): Promise<IResponse<T, U>> {
  logger.info("PicGoRequest start request", options)
  throw new Error("PicGoRequest is not implemented")
}

export { PicGoRequest }
