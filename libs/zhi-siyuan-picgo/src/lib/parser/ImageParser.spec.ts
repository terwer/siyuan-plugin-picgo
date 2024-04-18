/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { describe, it } from "vitest"
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
})
