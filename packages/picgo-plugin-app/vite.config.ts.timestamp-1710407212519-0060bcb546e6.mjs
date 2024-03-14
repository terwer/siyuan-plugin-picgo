// vite.config.ts
import { defineConfig } from "file:///Users/terwer/Documents/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/vite@5.1.6_@types+node@20.5.1_stylus@0.63.0/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/terwer/Documents/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/@vitejs+plugin-vue@5.0.4_vite@5.1.6_vue@3.4.21/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import livereload from "file:///Users/terwer/Documents/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/rollup-plugin-livereload@2.0.5/node_modules/rollup-plugin-livereload/dist/index.cjs.js";
import minimist from "file:///Users/terwer/Documents/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/minimist@1.2.8/node_modules/minimist/index.js";
import fg from "file:///Users/terwer/Documents/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/fast-glob@3.3.2/node_modules/fast-glob/out/index.js";
import { createHtmlPlugin } from "file:///Users/terwer/Documents/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/vite-plugin-html@3.2.2_vite@5.1.6/node_modules/vite-plugin-html/dist/index.mjs";
import path from "path";
import AutoImport from "file:///Users/terwer/Documents/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/unplugin-auto-import@0.17.5_@vueuse+core@10.9.0/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///Users/terwer/Documents/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/unplugin-vue-components@0.26.0_vue@3.4.21/node_modules/unplugin-vue-components/dist/vite.js";
import { ElementPlusResolver } from "file:///Users/terwer/Documents/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/unplugin-vue-components@0.26.0_vue@3.4.21/node_modules/unplugin-vue-components/dist/resolvers.js";
var __vite_injected_original_dirname = "/Users/terwer/Documents/mydocs/siyuan-plugins/siyuan-plugin-picgo/packages/picgo-plugin-app";
var args = minimist(process.argv.slice(2));
var isServe = process.env.IS_SERVE;
var isWatch = args.watch || args.w || false;
var isDev = isServe || isWatch;
var outDir = args.o || args.outDir;
var distDir = "../../artifacts/siyuan-plugin-picgo/dist";
var vite_config_default = defineConfig(() => ({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    }),
    createHtmlPlugin({
      minify: !isDev,
      inject: {
        // 在 body 标签底部插入指定的 JavaScript 文件
        tags: isDev ? [
          {
            tag: "script",
            attrs: {
              src: "./libs/eruda/eruda.js"
            },
            injectTo: "head-prepend"
          }
        ] : [],
        data: {
          title: "eruda",
          injectScript: isDev ? `<script>eruda.init();</script>` : ""
        }
      }
    }),
    {
      name: "add-query-param",
      transformIndexHtml(html) {
        const timestamp = Date.now();
        html = html.replace(/(<script.+src=")([^"]+\.js)"/g, `$1$2?v=${timestamp}"`);
        html = html.replace(/(<link[^>]+href=")([^"]+(\.css|\.js))"/g, (match, p1, p2) => `${p1}${p2}?v=${timestamp}"`);
        html = html.replace(/(<link[^>]+href=")([^"]+\.svg)"/g, `$1$2?v=${timestamp}"`);
        html = html.replace(/(<img[^>]+src=")([^"]+\.(jpe?g|gif|webp|bmp|png))"/g, `$1$2?v=${timestamp}"`);
        return html;
      }
    }
  ],
  // 项目部署的基础路径
  base: "",
  // https://github.com/vitejs/vite/issues/1930
  // https://vitejs.dev/guide/env-and-mode.html#env-files
  // https://github.com/vitejs/vite/discussions/3058#discussioncomment-2115319
  // 在这里自定义变量
  define: {
    "process.env.DEV_MODE": `"${isDev}"`
  },
  resolve: {
    alias: {
      "~": path.resolve(__vite_injected_original_dirname, "./"),
      "@": path.resolve(__vite_injected_original_dirname, "./src/"),
      $routes: path.resolve(__vite_injected_original_dirname, "./src/routes"),
      $pages: path.resolve(__vite_injected_original_dirname, "./src/pages"),
      $lib: path.resolve(__vite_injected_original_dirname, "./src/lib"),
      $assets: path.resolve(__vite_injected_original_dirname, "./src/assets"),
      $components: path.resolve(__vite_injected_original_dirname, "./src/components"),
      $composables: path.resolve(__vite_injected_original_dirname, "./src/composables")
    }
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
        ...isWatch ? [
          livereload(distDir),
          {
            //监听静态资源文件
            name: "watch-external",
            async buildStart() {
              const files = await fg(["src/assets/*", "./README*.md", "./widget.json"]);
              for (const file of files) {
                const that = this;
                that.addWatchFile(file);
              }
            }
          }
        ] : []
      ],
      // make sure to externalize deps that shouldn't be bundled into your library
      external: []
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    // environment: "node",
    // environment: "happy-dom",
    setupFiles: ["./src/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "utils/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"
    ],
    server: {
      deps: {
        inline: ["element-plus"]
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdGVyd2VyL0RvY3VtZW50cy9teWRvY3Mvc2l5dWFuLXBsdWdpbnMvc2l5dWFuLXBsdWdpbi1waWNnby9wYWNrYWdlcy9waWNnby1wbHVnaW4tYXBwXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdGVyd2VyL0RvY3VtZW50cy9teWRvY3Mvc2l5dWFuLXBsdWdpbnMvc2l5dWFuLXBsdWdpbi1waWNnby9wYWNrYWdlcy9waWNnby1wbHVnaW4tYXBwL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy90ZXJ3ZXIvRG9jdW1lbnRzL215ZG9jcy9zaXl1YW4tcGx1Z2lucy9zaXl1YW4tcGx1Z2luLXBpY2dvL3BhY2thZ2VzL3BpY2dvLXBsdWdpbi1hcHAvdml0ZS5jb25maWcudHNcIjsvKlxuICogICAgICAgICAgICBHTlUgR0VORVJBTCBQVUJMSUMgTElDRU5TRVxuICogICAgICAgICAgICAgICBWZXJzaW9uIDMsIDI5IEp1bmUgMjAwN1xuICpcbiAqICBDb3B5cmlnaHQgKEMpIDIwMjMtMjAyNCBUZXJ3ZXIsIEluYy4gPGh0dHBzOi8vdGVyd2VyLnNwYWNlLz5cbiAqICBFdmVyeW9uZSBpcyBwZXJtaXR0ZWQgdG8gY29weSBhbmQgZGlzdHJpYnV0ZSB2ZXJiYXRpbSBjb3BpZXNcbiAqICBvZiB0aGlzIGxpY2Vuc2UgZG9jdW1lbnQsIGJ1dCBjaGFuZ2luZyBpdCBpcyBub3QgYWxsb3dlZC5cbiAqL1xuXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiXG5pbXBvcnQgdnVlIGZyb20gXCJAdml0ZWpzL3BsdWdpbi12dWVcIlxuaW1wb3J0IGxpdmVyZWxvYWQgZnJvbSBcInJvbGx1cC1wbHVnaW4tbGl2ZXJlbG9hZFwiXG5pbXBvcnQgbWluaW1pc3QgZnJvbSBcIm1pbmltaXN0XCJcbmltcG9ydCBmZyBmcm9tIFwiZmFzdC1nbG9iXCJcbmltcG9ydCB7IGNyZWF0ZUh0bWxQbHVnaW4gfSBmcm9tIFwidml0ZS1wbHVnaW4taHRtbFwiXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiXG5pbXBvcnQgQXV0b0ltcG9ydCBmcm9tIFwidW5wbHVnaW4tYXV0by1pbXBvcnQvdml0ZVwiXG5pbXBvcnQgQ29tcG9uZW50cyBmcm9tIFwidW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZVwiXG5pbXBvcnQgeyBFbGVtZW50UGx1c1Jlc29sdmVyIH0gZnJvbSBcInVucGx1Z2luLXZ1ZS1jb21wb25lbnRzL3Jlc29sdmVyc1wiXG5cbi8vIGNvbmZpZ1xuY29uc3QgYXJncyA9IG1pbmltaXN0KHByb2Nlc3MuYXJndi5zbGljZSgyKSlcbi8vIFx1NUYwMFx1NTQyRlx1NEU0Qlx1NTQwRVx1NTNFRlx1NEVFNVx1NTQwQ2VydWRhXHU2M0E1XHU3QkExXHU2NUU1XHU1RkQ3XG5jb25zdCBpc1NlcnZlID0gcHJvY2Vzcy5lbnYuSVNfU0VSVkVcbmNvbnN0IGlzV2F0Y2ggPSBhcmdzLndhdGNoIHx8IGFyZ3MudyB8fCBmYWxzZVxuY29uc3QgaXNEZXYgPSBpc1NlcnZlIHx8IGlzV2F0Y2hcbmNvbnN0IG91dERpciA9IGFyZ3MubyB8fCBhcmdzLm91dERpclxuXG5jb25zdCBkaXN0RGlyID0gXCIuLi8uLi9hcnRpZmFjdHMvc2l5dWFuLXBsdWdpbi1waWNnby9kaXN0XCJcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoKSA9PiAoe1xuICBwbHVnaW5zOiBbXG4gICAgdnVlKCksXG5cbiAgICBBdXRvSW1wb3J0KHtcbiAgICAgIHJlc29sdmVyczogW0VsZW1lbnRQbHVzUmVzb2x2ZXIoKV0sXG4gICAgfSksXG4gICAgQ29tcG9uZW50cyh7XG4gICAgICByZXNvbHZlcnM6IFtFbGVtZW50UGx1c1Jlc29sdmVyKCldLFxuICAgIH0pLFxuXG4gICAgY3JlYXRlSHRtbFBsdWdpbih7XG4gICAgICBtaW5pZnk6ICFpc0RldixcbiAgICAgIGluamVjdDoge1xuICAgICAgICAvLyBcdTU3MjggYm9keSBcdTY4MDdcdTdCN0VcdTVFOTVcdTkwRThcdTYzRDJcdTUxNjVcdTYzMDdcdTVCOUFcdTc2ODQgSmF2YVNjcmlwdCBcdTY1ODdcdTRFRjZcbiAgICAgICAgdGFnczogaXNEZXZcbiAgICAgICAgICA/IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRhZzogXCJzY3JpcHRcIixcbiAgICAgICAgICAgICAgICBhdHRyczoge1xuICAgICAgICAgICAgICAgICAgc3JjOiBcIi4vbGlicy9lcnVkYS9lcnVkYS5qc1wiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaW5qZWN0VG86IFwiaGVhZC1wcmVwZW5kXCIsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdXG4gICAgICAgICAgOiBbXSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIHRpdGxlOiBcImVydWRhXCIsXG4gICAgICAgICAgaW5qZWN0U2NyaXB0OiBpc0RldiA/IGA8c2NyaXB0PmVydWRhLmluaXQoKTs8L3NjcmlwdD5gIDogXCJcIixcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSksXG5cbiAgICB7XG4gICAgICBuYW1lOiBcImFkZC1xdWVyeS1wYXJhbVwiLFxuICAgICAgdHJhbnNmb3JtSW5kZXhIdG1sKGh0bWwpIHtcbiAgICAgICAgY29uc3QgdGltZXN0YW1wID0gRGF0ZS5ub3coKVxuICAgICAgICBodG1sID0gaHRtbC5yZXBsYWNlKC8oPHNjcmlwdC4rc3JjPVwiKShbXlwiXStcXC5qcylcIi9nLCBgJDEkMj92PSR7dGltZXN0YW1wfVwiYClcbiAgICAgICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvKDxsaW5rW14+XStocmVmPVwiKShbXlwiXSsoXFwuY3NzfFxcLmpzKSlcIi9nLCAobWF0Y2gsIHAxLCBwMikgPT4gYCR7cDF9JHtwMn0/dj0ke3RpbWVzdGFtcH1cImApXG4gICAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoLyg8bGlua1tePl0raHJlZj1cIikoW15cIl0rXFwuc3ZnKVwiL2csIGAkMSQyP3Y9JHt0aW1lc3RhbXB9XCJgKVxuICAgICAgICBodG1sID0gaHRtbC5yZXBsYWNlKC8oPGltZ1tePl0rc3JjPVwiKShbXlwiXStcXC4oanBlP2d8Z2lmfHdlYnB8Ym1wfHBuZykpXCIvZywgYCQxJDI/dj0ke3RpbWVzdGFtcH1cImApXG4gICAgICAgIHJldHVybiBodG1sXG4gICAgICB9LFxuICAgIH0sXG4gIF0sXG5cbiAgLy8gXHU5ODc5XHU3NkVFXHU5MEU4XHU3RjcyXHU3Njg0XHU1N0ZBXHU3ODQwXHU4REVGXHU1Rjg0XG4gIGJhc2U6IFwiXCIsXG5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3ZpdGVqcy92aXRlL2lzc3Vlcy8xOTMwXG4gIC8vIGh0dHBzOi8vdml0ZWpzLmRldi9ndWlkZS9lbnYtYW5kLW1vZGUuaHRtbCNlbnYtZmlsZXNcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3ZpdGVqcy92aXRlL2Rpc2N1c3Npb25zLzMwNTgjZGlzY3Vzc2lvbmNvbW1lbnQtMjExNTMxOVxuICAvLyBcdTU3MjhcdThGRDlcdTkxQ0NcdTgxRUFcdTVCOUFcdTRFNDlcdTUzRDhcdTkxQ0ZcbiAgZGVmaW5lOiB7XG4gICAgXCJwcm9jZXNzLmVudi5ERVZfTU9ERVwiOiBgXCIke2lzRGV2fVwiYCxcbiAgfSxcblxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiflwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vXCIpLFxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvXCIpLFxuICAgICAgJHJvdXRlczogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9yb3V0ZXNcIiksXG4gICAgICAkcGFnZXM6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvcGFnZXNcIiksXG4gICAgICAkbGliOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL2xpYlwiKSxcbiAgICAgICRhc3NldHM6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvYXNzZXRzXCIpLFxuICAgICAgJGNvbXBvbmVudHM6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvY29tcG9uZW50c1wiKSxcbiAgICAgICRjb21wb3NhYmxlczogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyYy9jb21wb3NhYmxlc1wiKSxcbiAgICB9LFxuICB9LFxuXG4gIGJ1aWxkOiB7XG4gICAgLy8gXHU4RjkzXHU1MUZBXHU4REVGXHU1Rjg0XG4gICAgb3V0RGlyOiBvdXREaXIgfHwgZGlzdERpcixcbiAgICBlbXB0eU91dERpcjogZmFsc2UsXG5cbiAgICAvLyBcdTY3ODRcdTVFRkFcdTU0MEVcdTY2MkZcdTU0MjZcdTc1MUZcdTYyMTAgc291cmNlIG1hcCBcdTY1ODdcdTRFRjZcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuXG4gICAgLy8gXHU4QkJFXHU3RjZFXHU0RTNBIGZhbHNlIFx1NTNFRlx1NEVFNVx1Nzk4MVx1NzUyOFx1NjcwMFx1NUMwRlx1NTMxNlx1NkRGN1x1NkRDNlxuICAgIC8vIFx1NjIxNlx1NjYyRlx1NzUyOFx1Njc2NVx1NjMwN1x1NUI5QVx1NjYyRlx1NUU5NFx1NzUyOFx1NTRFQVx1NzlDRFx1NkRGN1x1NkRDNlx1NTY2OFxuICAgIC8vIGJvb2xlYW4gfCAndGVyc2VyJyB8ICdlc2J1aWxkJ1xuICAgIC8vIFx1NEUwRFx1NTM4Qlx1N0YyOVx1RkYwQ1x1NzUyOFx1NEU4RVx1OEMwM1x1OEJENVxuICAgIG1pbmlmeTogIWlzRGV2LFxuXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgcGx1Z2luczogW1xuICAgICAgICAuLi4oaXNXYXRjaFxuICAgICAgICAgID8gW1xuICAgICAgICAgICAgICBsaXZlcmVsb2FkKGRpc3REaXIpLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy9cdTc2RDFcdTU0MkNcdTk3NTlcdTYwMDFcdThENDRcdTZFOTBcdTY1ODdcdTRFRjZcbiAgICAgICAgICAgICAgICBuYW1lOiBcIndhdGNoLWV4dGVybmFsXCIsXG4gICAgICAgICAgICAgICAgYXN5bmMgYnVpbGRTdGFydCgpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgZmcoW1wic3JjL2Fzc2V0cy8qXCIsIFwiLi9SRUFETUUqLm1kXCIsIFwiLi93aWRnZXQuanNvblwiXSlcbiAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBhbnlcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5hZGRXYXRjaEZpbGUoZmlsZSlcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXVxuICAgICAgICAgIDogW10pLFxuICAgICAgXSBhcyBhbnksXG5cbiAgICAgIC8vIG1ha2Ugc3VyZSB0byBleHRlcm5hbGl6ZSBkZXBzIHRoYXQgc2hvdWxkbid0IGJlIGJ1bmRsZWQgaW50byB5b3VyIGxpYnJhcnlcbiAgICAgIGV4dGVybmFsOiBbXSxcbiAgICB9LFxuICB9LFxuXG4gIHRlc3Q6IHtcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGVudmlyb25tZW50OiBcImpzZG9tXCIsXG4gICAgLy8gZW52aXJvbm1lbnQ6IFwibm9kZVwiLFxuICAgIC8vIGVudmlyb25tZW50OiBcImhhcHB5LWRvbVwiLFxuICAgIHNldHVwRmlsZXM6IFtcIi4vc3JjL3NldHVwLnRzXCJdLFxuICAgIGluY2x1ZGU6IFtcbiAgICAgIFwic3JjLyoqLyoue3Rlc3Qsc3BlY30ue2pzLG1qcyxjanMsdHMsbXRzLGN0cyxqc3gsdHN4fVwiLFxuICAgICAgXCJ1dGlscy8qKi8qLnt0ZXN0LHNwZWN9LntqcyxtanMsY2pzLHRzLG10cyxjdHMsanN4LHRzeH1cIixcbiAgICBdLFxuICAgIHNlcnZlcjoge1xuICAgICAgZGVwczoge1xuICAgICAgICBpbmxpbmU6IFtcImVsZW1lbnQtcGx1c1wiXSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pKVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQVNBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUNoQixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGNBQWM7QUFDckIsT0FBTyxRQUFRO0FBQ2YsU0FBUyx3QkFBd0I7QUFDakMsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sZ0JBQWdCO0FBQ3ZCLFNBQVMsMkJBQTJCO0FBbEJwQyxJQUFNLG1DQUFtQztBQXFCekMsSUFBTSxPQUFPLFNBQVMsUUFBUSxLQUFLLE1BQU0sQ0FBQyxDQUFDO0FBRTNDLElBQU0sVUFBVSxRQUFRLElBQUk7QUFDNUIsSUFBTSxVQUFVLEtBQUssU0FBUyxLQUFLLEtBQUs7QUFDeEMsSUFBTSxRQUFRLFdBQVc7QUFDekIsSUFBTSxTQUFTLEtBQUssS0FBSyxLQUFLO0FBRTlCLElBQU0sVUFBVTtBQUdoQixJQUFPLHNCQUFRLGFBQWEsT0FBTztBQUFBLEVBQ2pDLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxJQUVKLFdBQVc7QUFBQSxNQUNULFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQztBQUFBLElBQ25DLENBQUM7QUFBQSxJQUNELFdBQVc7QUFBQSxNQUNULFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQztBQUFBLElBQ25DLENBQUM7QUFBQSxJQUVELGlCQUFpQjtBQUFBLE1BQ2YsUUFBUSxDQUFDO0FBQUEsTUFDVCxRQUFRO0FBQUE7QUFBQSxRQUVOLE1BQU0sUUFDRjtBQUFBLFVBQ0U7QUFBQSxZQUNF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
