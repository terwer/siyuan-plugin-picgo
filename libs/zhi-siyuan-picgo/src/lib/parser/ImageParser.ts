/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { ParsedImage } from "../models/ParsedImage"
import { ImageItem } from "../models/ImageItem"

/**
 * 图片解析器
 *
 * 自动解析文章中的img标签，
 * 自动处理src外链、base64数据
 *
 * @author terwer
 * @since 0.1.0
 */
export class ImageParser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_isDev?: boolean) {}

  /**
   * 检测是否有外链图片
   *
   * @param content 文章正文
   */
  public hasExternalImages(content: string): boolean {
    const flag = false

    const imgRegex = /!\[.*]\((http|https):\/.*\/.*\)/g
    const matches = content.match(imgRegex)
    if (matches != null && matches.length > 0) {
      return true
    }

    const imgBase64Regex = /!\[.*]\((data:image):\/.*\/.*\)/g
    const base64Matches = content.match(imgBase64Regex)
    if (base64Matches != null && base64Matches.length > 0) {
      return true
    }

    return flag
  }

  /**
   * 剔除外链图片
   *
   * @param content 文章正文
   */
  public removeImages(content: string): string {
    let newcontent = content

    newcontent = newcontent.replace(/!\[.*]\((http|https):\/.*\/.*\)/g, "")

    return newcontent
  }

  /**
   * 解析图片块为图片链接
   *
   * @param content 图片块
   * @private
   */
  public parseImagesToArray(content: string): ParsedImage[] {
    const remoteImages = this.parseRemoteImagesToArray(content)
    const localImages = this.parseLocalImagesToArray(content)

    // 按 URL 去重，避免同一张图片被重复上传。
    const seenUrls = new Set<string>()
    const ret: ParsedImage[] = []
    for (const image of [...remoteImages, ...localImages]) {
      if (seenUrls.has(image.url)) {
        continue
      }
      seenUrls.add(image.url)
      ret.push(image)
    }

    return ret
  }

  // /**
  //  * 解析图片块为远程图片链接
  //  *
  //  * @param markdownText 图片块
  //  * @private
  //  */
  // public parseRemoteImagesToArray(markdownText: string): ParsedImage[] {
  //   this.logger.debug("准备解析文本中的远程图片=>", markdownText)
  //   // 定义正则表达式来匹配以 http 或 https 开头的 Markdown 格式的图片链接
  //   // 只能匹配有属性和备注的情况
  //   // const regex = /!\[(.*?)\]\(((https|http|ftp)?:\/\/[^\s/$.?#].[^\s]*)\s*"(.*?)"\)\s*{:\s*([^\n]*)}/g
  //   // 同时兼容有属性和没有属性的情况
  //   const regex = /!\[(.*?)\]\((https?:\/\/\S+\.(?:jpe?g|png|gif))(?:\s+"(?:[^"\\]|\\.)*")?\s*(?:{:\s*([^\n]*)})?\)/g
  //
  //   // 匹配普通图片链接：
  //   // ![Cat](https://example.com/cat.png)
  //   // 匹配结果:
  //   // match[1]: "Cat"
  //   // match[2]: "https://example.com/cat.png"
  //   // match[3]: undefined
  //
  //   // 匹配带注释的图片链接：
  //   // ![Dog](https://example.com/dog.jpg "A dog in the park")
  //   // 匹配结果：
  //   // match[1]: "Dog"
  //   // match[2]: "https://example.com/dog.jpg"
  //   // match[3]: "A dog in the park"
  //
  //   // 匹配带属性的图片链接：
  //   // ![Fish](https://example.com/fish.gif){width=200 height=150}
  //   // 匹配结果：
  //   // match[1]: "Fish"
  //   // match[2]: "https://example.com/fish.gif"
  //   // match[3]: "width=200 height=150"
  //
  //   // 使用正则表达式来匹配 Markdown 格式的图片链接，并提取其中的各个属性
  //   const ParsedImages = []
  //   for (const match of markdownText.matchAll(regex)) {
  //     const altText = match[1] ? match[1] : ""
  //     const url = match[2] ? match[2] : ""
  //     const title = match[3] ? match[3].replace(/"/g, "") : ""
  //
  //     // 将图片链接的各个属性封装成一个对象，并添加到数组中
  //     ParsedImages.push({
  //       url,
  //       alt: altText,
  //       title,
  //       isLocal: false,
  //     })
  //   }
  //   this.logger.debug("远程图片解析完毕.", ParsedImages)
  //   return ParsedImages
  // }

  public parseRemoteImagesToArray(markdownText: string): ParsedImage[] {
    // 不再要求图片地址必须带常见扩展名：外链图床经常使用无扩展名地址或
    // 带查询参数的地址（如 ?imageView2/...）。是否真的是图片由 PicGo 下载时校验。
    const regex = /!\[([^\]]*)\]\(\s*(https?:\/\/[^\s)]+)(?:\s+["']([^"']*)["'])?\s*(?:\{([^}]*)\})?\s*\)/g

    const parsedImages: ParsedImage[] = []
    let match

    while ((match = regex.exec(markdownText)) !== null) {
      const altText = match[1] ? match[1] : ""
      const url = match[2] ? match[2] : ""
      const title = match[3] ? match[3] : ""

      parsedImages.push({
        url,
        alt: altText,
        title,
        isLocal: false,
        blockId: "",
      })
    }

    return parsedImages
  }

  // /**
  //  * 解析图片块为本地图片链接
  //  *
  //  * @param markdownText 图片块
  //  */
  // public parseLocalImagesToArray(markdownText: string): ParsedImage[] {
  //   this.logger.debug("准备解析文本中的本地图片=>", markdownText)
  //
  //   // 定义正则表达式来匹配以 assets 开头但不以 http、https 或 ftp 开头的 Markdown 格式的图片链接
  //   // const regex = /!\[(.*?)\]\(((?!http|https|ftp)assets\/.*?)\s*("(?:.*[^"])")?\)\s*(\{(?:.*[^"])})?/g
  //   const regex = /!\[(.*?)\]\(((?!http|https|ftp)assets\/.*?)\s*("(?:[^"\\]|\\.)*")?\s*(\{(?:[^"\\]|\\.)*\})?\)/g
  //   // 这样的正则表达式可以同时匹配到以下格式的图片链接：
  //   // ![图片](assets/image.png)
  //   // ![带注释的图片](assets/image.png "注释")
  //   // ![带属性的图片](assets/image.png){width=100 height=200}
  //
  //   // 使用正则表达式来匹配 Markdown 格式的图片链接，并提取其中的各个属性
  //   const ParsedImages = []
  //   for (const match of markdownText.matchAll(regex)) {
  //     const altText = match[1] ? match[1] : ""
  //     const url = match[2] ? match[2] : ""
  //     const title = match[3] ? match[3].replace(/"/g, "") : ""
  //
  //     // 将图片链接的各个属性封装成一个对象，并添加到数组中
  //     ParsedImages.push({
  //       url,
  //       alt: altText,
  //       title,
  //       isLocal: true,
  //     })
  //   }
  //   this.logger.debug("本地图片解析完毕.", ParsedImages)
  //   return ParsedImages
  // }
  public parseLocalImagesToArray(markdownText: string): ParsedImage[] {

    // 定义正则表达式来匹配以 assets 开头但不以 http、https 或 ftp 开头的 Markdown 格式的图片链接
    const regex = /!\[([^[\]]*)]\((assets\/.*?)\s*(?:(?:"([^"]*)")|(?:'([^']*)'))?\)/g

    // 使用正则表达式来匹配 Markdown 格式的图片链接，并提取其中的各个属性
    const parsedImages: ParsedImage[] = []
    let match

    while ((match = regex.exec(markdownText)) !== null) {
      const altText = match[1] ? match[1] : "" // 使用匹配到的第一个括号内的文本作为 alt 文本

      const url = match[2] ? match[2] : ""
      const title = match[3] ? match[3] : match[4] ? match[4] : ""

      // 将图片链接的各个属性封装成一个对象，并添加到数组中
      parsedImages.push({
        url,
        alt: altText,
        title,
        isLocal: true,
        blockId: "",
      })
    }

    return parsedImages
  }

  /**
   * 将外链外链图片替换为图床链接
   *
   * @param content 正文
   * @param replaceMap 替换信息
   */
  public replaceImagesWithImageItemArray(content: string, replaceMap: any): string {
    if (!content || !replaceMap) {
      return content
    }

    // 一次只匹配一张本地图片，不能使用贪婪的 /!\[.*]\(assets\/.*\..*\)/g：
    // 数据库资源单元格里可能同时有多张图片，贪婪匹配会把整行当成一张图片，
    // 替换后只保留最后一张（publisher #1999）。
    const localImageRegex = /!\[([^[\]]*)\]\((assets\/.*?)\s*(?:(?:"([^"]*)")|(?:'([^']*)'))?\)/g

    return content.replace(
      localImageRegex,
      (match: string, alt: string, url: string, doubleQuotedTitle?: string, singleQuotedTitle?: string) => {
        const tempImageItem = new ImageItem(url, "", true)
        const replaceImageItem: ImageItem = replaceMap[tempImageItem.hash]
        // 没有映射或上传失败（isLocal 仍为 true）时保留原图，不能替换成 undefined。
        if (!replaceImageItem || replaceImageItem.isLocal || !replaceImageItem.url) {
          return match
        }

        const title = doubleQuotedTitle ?? singleQuotedTitle ?? ""
        const newAlt = replaceImageItem.alt || alt || ""
        if (title) {
          return `![${newAlt}](${replaceImageItem.url} "${title}")`
        }
        return `![${newAlt}](${replaceImageItem.url})`
      }
    )
  }

  /**
   * 将已上传的外链图片替换为图床链接。
   *
   * 本地图片由 {@link replaceImagesWithImageItemArray} 处理；外链图片没有
   * `assets/` 前缀，需要按原始 URL 精确替换。只替换上传成功（isLocal 已变为 false）
   * 且地址确实变化的条目，失败时保留原链接。
   *
   * @param content 正文
   * @param items 图片列表
   */
  public replaceRemoteImagesWithImageItemArray(content: string, items: ImageItem[]): string {
    if (!content || !items || items.length === 0) {
      return content
    }

    let result = content
    // 先替换更长的 URL，避免一个 URL 是另一个 URL 前缀时被提前替换。
    const replaceable = items
      .filter((item) => item && !item.isLocal && item.originUrl && item.url && item.originUrl !== item.url)
      .sort((left, right) => right.originUrl.length - left.originUrl.length)

    for (const item of replaceable) {
      result = result.split(item.originUrl).join(item.url)
    }

    return result
  }

  /**
   * 下载图片到本地并打包成zip
   *
   * @@deprecated 不再支持
   */
  // public async downloadMdWithImages(): Promise<void> {}

  /**
   * 下载图片到本地并保存到思源
   *
   * @deprecated 思源笔记已经有此功能
   */
  // public async downloadImagesToSiyuan(): Promise<void> {
  //   throw new Error("思源笔记已经有此功能，无需重新实现")
  // }
}
