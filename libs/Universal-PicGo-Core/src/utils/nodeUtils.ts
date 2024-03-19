/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * 实现 fs.pathExistsSync 函数
 *
 * @param fs
 * @param path
 * @param filePath
 */
export const pathExistsSync = (fs: any, path: any, filePath: string) => {
  try {
    fs.accessSync(path.join(filePath), fs.constants.F_OK)
    return true
  } catch (err: any) {
    if (err && err.code === "ENOENT") {
      return false
    } else {
      throw err
    }
  }
}

/**
 * 实现 fs.ensureFileSync 函数
 *
 * @param fs
 * @param path
 * @param filePath
 */
export const ensureFileSync = (fs: any, path: any, filePath: string) => {
  const directory = path.dirname(filePath)
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true })
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "")
  }
}

/**
 * 确保目录存在
 *
 * @param fs
 * @param dir
 */
export const ensureFolderSync = (fs: any, dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * 同步读取 JSON 文件的方法
 *
 * @param fs - fs 模块
 * @param filePath - JSON 文件路径
 * @returns  - JSON 文件内容转换后的对象，如果出错则返回空对象 {}
 */
export const readJSONSync = (fs: any, filePath: string): any => {
  try {
    const data = fs.readFileSync(filePath, "utf8")
    return JSON.parse(data)
  } catch (err: any) {
    console.error(`Error reading JSON file: ${err.message}`)
    return {}
  }
}
