/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { ILogger, simpleLogger } from "zhi-lib-base"
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
  private readonly logger: ILogger

  constructor(isDev?: boolean) {
    this.logger = simpleLogger("image-parser", "zhi-siyuan-picgo", isDev)
  }

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
    let ret = [] as ParsedImage[]
    const remoteImages = this.parseRemoteImagesToArray(content)
    const localImages = this.parseLocalImagesToArray(content)

    // 会有很多重复值
    // ret = ret.concat(remoteImages, localImages)
    // 下面的写法可以去重
    ret = [...new Set([...remoteImages, ...localImages])]

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
    this.logger.debug("准备解析文本中的远程图片=>", markdownText)

    const regex = /!\[(.*?)\]\((https?:\/\/\S+?\.(?:jpe?g|png|gif))(?:\s+"([^"]*)")?(?:{([^}]*)})?\)/g

    const parsedImages = []
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
    this.logger.debug("准备解析文本中的本地图片=>", markdownText)

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
    let newcontent = content

    const imgRegex = /!\[.*]\(assets\/.*\..*\)/g
    const matches = newcontent.match(imgRegex)
    // 没有图片，无需处理
    if (matches == null || matches.length === 0) {
      this.logger.warn("未匹配到本地图片，将不会替换图片链接")
      return newcontent
    }

    for (let i = 0; i < matches.length; i++) {
      const img = matches[i]
      this.logger.debug("img=>", img)

      const src = img.replace(/!\[.*]\(/g, "").replace(/\)/, "")
      this.logger.debug("src=>", src)
      let url
      let title
      const urlAttrs = src.split(" ")
      if (urlAttrs.length > 1) {
        url = urlAttrs[0]
        title = urlAttrs[1].replace(/"/g, "")
      } else {
        url = urlAttrs[0]
      }

      const tempImageItem = new ImageItem(url, "", true)
      const hash = tempImageItem.hash
      const replaceImageItem: ImageItem = replaceMap[hash]
      const alt = replaceImageItem?.alt ?? ""

      let newImg = `![${alt}](${replaceImageItem?.url})`
      if (title) {
        newImg = `![${alt}](${replaceImageItem?.url} "${title}")`
      }
      this.logger.debug("newImg=>", newImg)

      // 使用正则表达式和replace方法来实现replaceAll方法
      // 将search转换为正则表达式，使用g标志表示全局匹配
      //
      // 注意需要编码，否则无法替换
      // 问题说明：由于原始图片链接中包含特殊字符，如斜杠和点，这些字符在正则表达式中具有特殊含义，可能导致匹配失败。需要对原始图片链接中的特殊字符进行转义处理，以确保正则表达式能够正确匹配。
      // 修复方法：对原始图片链接中的特殊字符进行转义处理，然后再创建正则表达式进行匹配替换。
      // MDN 的解释
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#flags_in_constructor
      const escapedImg = img.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // 转义处理
      const imgRegex = new RegExp(escapedImg, "g")
      this.logger.debug("imgRegex =>", imgRegex)
      newcontent = newcontent.replace(imgRegex, newImg)
    }

    return newcontent
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
