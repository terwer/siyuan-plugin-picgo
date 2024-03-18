/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * 获取浏览器目录
 *
 * @param path 完整的路径
 */
export const getBrowserDirectoryPath = (path: string) => {
  const parts = path.split("/")
  parts.pop()
  return parts.join("/")
}

/**
 * 浏览器路径拼接
 *
 * @param paths 路径数组
 */
export const browserPathJoin = (...paths: string[]) => {
  // 过滤掉空路径
  const filteredPaths = paths.filter((path) => path && path.trim() !== "")

  // 使用斜杠连接路径
  const joinedPath = filteredPaths.join("/")

  // 处理多余的斜杠
  const normalizedPath = joinedPath.replace(/\/{2,}/g, "/")

  return normalizedPath
}
