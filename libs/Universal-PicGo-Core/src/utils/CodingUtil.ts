// noinspection TypeScriptValidateJSTypes

/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { Buffer } from "./nodePolyfill"

/**
 * 提供编码和解码相关的实用方法
 *
 * @author terwer
 * @since 1.8.0
 */
class CodingUtil {
  /**
   * 编码字符串为 base64 格式
   *
   * @returns 编码后的 base64 字符串
   * @param input -  string | Uint8Array | ArrayBuffer
   */
  public static encodeToBase64String(input: any): string {
    const buffer = Buffer.from(input)
    return buffer.toString("base64")
  }

  /**
   * 解码 base64
   *
   * @returns 解码后的值
   * @param input - 要解码的 base64 字符串
   */
  public static decodeBase64(input: string): Buffer {
    return Buffer.from(input, "base64")
  }

  /**
   * 编码字符串为十六进制格式
   *
   * @param input 要编码的字符串
   * @returns 编码后的十六进制字符串
   */
  public static encodeToHexString(input: string): string {
    const buffer = Buffer.from(input)
    return buffer.toString("hex")
  }

  /**
   * 解码十六进制
   *
   * @param input 要解码的十六进制字符串
   * @returns 解码后的值
   */
  public static decodeHex(input: string): Buffer {
    return Buffer.from(input, "hex")
  }
}

export { CodingUtil }
