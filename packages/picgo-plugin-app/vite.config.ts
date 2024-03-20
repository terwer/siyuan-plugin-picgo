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
import livereload from "rollup-plugin-livereload"
import minimist from "minimist"
import fg from "fast-glob"
import { createHtmlPlugin } from "vite-plugin-html"
import path from "path"
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"

// config
const args = minimist(process.argv.slice(2))
// 开启之后可以同eruda接管日志
const isServe = process.env.IS_SERVE
const isWatch = args.watch || args.w || false
const isDev = isServe || isWatch
const outDir = args.o || args.outDir

const distDir = "../../artifacts/siyuan-plugin-picgo/dist"

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [
    vue(),

    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),

    createHtmlPlugin({
      minify: !isDev,
      inject: {
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

  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./"),
      "@": path.resolve(__dirname, "./src/"),
      $routes: path.resolve(__dirname, "./src/routes"),
      $pages: path.resolve(__dirname, "./src/pages"),
      $lib: path.resolve(__dirname, "./src/lib"),
      $assets: path.resolve(__dirname, "./src/assets"),
      $components: path.resolve(__dirname, "./src/components"),
      $composables: path.resolve(__dirname, "./src/composables"),
    },
  },

  build: {
    // 输出路径
    outDir: outDir || distDir,
    emptyOutDir: false,

    // 构建后是否生成 source map 文件
    sourcemap: false,

    // 设置为 false 可以禁用最小化混淆
    // 或是用来指定是应用哪种混淆器
    // boolean | 'terser' | 'esbuild'
    // 不压缩，用于调试
    minify: !isDev,

    rollupOptions: {
      plugins: [
        ...(isWatch
          ? [
              livereload(distDir),
              {
                //监听静态资源文件
                name: "watch-external",
                async buildStart() {
                  const files = await fg(["src/assets/*", "./README*.md", "./widget.json"])
                  for (const file of files) {
                    const that = this as any
                    that.addWatchFile(file)
                  }
                },
              },
            ]
          : []),
      ] as any,

      // make sure to externalize deps that shouldn't be bundled into your library
      external: [],
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    // environment: "node",
    // environment: "happy-dom",
    setupFiles: ["./src/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "utils/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    server: {
      deps: {
        inline: ["element-plus"],
      },
    },
  },
}))
