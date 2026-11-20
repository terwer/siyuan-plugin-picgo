/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * 拖拽上传数量上限的默认值。
 *
 * 默认保持 5，避免误拖大量文件；需要批量上传时可在插件设置中调大。
 */
export const DEFAULT_MAX_UPLOAD_COUNT = 5

/**
 * 拖拽上传数量上限的可配置范围。
 */
export const MAX_UPLOAD_COUNT_LIMIT = 100

/**
 * 把配置中的拖拽上传数量上限归一化为有效值。
 *
 * 非法值（缺失、非数字、小于 1）回退到默认值，超过上限时截断到上限。
 */
export const normalizeMaxUploadCount = (value: unknown): number => {
  const count = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(count)) {
    return DEFAULT_MAX_UPLOAD_COUNT
  }

  const integer = Math.floor(count)
  if (integer < 1) {
    return DEFAULT_MAX_UPLOAD_COUNT
  }

  return Math.min(integer, MAX_UPLOAD_COUNT_LIMIT)
}
