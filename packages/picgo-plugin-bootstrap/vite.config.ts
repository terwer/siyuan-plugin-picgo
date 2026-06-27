/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { cpSync, existsSync, mkdirSync } from "fs"
import { resolve } from "path"
import { defineConfig } from "vite"
import minimist from "minimist"
import livereload from "rollup-plugin-livereload"
import fg from "fast-glob"

const args = minimist(process.argv.slice(2))
const isWatch = args.watch || args.w || false
const distDir = "../../artifacts/siyuan-plugin-picgo/dist"

console.log("isWatch=>", isWatch)
console.log("distDir=>", distDir)

const staticCopyTargets = [
  { src: "../../README.md", dest: "./" },
  { src: "../../README_zh_CN.md", dest: "./" },
  { src: "../../LICENSE", dest: "./" },
  { src: "../../icon.png", dest: "./" },
  { src: "../../preview.png", dest: "./" },
  { src: "../../plugin.json", dest: "./" },
]

// Copy entire i18n directory (globbed by fast-glob)
const copyI18nAssets = () => ({
  name: "copy-i18n-assets",
  async closeBundle() {
    const fg = await import("fast-glob")
    const files = await fg.default("src/i18n/**", { cwd: __dirname, absolute: false })
    for (const file of files) {
      const src = resolve(__dirname, file)
      const dest = resolve(__dirname, distDir, "i18n", file.replace("src/i18n/", ""))
      const destDir = resolve(dest, "..")
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true })
      }
      cpSync(src, dest)
    }
  },
})

const copyStaticAssets = () => ({
  name: "copy-plugin-assets",
  closeBundle() {
    for (const target of staticCopyTargets) {
      const src = resolve(__dirname, target.src)
      const dest = resolve(__dirname, distDir, target.dest, src.split("/").pop()!)
      const destDir = resolve(dest, "..")
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true })
      }
      cpSync(src, dest)
    }
  },
})

export default defineConfig({
  plugins: [copyStaticAssets(), copyI18nAssets()],

  // https://github.com/vitejs/vite/issues/1930
  // https://vitejs.dev/guide/env-and-mode.html#env-files
  // https://github.com/vitejs/vite/discussions/3058#discussioncomment-2115319
  // 在这里自定义变量
  define: {
    "process.env.DEV_MODE": `"${isWatch}"`,
    "process.env.NODE_ENV": isWatch ? `"development"` : `"production"`,
  },

  build: {
    // 输出路径
    outDir: distDir,
    emptyOutDir: false,

    // 构建后是否生成 source map 文件
    sourcemap: false,

    // 设置为 false 可以禁用最小化混淆
    // 或是用来指定是应用哪种混淆器
    // boolean | 'terser' | 'esbuild'
    // 不压缩，用于调试
    minify: !isWatch,

    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/index.ts"),
      // the proper extensions will be added
      fileName: "index",
      formats: ["cjs"],
    },
    rollupOptions: {
      plugins: [
        ...(isWatch
          ? [
              livereload(distDir),
              {
                //监听静态资源文件
                name: "watch-external",
                async buildStart() {
                  const files = await fg(["src/i18n/*.json", "../../README*.md", "../../plugin.json"])
                  for (const file of files) {
                    this.addWatchFile(file)
                  }
                },
              },
            ]
          : []),
      ] as any,

      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["siyuan", "process"],

      output: {
        entryFileNames: "[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") {
            return "index.css"
          }
          return assetInfo.name
        },
      },
    },
  },
})
