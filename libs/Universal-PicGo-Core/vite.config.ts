/// <reference types="vitest" />

import { resolve } from "path"
import { defineConfig, loadEnv } from "vite"
import { viteStaticCopy } from "vite-plugin-static-copy"
import dts from "vite-plugin-dts"
import minimist from "minimist"
import livereload from "rollup-plugin-livereload"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import fs from "fs"

// methods start
const packageJson = fs.readFileSync("./package.json").toString()
const pkg = JSON.parse(packageJson) || {}

const getAppBase = (): string => {
  return "/plugins/siyuan-plugin-picgo/"
}

const getDefineEnv = (isDevMode: boolean) => {
  const mode = process.env.NODE_ENV
  const isTest = mode === "test"
  console.log("isServe=>", isServe)
  console.log("mode=>", mode)

  const defaultEnv = {
    DEV_MODE: `${isDevMode || isTest}`,
    APP_BASE: `${appBase}`,
    NODE_ENV: "development",
    PICGO_VERSION: pkg.version,
  }
  const env = loadEnv(mode, process.cwd())
  const processEnvValues = {
    "process.env": Object.entries(env).reduce((prev, [key, val]) => {
      return {
        ...prev,
        [key]: val,
      }
    }, defaultEnv),
  }
  const defineEnv = {
    ...processEnvValues,
    ...{},
  }
  console.log("defineEnv=>", defineEnv)

  return defineEnv
}
// methods end

const args = minimist(process.argv.slice(2))
const isServe = process.env.IS_SERVE
const isWatch = args.watch || args.w || false
const isDev = isServe || isWatch
const devDistDir = "./dist"
const distDir = isWatch ? devDistDir : "./dist"
const appBase = getAppBase()

console.log("isWatch=>", isWatch)
console.log("distDir=>", distDir)

export default defineConfig({
  plugins: [
    dts(),

    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }) as any,

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

  base: "",

  // https://github.com/vitejs/vite/issues/1930
  // https://vitejs.dev/guide/env-and-mode.html#env-files
  // https://github.com/vitejs/vite/discussions/3058#discussioncomment-2115319
  // 在这里自定义变量
  define: getDefineEnv(isDev),

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
      // fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      plugins: [...(isWatch ? [livereload(devDistDir)] : [])] as any,
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
