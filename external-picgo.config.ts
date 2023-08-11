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

/**
 * 外部 Picgo 配置接口
 */
interface IExternalPicgoConfig {
  useBundledPicgo?: boolean

  /**
   * extPicgoApiUrl 是一个字符串，表示外部 Picgo API 的 URL
   */
  extPicgoApiUrl?: string

  /**
   * 其他配置项，可以是任意类型
   */
  [key: string]: any
}

/**
 * 外部 Picgo 配置实例
 */
export const ExternalPicgoConfig: IExternalPicgoConfig = {
  useBundledPicgo: true,
  extPicgoApiUrl: "http://127.0.0.1:36677",
}
