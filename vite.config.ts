import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import minimist from "minimist"
import { createHtmlPlugin } from "vite-plugin-html"
import path from "path"
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"

const args = minimist(process.argv.slice(2))
const debugMode = false
const isWatch = args.watch || args.w || false
const isDev = isWatch || debugMode
const isWindows = process.platform === "win32"
let devDistDir = "/Users/terwer/Documents/mydocs/SiYuanWorkspace/public/data/plugins/siyuan-plugin-picgo"
if (isWindows) {
  devDistDir = "C:\\Users\\terwer\\Documents\\mydocs\\SiyuanWorkspace\\public\\data\\plugins\\siyuan-plugin-picgo"
}
const distDir = isWatch ? devDistDir : "./dist"

console.log("isWatch=>", isWatch)
console.log("debugMode=>", debugMode)
console.log("isDev=>", isDev)
console.log("distDir=>", distDir)

// https://vitejs.dev/config/
export default defineConfig({
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

    rollupOptions: {
      output: {
        // add a query parameter to all JS and CSS file URLs
        chunkFileNames: "chunks/chunk.[name].js",
        entryFileNames: "entry.[name].js",
        assetFileNames: "assets/[name].[ext]",
        manualChunks(id) {
          if (id.includes("node_modules")) {
            let arr = id.toString().split("node_modules/")[1].split("/")
            // pnpm单独处理
            if (id.includes(".pnpm")) {
              arr = id.toString().split(".pnpm/")[1].split("/")
            }
            const dep = arr[0].split("@")[0].replace(/\./g, "-")
            // console.log("id=>", id)
            // console.log("dep=>", dep)
            if (dep !== "") {
              return "vendor_" + dep
            }
            return "vendor"
          }
        },
      },
    },
  },
})
