/// <reference types="vitest" />

import { resolve } from "path"
import { defineConfig } from "vite"
import { viteStaticCopy } from "vite-plugin-static-copy"
import dts from "vite-plugin-dts"
import minimist from "minimist"
import livereload from "rollup-plugin-livereload"

const args = minimist(process.argv.slice(2))
const isWatch = args.watch || args.w || false
const devDistDir = "./dist"
const distDir = isWatch ? devDistDir : "./dist"
// const distDir = devDistDir

console.log("isWatch=>", isWatch)
console.log("distDir=>", distDir)

export default defineConfig({
  plugins: [
    dts(),

    viteStaticCopy({
      targets: [
        {
          src: "README.md",
          dest: "./",
        },
        {
          src: "package.json",
          dest: "./",
        },
      ],
    }),
  ],

  build: {
    // 输出路径
    outDir: distDir,
    emptyOutDir: false,

    // 构建后是否生成 source map 文件
    sourcemap: false,

    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/index.ts"),
      // the proper extensions will be added
      fileName: "index",
      formats: ["cjs"],
    },
    rollupOptions: {
      plugins: [...(isWatch ? [livereload(devDistDir)] : [])],
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [],
      output: {
        entryFileNames: "[name].js",
      },
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
})
