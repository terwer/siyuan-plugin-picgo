# zhi-server-infra

basic issues for zhi

## How to use from electron

```js
(async () => {
    const initZhiInfra = require("/Users/terwer/Documents/mydocs/zhi-framework/zhi/libs/zhi-infra/dist/index.cjs").default
    const path = require("path")
    const zhiNpmPath = "/Users/terwer/Documents/mydocs/zhi-framework/zhi/libs/zhi-infra/dist/deps/npm"
    await initZhiInfra(zhiNpmPath, true)
})()
```

可用的 npm 包地址：

```
Available zhi node_modules path1 => [工作空间]/node_modules
Available zhi node_modules path2 => [zhiNpmPath]/node_modules
Available zhi node_modules path3 => [zhiAppNpmPath]/node_modules

备注：
Mac上 [zhiAppNpmPath]=/Users/[Mac用户名]/Library/Application Support/siyuancommunity
Windows上 [zhiAppNpmPath]=[用户目录]/siyuancommunity
Linux上 [zhiAppNpmPath]=[用户目录]/siyuancommunity
```

