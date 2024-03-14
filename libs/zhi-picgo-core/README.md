# zhi-picgo-core

A tool for picture uploading forked from [PicGO-Core](https://github.com/PicGo/PicGo-Core), for electron usage.

![picgo-core](https://cdn.jsdelivr.net/gh/Molunerfinn/test/picgo/picgo-core-fix.jpg)

## Usage

### Use in node project

#### Common JS

```js
const { PicGo } = require("picgo")
```

#### ES Module

```js
import { PicGo } from "picgo"
```

#### API usage example

```js
const picgo = new PicGo()

// upload a picture from path
picgo.upload(["/xxx/xxx.jpg"])

// upload a picture from clipboard
picgo.upload()
```

### Use in electron

```js
const { PicGo } = require("/Users/terwer/Documents/mydocs/zhi-framework/zhi/libs/zhi-picgo-core/dist/index.cjs.js")
const picgo = new PicGo()
console.log(picgo)
```

## Documentation

For more details, you can checkout [documentation](https://picgo.github.io/PicGo-Core-Doc/).
