/*
 * Copyright (c) 2023, Terwer . All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 2 only, as
 * published by the Free Software Foundation.  Terwer designates this
 * particular file as subject to the "Classpath" exception as provided
 * by Terwer in the LICENSE file that accompanied this code.
 *
 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 *
 * You should have received a copy of the GNU General Public License version
 * 2 along with this work; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * Please contact Terwer, Shenzhen, Guangdong, China, youweics@163.com
 * or visit www.terwer.space if you need additional information or have any
 * questions.
 */

import { fileOpen, FileWithHandle } from "browser-fs-access"

/**
 * 下载json文件
 *
 * @param json json字符串
 * @param filename 下载文件名
 */
export const downloadFileFromJson = (json: string, filename?: string): void => {
  // Create a new Blob with the JSON string as its contents
  const blob = new Blob([json], { type: "application/json" })

  // Create a download link for the JSON file
  const link = document.createElement("a")
  link.download = filename ?? "data.json"
  link.href = URL.createObjectURL(blob)

  // Add the download link to the page
  document.body.appendChild(link)

  // Click the download link to download the JSON file
  link.click()
}

const readJSONFileFormDialog = async (): Promise<FileWithHandle[]> => {
  return await fileOpen({
    description: "JSON files",
    mimeTypes: ["application/json"],
    extensions: [".json"],
    multiple: true,
  })
}

/**
 * 导入JSON数据
 *
 * @param callback 回调
 */
export const importJSONData = async (callback) => {
  // Open a file dialog and select a file
  const files = await readJSONFileFormDialog()

  // Create a FileReader to read the file
  const reader = new FileReader() as any

  // When the file has been read, log the contents to the console
  reader.addEventListener("load", () => {
    // Parse the JSON string to a JavaScript object
    const data = JSON.parse(reader.result)

    console.log("准备导入配置，读取到的配置数据为=>", data)
    callback(data)
  })

  // Read the file as a string of text
  reader.readAsText(files[0])
}
