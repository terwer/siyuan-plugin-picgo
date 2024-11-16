# Development

## Prerequisites

```bash
pnpm install
```

## Development

serve

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
pnpm serve -F picgo-plugin-app
```

dev

```bash
pnpm build -F universal-picgo-store
pnpm build -F universal-picgo
pnpm build -F zhi-siyuan-picgo
pnpm dev -F picgo-plugin-app
pnpm dev -F picgo-plugin-bootstrap
```

## Build

```bash
pnpm package
```

artifacts structure

```
├── build
  ├── package.zip
```