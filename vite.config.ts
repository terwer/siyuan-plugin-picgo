import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import minimist from "minimist"

const args = minimist(process.argv.slice(2))
const isWatch = args.watch || args.w || false
const isWindows = process.platform === "win32"
let devDistDir = "/Users/terwer/Documents/mydocs/SiYuanWorkspace/public/data/plugins/siyuan-plugin-picgo"
if (isWindows) {
  devDistDir = "C:\\Users\\terwer\\Documents\\mydocs\\SiyuanWorkspace\\public\\data\\plugins\\siyuan-plugin-picgo"
}
const distDir = isWatch ? devDistDir : "./dist"

console.log("isWatch=>", isWatch)
console.log("distDir=>", distDir)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  build: {
    // 输出路径
    outDir: distDir,
    emptyOutDir: false,
  },
})
