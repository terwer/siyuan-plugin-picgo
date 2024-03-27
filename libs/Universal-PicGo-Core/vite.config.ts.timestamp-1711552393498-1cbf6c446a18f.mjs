// vite.config.ts
import { resolve } from "path";
import { defineConfig, loadEnv } from "file:///Users/zhangyue/Documents/terwer/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/vite@5.2.6_@types+node@20.11.30_stylus@0.63.0/node_modules/vite/dist/node/index.js";
import { viteStaticCopy } from "file:///Users/zhangyue/Documents/terwer/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/vite-plugin-static-copy@1.0.2_vite@5.2.6/node_modules/vite-plugin-static-copy/dist/index.js";
import dts from "file:///Users/zhangyue/Documents/terwer/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/vite-plugin-dts@3.7.3_@types+node@20.11.30_typescript@5.4.3_vite@5.2.6/node_modules/vite-plugin-dts/dist/index.mjs";
import minimist from "file:///Users/zhangyue/Documents/terwer/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/minimist@1.2.8/node_modules/minimist/index.js";
import livereload from "file:///Users/zhangyue/Documents/terwer/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/rollup-plugin-livereload@2.0.5/node_modules/rollup-plugin-livereload/dist/index.cjs.js";
import { nodePolyfills } from "file:///Users/zhangyue/Documents/terwer/mydocs/siyuan-plugins/siyuan-plugin-picgo/node_modules/.pnpm/vite-plugin-node-polyfills@0.21.0_vite@4.5.3/node_modules/vite-plugin-node-polyfills/dist/index.js";
import fs from "fs";
var __vite_injected_original_dirname = "/Users/zhangyue/Documents/terwer/mydocs/siyuan-plugins/siyuan-plugin-picgo/libs/Universal-PicGo-Core";
var packageJson = fs.readFileSync("./package.json").toString();
var pkg = JSON.parse(packageJson) || {};
var getDefineEnv = (isDevMode) => {
  const mode = process.env.NODE_ENV;
  const isTest = mode === "test";
  console.log("isServe=>", isServe);
  console.log("mode=>", mode);
  const defaultEnv = {
    DEV_MODE: `${isDevMode || isTest}`,
    NODE_ENV: isDevMode ? "development" : "production",
    PICGO_VERSION: pkg.version
  };
  const env = loadEnv(mode, process.cwd());
  const processEnvValues = {
    "process.env": Object.entries(env).reduce((prev, [key, val]) => {
      return {
        ...prev,
        [key]: val
      };
    }, defaultEnv)
  };
  const defineEnv = {
    ...processEnvValues,
    ...{}
  };
  console.log("defineEnv=>", defineEnv);
  return defineEnv;
};
var args = minimist(process.argv.slice(2));
var isServe = process.env.IS_SERVE;
var isWatch = args.watch || args.w || false;
var isDev = isServe || isWatch;
var devDistDir = "./dist";
var distDir = isWatch ? devDistDir : "./dist";
console.log("isWatch=>", isWatch);
console.log("distDir=>", distDir);
var vite_config_default = defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true
      // rollupTypes: true,
    }),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true
    }),
    viteStaticCopy({
      targets: [
        {
          src: "README.md",
          dest: "./"
        },
        {
          src: "package.json",
          dest: "./"
        }
      ]
    })
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
    minify: !isDev,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__vite_injected_original_dirname, "src/index.ts"),
      // the proper extensions will be added
      // fileName: "index",
      formats: ["es"]
    },
    rollupOptions: {
      plugins: [...isWatch ? [livereload(devDistDir)] : []],
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [],
      output: {
        entryFileNames: "[name].js"
      }
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvemhhbmd5dWUvRG9jdW1lbnRzL3Rlcndlci9teWRvY3Mvc2l5dWFuLXBsdWdpbnMvc2l5dWFuLXBsdWdpbi1waWNnby9saWJzL1VuaXZlcnNhbC1QaWNHby1Db3JlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvemhhbmd5dWUvRG9jdW1lbnRzL3Rlcndlci9teWRvY3Mvc2l5dWFuLXBsdWdpbnMvc2l5dWFuLXBsdWdpbi1waWNnby9saWJzL1VuaXZlcnNhbC1QaWNHby1Db3JlL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy96aGFuZ3l1ZS9Eb2N1bWVudHMvdGVyd2VyL215ZG9jcy9zaXl1YW4tcGx1Z2lucy9zaXl1YW4tcGx1Z2luLXBpY2dvL2xpYnMvVW5pdmVyc2FsLVBpY0dvLUNvcmUvdml0ZS5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5cbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwicGF0aFwiXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiXG5pbXBvcnQgeyB2aXRlU3RhdGljQ29weSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1zdGF0aWMtY29weVwiXG5pbXBvcnQgZHRzIGZyb20gXCJ2aXRlLXBsdWdpbi1kdHNcIlxuaW1wb3J0IG1pbmltaXN0IGZyb20gXCJtaW5pbWlzdFwiXG5pbXBvcnQgbGl2ZXJlbG9hZCBmcm9tIFwicm9sbHVwLXBsdWdpbi1saXZlcmVsb2FkXCJcbmltcG9ydCB7IG5vZGVQb2x5ZmlsbHMgfSBmcm9tIFwidml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHNcIlxuaW1wb3J0IGZzIGZyb20gXCJmc1wiXG5cbi8vIG1ldGhvZHMgc3RhcnRcbmNvbnN0IHBhY2thZ2VKc29uID0gZnMucmVhZEZpbGVTeW5jKFwiLi9wYWNrYWdlLmpzb25cIikudG9TdHJpbmcoKVxuY29uc3QgcGtnID0gSlNPTi5wYXJzZShwYWNrYWdlSnNvbikgfHwge31cblxuY29uc3QgZ2V0RGVmaW5lRW52ID0gKGlzRGV2TW9kZTogYm9vbGVhbikgPT4ge1xuICBjb25zdCBtb2RlID0gcHJvY2Vzcy5lbnYuTk9ERV9FTlZcbiAgY29uc3QgaXNUZXN0ID0gbW9kZSA9PT0gXCJ0ZXN0XCJcbiAgY29uc29sZS5sb2coXCJpc1NlcnZlPT5cIiwgaXNTZXJ2ZSlcbiAgY29uc29sZS5sb2coXCJtb2RlPT5cIiwgbW9kZSlcblxuICBjb25zdCBkZWZhdWx0RW52ID0ge1xuICAgIERFVl9NT0RFOiBgJHtpc0Rldk1vZGUgfHwgaXNUZXN0fWAsXG4gICAgTk9ERV9FTlY6IGlzRGV2TW9kZSA/IFwiZGV2ZWxvcG1lbnRcIiA6IFwicHJvZHVjdGlvblwiLFxuICAgIFBJQ0dPX1ZFUlNJT046IHBrZy52ZXJzaW9uLFxuICB9XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSlcbiAgY29uc3QgcHJvY2Vzc0VudlZhbHVlcyA9IHtcbiAgICBcInByb2Nlc3MuZW52XCI6IE9iamVjdC5lbnRyaWVzKGVudikucmVkdWNlKChwcmV2LCBba2V5LCB2YWxdKSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5wcmV2LFxuICAgICAgICBba2V5XTogdmFsLFxuICAgICAgfVxuICAgIH0sIGRlZmF1bHRFbnYpLFxuICB9XG4gIGNvbnN0IGRlZmluZUVudiA9IHtcbiAgICAuLi5wcm9jZXNzRW52VmFsdWVzLFxuICAgIC4uLnt9LFxuICB9XG4gIGNvbnNvbGUubG9nKFwiZGVmaW5lRW52PT5cIiwgZGVmaW5lRW52KVxuXG4gIHJldHVybiBkZWZpbmVFbnZcbn1cbi8vIG1ldGhvZHMgZW5kXG5cbmNvbnN0IGFyZ3MgPSBtaW5pbWlzdChwcm9jZXNzLmFyZ3Yuc2xpY2UoMikpXG5jb25zdCBpc1NlcnZlID0gcHJvY2Vzcy5lbnYuSVNfU0VSVkVcbmNvbnN0IGlzV2F0Y2ggPSBhcmdzLndhdGNoIHx8IGFyZ3MudyB8fCBmYWxzZVxuY29uc3QgaXNEZXYgPSBpc1NlcnZlIHx8IGlzV2F0Y2hcbmNvbnN0IGRldkRpc3REaXIgPSBcIi4vZGlzdFwiXG5jb25zdCBkaXN0RGlyID0gaXNXYXRjaCA/IGRldkRpc3REaXIgOiBcIi4vZGlzdFwiXG5cbmNvbnNvbGUubG9nKFwiaXNXYXRjaD0+XCIsIGlzV2F0Y2gpXG5jb25zb2xlLmxvZyhcImRpc3REaXI9PlwiLCBkaXN0RGlyKVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgZHRzKHtcbiAgICAgIGluc2VydFR5cGVzRW50cnk6IHRydWUsXG4gICAgICAvLyByb2xsdXBUeXBlczogdHJ1ZSxcbiAgICB9KSxcblxuICAgIG5vZGVQb2x5ZmlsbHMoe1xuICAgICAgLy8gV2hldGhlciB0byBwb2x5ZmlsbCBgbm9kZTpgIHByb3RvY29sIGltcG9ydHMuXG4gICAgICBwcm90b2NvbEltcG9ydHM6IHRydWUsXG4gICAgfSkgYXMgYW55LFxuXG4gICAgdml0ZVN0YXRpY0NvcHkoe1xuICAgICAgdGFyZ2V0czogW1xuICAgICAgICB7XG4gICAgICAgICAgc3JjOiBcIlJFQURNRS5tZFwiLFxuICAgICAgICAgIGRlc3Q6IFwiLi9cIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNyYzogXCJwYWNrYWdlLmpzb25cIixcbiAgICAgICAgICBkZXN0OiBcIi4vXCIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pLFxuICBdLFxuXG4gIGJhc2U6IFwiXCIsXG5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3ZpdGVqcy92aXRlL2lzc3Vlcy8xOTMwXG4gIC8vIGh0dHBzOi8vdml0ZWpzLmRldi9ndWlkZS9lbnYtYW5kLW1vZGUuaHRtbCNlbnYtZmlsZXNcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3ZpdGVqcy92aXRlL2Rpc2N1c3Npb25zLzMwNTgjZGlzY3Vzc2lvbmNvbW1lbnQtMjExNTMxOVxuICAvLyBcdTU3MjhcdThGRDlcdTkxQ0NcdTgxRUFcdTVCOUFcdTRFNDlcdTUzRDhcdTkxQ0ZcbiAgZGVmaW5lOiBnZXREZWZpbmVFbnYoaXNEZXYpLFxuXG4gIGJ1aWxkOiB7XG4gICAgLy8gXHU4RjkzXHU1MUZBXHU4REVGXHU1Rjg0XG4gICAgb3V0RGlyOiBkaXN0RGlyLFxuICAgIGVtcHR5T3V0RGlyOiBmYWxzZSxcblxuICAgIC8vIFx1Njc4NFx1NUVGQVx1NTQwRVx1NjYyRlx1NTQyNlx1NzUxRlx1NjIxMCBzb3VyY2UgbWFwIFx1NjU4N1x1NEVGNlxuICAgIHNvdXJjZW1hcDogZmFsc2UsXG4gICAgbWluaWZ5OiAhaXNEZXYsXG5cbiAgICBsaWI6IHtcbiAgICAgIC8vIENvdWxkIGFsc28gYmUgYSBkaWN0aW9uYXJ5IG9yIGFycmF5IG9mIG11bHRpcGxlIGVudHJ5IHBvaW50c1xuICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9pbmRleC50c1wiKSxcbiAgICAgIC8vIHRoZSBwcm9wZXIgZXh0ZW5zaW9ucyB3aWxsIGJlIGFkZGVkXG4gICAgICAvLyBmaWxlTmFtZTogXCJpbmRleFwiLFxuICAgICAgZm9ybWF0czogW1wiZXNcIl0sXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBwbHVnaW5zOiBbLi4uKGlzV2F0Y2ggPyBbbGl2ZXJlbG9hZChkZXZEaXN0RGlyKV0gOiBbXSldIGFzIGFueSxcbiAgICAgIC8vIG1ha2Ugc3VyZSB0byBleHRlcm5hbGl6ZSBkZXBzIHRoYXQgc2hvdWxkbid0IGJlIGJ1bmRsZWRcbiAgICAgIC8vIGludG8geW91ciBsaWJyYXJ5XG4gICAgICBleHRlcm5hbDogW10sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6IFwiW25hbWVdLmpzXCIsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG5cbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6IFwianNkb21cIixcbiAgICBpbmNsdWRlOiBbXCJzcmMvKiovKi57dGVzdCxzcGVjfS57anMsbWpzLGNqcyx0cyxtdHMsY3RzLGpzeCx0c3h9XCJdLFxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFFQSxTQUFTLGVBQWU7QUFDeEIsU0FBUyxjQUFjLGVBQWU7QUFDdEMsU0FBUyxzQkFBc0I7QUFDL0IsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sY0FBYztBQUNyQixPQUFPLGdCQUFnQjtBQUN2QixTQUFTLHFCQUFxQjtBQUM5QixPQUFPLFFBQVE7QUFUZixJQUFNLG1DQUFtQztBQVl6QyxJQUFNLGNBQWMsR0FBRyxhQUFhLGdCQUFnQixFQUFFLFNBQVM7QUFDL0QsSUFBTSxNQUFNLEtBQUssTUFBTSxXQUFXLEtBQUssQ0FBQztBQUV4QyxJQUFNLGVBQWUsQ0FBQyxjQUF1QjtBQUMzQyxRQUFNLE9BQU8sUUFBUSxJQUFJO0FBQ3pCLFFBQU0sU0FBUyxTQUFTO0FBQ3hCLFVBQVEsSUFBSSxhQUFhLE9BQU87QUFDaEMsVUFBUSxJQUFJLFVBQVUsSUFBSTtBQUUxQixRQUFNLGFBQWE7QUFBQSxJQUNqQixVQUFVLEdBQUcsYUFBYSxNQUFNO0FBQUEsSUFDaEMsVUFBVSxZQUFZLGdCQUFnQjtBQUFBLElBQ3RDLGVBQWUsSUFBSTtBQUFBLEVBQ3JCO0FBQ0EsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksQ0FBQztBQUN2QyxRQUFNLG1CQUFtQjtBQUFBLElBQ3ZCLGVBQWUsT0FBTyxRQUFRLEdBQUcsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxNQUFNO0FBQzlELGFBQU87QUFBQSxRQUNMLEdBQUc7QUFBQSxRQUNILENBQUMsR0FBRyxHQUFHO0FBQUEsTUFDVDtBQUFBLElBQ0YsR0FBRyxVQUFVO0FBQUEsRUFDZjtBQUNBLFFBQU0sWUFBWTtBQUFBLElBQ2hCLEdBQUc7QUFBQSxJQUNILEdBQUcsQ0FBQztBQUFBLEVBQ047QUFDQSxVQUFRLElBQUksZUFBZSxTQUFTO0FBRXBDLFNBQU87QUFDVDtBQUdBLElBQU0sT0FBTyxTQUFTLFFBQVEsS0FBSyxNQUFNLENBQUMsQ0FBQztBQUMzQyxJQUFNLFVBQVUsUUFBUSxJQUFJO0FBQzVCLElBQU0sVUFBVSxLQUFLLFNBQVMsS0FBSyxLQUFLO0FBQ3hDLElBQU0sUUFBUSxXQUFXO0FBQ3pCLElBQU0sYUFBYTtBQUNuQixJQUFNLFVBQVUsVUFBVSxhQUFhO0FBRXZDLFFBQVEsSUFBSSxhQUFhLE9BQU87QUFDaEMsUUFBUSxJQUFJLGFBQWEsT0FBTztBQUVoQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsTUFDRixrQkFBa0I7QUFBQTtBQUFBLElBRXBCLENBQUM7QUFBQSxJQUVELGNBQWM7QUFBQTtBQUFBLE1BRVosaUJBQWlCO0FBQUEsSUFDbkIsQ0FBQztBQUFBLElBRUQsZUFBZTtBQUFBLE1BQ2IsU0FBUztBQUFBLFFBQ1A7QUFBQSxVQUNFLEtBQUs7QUFBQSxVQUNMLE1BQU07QUFBQSxRQUNSO0FBQUEsUUFDQTtBQUFBLFVBQ0UsS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1I7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsTUFBTTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNTixRQUFRLGFBQWEsS0FBSztBQUFBLEVBRTFCLE9BQU87QUFBQTtBQUFBLElBRUwsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBO0FBQUEsSUFHYixXQUFXO0FBQUEsSUFDWCxRQUFRLENBQUM7QUFBQSxJQUVULEtBQUs7QUFBQTtBQUFBLE1BRUgsT0FBTyxRQUFRLGtDQUFXLGNBQWM7QUFBQTtBQUFBO0FBQUEsTUFHeEMsU0FBUyxDQUFDLElBQUk7QUFBQSxJQUNoQjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsU0FBUyxDQUFDLEdBQUksVUFBVSxDQUFDLFdBQVcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFFO0FBQUE7QUFBQTtBQUFBLE1BR3RELFVBQVUsQ0FBQztBQUFBLE1BQ1gsUUFBUTtBQUFBLFFBQ04sZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsU0FBUyxDQUFDLHNEQUFzRDtBQUFBLEVBQ2xFO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
