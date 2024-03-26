/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { Mac } from "./digest"
import { util } from "./util"

// 用于与旧 SDK 版本兼容
function _putPolicyBuildInKeys(): string[] {
  return [
    "scope",
    "isPrefixalScope",
    "insertOnly",
    "saveKey",
    "forceSaveKey",
    "endUser",
    "returnUrl",
    "returnBody",
    "callbackUrl",
    "callbackHost",
    "callbackBody",
    "callbackBodyType",
    "callbackFetchKey",
    "persistentOps",
    "persistentNotifyUrl",
    "persistentPipeline",
    "fsizeLimit",
    "fsizeMin",
    "detectMime",
    "mimeLimit",
    "deleteAfterDays",
    "fileType",
  ]
}

/**
 * 上传策略
 * @link https://developer.qiniu.com/kodo/manual/1206/put-policy
 */
class PutPolicy {
  private readonly expires: number

  constructor(options: any) {
    if (typeof options !== "object") {
      throw new Error("invalid putpolicy options")
    }

    const that = this as any
    Object.keys(options).forEach((k) => {
      if (k === "expires") {
        return
      }
      that[k] = options[k]
    })

    this.expires = options.expires || 3600
    _putPolicyBuildInKeys().forEach((k) => {
      if ((this as any)[k] === undefined) {
        that[k] = that[k] || null
      }
    })
  }

  getFlags(): any {
    const that = this as any
    const flags: any = {}

    Object.keys(this).forEach((k) => {
      if (k === "expires" || that[k] === null) {
        return
      }
      flags[k] = that[k]
    })

    flags.deadline = this.expires + Math.floor(Date.now() / 1000)

    return flags
  }

  uploadToken(mac: Mac): string {
    const flags = this.getFlags()
    const encodedFlags = util.urlsafeBase64Encode(JSON.stringify(flags))
    const encoded = util.hmacSha1(encodedFlags, mac.secretKey)
    const encodedSign = util.base64ToUrlSafe(encoded)
    return [mac.accessKey, encodedSign, encodedFlags].join(":")
  }
}

export { PutPolicy }
