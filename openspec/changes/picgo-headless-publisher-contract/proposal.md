## Why

`zhi-siyuan-picgo` is already used as an external lib by `siyuan-plugin-publisher`, but current consumers can still easily conflate the "PicGo upload core / configuration model" with the full `siyuan-plugin-picgo` plugin product. Publisher users are required to install the full PicGo plugin in order to use PicGo image-hosting capabilities, which creates a fragmented experience and also pushes Publisher V2 image-hosting settings toward the wrong plugin-dependency design.

A stable headless public contract now needs to be defined first in the PicGo repository: external plugins can independently read/save PicGo configuration, list image hosts, render a lightweight configuration UI, validate configuration, and perform uploads without depending on whether the `siyuan-plugin-picgo` plugin is installed.

## What Changes

- Add a PicGo headless manager contract for external consumers, with `zhi-siyuan-picgo` exposing the SiYuan scenario entrypoint.
- Add configuration management capabilities: read full configuration, read the current image host, save image-host configuration, switch the current image host, write defaults, and perform conservative migration.
- Add uploader metadata capabilities: list built-in uploaders, get uploader configuration schema, and declare field types/defaults/required flags/sensitive fields/descriptions.
- Add configuration validation capabilities: provide structured validation results before saving and test uploads, so Publisher does not copy validation logic itself.
- Add an upload capability contract: external consumers can use the same instance to upload files/Blobs/paths and call Markdown image upload-and-replace capability.
- Clarify that the `siyuan-plugin-picgo` plugin product is no longer a runtime prerequisite for the external lib; external consumers only depend on the npm package and their own UI.
- Clarify that this change is the upstream dependency of the `siyuan-plugin-publisher` repository change `publisher-picgo-headless-ui`; Publisher should integrate the new dependency only after the PicGo lib release is complete.
- **BREAKING**: the v2 public contract may clean up old implicit path and plugin-detection assumptions, but must provide clear migration instructions and test steps.

## Capabilities

### New Capabilities

- `picgo-headless-config-contract`: public contract for external consumers to independently manage PicGo configuration, image-host schema, and upload capabilities.
- `picgo-publisher-integration-contract`: cross-repository integration boundary, release order, and mutual reference rules between the PicGo lib and Publisher.

### Modified Capabilities

- None.

## Impact

- Affected packages:
  - `libs/Universal-PicGo-Core`
  - `libs/Universal-PicGo-Store`
  - `libs/zhi-siyuan-picgo`
  - `packages/picgo-plugin-app` is only an internal consumer reference for the same underlying contract; it is not a UI package for Publisher to reuse.
- Affected public API:
  - `zhi-siyuan-picgo` export entrypoint for SiYuan consumers.
  - `universal-picgo` export entrypoint for generic headless configuration/upload management.
- Affected documentation:
  - Release instructions and external consumer integration instructions in lib README / DEVELOPMENT.md.
  - Cross-repository reference to Publisher change `publisher-picgo-headless-ui`.
- Consumer impact:
  - `siyuan-plugin-publisher` will later upgrade to the new lib and remove the hard dependency on the installed `siyuan-plugin-picgo` plugin product.
