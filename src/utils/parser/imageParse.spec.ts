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

import { describe, it } from "vitest"
import { ImageParser } from "~/src/utils/parser/imageParser"
import { ParsedImage, PicgoPostApi } from "~/src"
import { useSiyuanApi } from "~/src/composables/useSiyuanApi.ts"

describe("test imageParser", () => {
  it("test parseImagesToArray", async () => {
    const { kernelApi } = useSiyuanApi()

    const siyuanApi = kernelApi
    const imageParser = new ImageParser()
    const picgoPostApi = new PicgoPostApi()

    const pageId = "20230810225224-zpeipef"
    const md = `
​![image](assets/image-20230810225235-fdkcky0.png)

大风歌V的覆盖的发

‍

​![image](assets/image-20230810233815-92emvkt.png)​​

地方个地

‍

​![image](assets/image-20230811154614-oh2revw.png)​`
    const attrs = await siyuanApi.getBlockAttrs(pageId)

    let retImgs: ParsedImage[] = []
    const parsedImages = imageParser.parseImagesToArray(md)
    retImgs = [...new Set([...retImgs, ...parsedImages])]
    console.log("retImgs=>", retImgs)

    const imageItemArray = await picgoPostApi.doConvertImagesToImagesItemArray(attrs, retImgs)
    console.log("imageItemArray=>", imageItemArray)
  })
})
