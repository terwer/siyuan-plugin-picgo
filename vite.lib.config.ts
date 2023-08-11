import { defineConfig } from "vite"
import minimist from "minimist"
import path, { join, resolve } from "path"
import { viteStaticCopy } from "vite-plugin-static-copy"
import dts from "vite-plugin-dts"

const args = minimist(process.argv.slice(2))
const debugMode = false
const isWatch = args.watch || args.w || false
const isDev = isWatch || debugMode
const distDir = "./lib"

console.log("isWatch=>", isWatch)
console.log("debugMode=>", debugMode)
console.log("isDev=>", isDev)
console.log("distDir=>", distDir)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts({
      entryRoot: "src",
      tsconfigPath: join(__dirname, "tsconfig.json"),
    }),

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

  // 项目部署的基础路径
  base: "",

  // https://github.com/vitejs/vite/issues/1930
  // https://vitejs.dev/guide/env-and-mode.html#env-files
  // https://github.com/vitejs/vite/discussions/3058#discussioncomment-2115319
  // 在这里自定义变量
  define: {
    "process.env.DEV_MODE": `"${isWatch}"`,
  },

  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./"),
    },
  },

  build: {
    // 输出路径
    outDir: distDir,
    emptyOutDir: false,

    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "siyuanPicgoApi",
      // the proper extensions will be added
      fileName: "index",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["vue"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: "Vue",
        },
      },
    },
  },
})
