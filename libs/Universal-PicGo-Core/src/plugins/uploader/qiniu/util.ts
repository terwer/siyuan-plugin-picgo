/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { Buffer } from "../../../utils/nodePolyfill"
import crypto from "crypto"

const base64ToUrlSafe = function (v: string) {
  return v.replace(/\//g, "_").replace(/\+/g, "-")
}

const urlSafeToBase64 = function (v: string) {
  return v.replace(/_/g, "/").replace(/-/g, "+")
}

// UrlSafe Base64 Decode
const urlsafeBase64Encode = function (jsonFlags: string) {
  const encoded = Buffer.from(jsonFlags).toString("base64")
  return base64ToUrlSafe(encoded)
}

// UrlSafe Base64 Decode
const urlSafeBase64Decode = function (fromStr: string) {
  return Buffer.from(urlSafeToBase64(fromStr), "base64").toString()
}

// Hmac-sha1 Crypt
const hmacSha1 = (encodedFlags: string, secretKey: string) => {
  // return value already encoded with base64
  const hmac = crypto.createHmac("sha1", secretKey)
  hmac.update(encodedFlags)
  return hmac.digest("base64")
}

const util = { urlsafeBase64Encode, urlSafeBase64Decode, base64ToUrlSafe, urlSafeToBase64, hmacSha1 }

export { util }
