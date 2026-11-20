/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { describe, expect, it } from "vitest"
import { ImageItem } from "../models/ImageItem"
import { ImageParser } from "./ImageParser"

describe("test ImageParser", (): void => {
  const imageParser = new ImageParser()

  it("test parseRemoteImagesToArray", () => {
    const testMarkdownText = `
这是一段包含多个图片链接的 Markdown 文本：

![image1](http://example.com/image1.png)
![image2](http://example.com/image2.jpg "Image 2")
`
    console.log(imageParser.parseRemoteImagesToArray(testMarkdownText))
  })

  it("should parse a single image link without title and attributes", () => {
    const markdownText = "![Cat](https://example.com/cat.png)"
    const parsedImages = imageParser.parseRemoteImagesToArray(markdownText)
    console.log(parsedImages)
  })

  it("should parse a single image link with title", () => {
    const markdownText = '![Dog](https://example.com/dog.jpg "A dog in the park")'
    const parsedImages = imageParser.parseRemoteImagesToArray(markdownText)
    console.log(parsedImages)
  })

  it("should parse a single image link with attributes", () => {
    const markdownText = "![Fish](https://example.com/fish.gif){width=200 height=150}"
    const parsedImages = imageParser.parseRemoteImagesToArray(markdownText)
    console.log(parsedImages)
  })

  it("should parse multiple image links with different variations", () => {
    const markdownText = `
      ![Cat](https://example.com/cat.png)
      ![Dog](https://example.com/dog.jpg "A dog in the park")
      ![Fish](https://example.com/fish.gif){width=200 height=150}
      ![Bird](https://example.com/bird.png)
      ![Elephant](https://example.com/elephant.jpg "An elephant in the jungle"){size=large}
    `
    const parsedImages = imageParser.parseRemoteImagesToArray(markdownText)
    console.log(parsedImages)
  })

  it("should parse a single image link with attributes including style and parent-style", () => {
    const markdownText =
      '![image](http://127.0.0.1:9000/terwer/2024/04/0d4a9411355ee55c9d1c291518a6a911.png){: style="width: 10000px;" parent-style="width: 25%;"}![image](assets/image-20240418183933-4j07a4e.png)'
    const parsedRemoteImages = imageParser.parseRemoteImagesToArray(markdownText)
    console.log("parsedRemoteImages =>", parsedRemoteImages)
    const parsedLocalImages = imageParser.parseLocalImagesToArray(markdownText)
    console.log("parsedLocalImages =>", parsedLocalImages)
  })

  // ===================================================================================================================

  it("test parseLocalImagesToArray", () => {
    const testMarkdownText = `这是一段包含多个本地图片链接的 Markdown 文本：
      ![image1](assets/image1.png)
      ![image2](assets/image2.jpg "Image 2")
    `
    console.log(imageParser.parseLocalImagesToArray(testMarkdownText))
  })

  it("replaces every local image when multiple images share a table line", () => {
    const a = new ImageItem("assets/a.png", "https://bed/a.png", false, "a", "")
    const b = new ImageItem("assets/b.png", "https://bed/b.png", false, "b", "")
    const replaceMap = { [a.hash]: a, [b.hash]: b }
    const markdown = "|图片|主键|\n| --- | --- |\n|![a](assets/a.png) ![b](assets/b.png)|x|"

    const result = imageParser.replaceImagesWithImageItemArray(markdown, replaceMap)

    expect(result).toContain("![a](https://bed/a.png)")
    expect(result).toContain("![b](https://bed/b.png)")
    expect(result).not.toContain("assets/")
  })

  it("keeps the original image when it has no uploaded mapping", () => {
    const markdown = "![a](assets/a.png)"

    const result = imageParser.replaceImagesWithImageItemArray(markdown, {})

    expect(result).toBe(markdown)
  })

  it("preserves the image title when replacing the link", () => {
    const a = new ImageItem("assets/a.png", "https://bed/a.png", false, "a", "")
    const markdown = '![a](assets/a.png "caption")'

    const result = imageParser.replaceImagesWithImageItemArray(markdown, { [a.hash]: a })

    expect(result).toBe('![a](https://bed/a.png "caption")')
  })
})
