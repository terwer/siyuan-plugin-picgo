# sy-picgo

A PicGo library for SiYuan Note widgets

## Dev

```bash
pnpm install
pnpm dev -F zhi-siyuan-picgo
```

## Build

```bash
pnpm build
```

## Test from electron

```ts
const initSyPicgo = () => {
    const workspaceDir = "/Users/terwer/Documents/mydocs/zhi-framework/zhi"
    const libsBase = `${workspaceDir}/libs/zhi-siyuan-picgo/dist`
    
    const picgoExtension = require(`${libsBase}/index.cjs`).default
    console.log("picgoExtension=>", picgoExtension)
    const cfgfolder = `/Users/terwer/Downloads`
    const picgo_cfg = cfgfolder + "/picgo.cfg.json"
    
    const appFolder = picgoExtension.getCrossPlatformAppDataFolder()
    console.log("appFolder=>", appFolder)
    
    // 初始化
    const picgo = picgoExtension.initPicgo(picgo_cfg)
    console.log(picgo)
    return picgo
}
initSyPicgo()
```

## Thanks

- [siyuan-note](https://github.com/siyuan-note/siyuan)
- [PicGo-Core](https://github.com/PicGo/PicGo-Core)
- [vs-picgo](https://github.com/PicGo/vs-picgo)
- [esbuild](https://github.com/evanw/esbuild)
