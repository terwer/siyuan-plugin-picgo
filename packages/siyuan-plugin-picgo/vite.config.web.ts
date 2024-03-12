/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2023-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import minimist from "minimist"
import { createHtmlPlugin } from "vite-plugin-html"

const args = minimist(process.argv.slice(2))
const debugMode = true
const isWatch = args.watch || args.w || false
const isDev = isWatch || debugMode

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),

    createHtmlPlugin({
      minify: !isDev,
      inject: {
        // 在 body 标签底部插入指定的 JavaScript 文件
        tags: isDev
          ? [
              {
                tag: "script",
                attrs: {
                  src: "./libs/eruda/eruda.js",
                },
                injectTo: "head-prepend",
              },
            ]
          : [],
        data: {
          title: "eruda",
          injectScript: isDev ? `<script>eruda.init();</script>` : "",
        },
      },
    }),

    {
      name: "add-query-param",
      transformIndexHtml(html) {
        const timestamp = Date.now()
        html = html.replace(/(<script.+src=")([^"]+\.js)"/g, `$1$2?v=${timestamp}"`)
        html = html.replace(/(<link[^>]+href=")([^"]+(\.css|\.js))"/g, (match, p1, p2) => `${p1}${p2}?v=${timestamp}"`)
        html = html.replace(/(<link[^>]+href=")([^"]+\.svg)"/g, `$1$2?v=${timestamp}"`)
        html = html.replace(/(<img[^>]+src=")([^"]+\.(jpe?g|gif|webp|bmp|png))"/g, `$1$2?v=${timestamp}"`)
        return html
      },
    },
  ],

  // 项目部署的基础路径
  base: "",

  // https://github.com/vitejs/vite/issues/1930
  // https://vitejs.dev/guide/env-and-mode.html#env-files
  // https://github.com/vitejs/vite/discussions/3058#discussioncomment-2115319
  // 在这里自定义变量
  define: {
    "process.env.DEV_MODE": `"${isDev}"`,
  },
})
