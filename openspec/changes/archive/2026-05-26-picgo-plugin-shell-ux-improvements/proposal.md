## Why

The PicGo plugin shell has several high-impact usability problems: the main UI opens as a SiYuan dialog instead of a lightweight mounted surface, migration checks can run repeatedly when opening the UI, and menu/runtime state does not clearly reflect configuration changes until reload.

These issues affect daily plugin use and should be handled separately from the headless library release that unblocks Publisher.

## What Changes

- Replace the main plugin shell trigger from a SiYuan dialog-first experience with a DOM-mounted popup or side-panel style surface.
- Make configuration migration/init checks idempotent so routine UI opening does not repeatedly trigger migration work.
- Detect configuration changes that require plugin menu/runtime refresh and show clear UI copy telling the user that a reload is needed.
- Provide an explicit reload action or clear reload instruction when runtime-visible menu state cannot be updated live.
- Keep the existing settings and upload capabilities functional while improving the shell interaction model.

## Capabilities

### New Capabilities

- `picgo-plugin-shell-ux`: PicGo plugin product shell interaction, one-time initialization behavior, and runtime refresh notices.

### Modified Capabilities

- None.

## Impact

- Affected packages:
  - `packages/picgo-plugin-bootstrap`
  - `packages/picgo-plugin-app`
  - `libs/zhi-siyuan-picgo` only if current initialization or migration calls need a narrower API boundary
- Affected behavior:
  - topbar/menu entry interaction
  - settings shell mounting and teardown
  - startup/init/migration timing
  - configuration-change refresh messaging
- Not in scope:
  - Publisher integration work
  - headless PicGo library contract changes
  - replacing the full PicGo settings UI with a shared UI package
