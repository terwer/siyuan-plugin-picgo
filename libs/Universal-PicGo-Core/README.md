# universal-picgo

picgo lib for node, browser and electron

## Usage

```js
// usage
import { UniversalPicGo } from "universal-picgo"

try {
  const picgo = new UniversalPicGo()
  console.log("picgo =>", picgo)

  const result = await picgo.upload()
  console.log("upload success =>", result)
} catch (e: any) {
  console.error(e)
}
```

## Deps

```
├── universal-picgo-store
```

## Dev

```bash
pnpm dev -F universal-picgo
```

## Build

```bash
pnpm build -F universal-picgo
```

## Test

Execute the unit tests via [vitest](https://vitest.dev)

```bash
pnpm test -F universal-picgo
```

## Publish

```bash
pnpm publish -F universal-picgo --tag latest
```
