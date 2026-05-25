## Context

`picgo-internal-refactor` has started to converge the responsibility boundaries of `picgo-plugin-bootstrap`, `picgo-plugin-app`, `Universal-PicGo-Core`, `Universal-PicGo-Store`, and `zhi-siyuan-picgo`. `picgo-v2-config-path-split` is handling the v2 configuration path split: workspace-synced configuration is separated from device-local runtime/plugin dependencies.

On top of this foundation, external consumers still lack a clear headless public contract. Publisher currently depends on the old `zhi-siyuan-picgo` and continues the idea of "detecting and opening the full PicGo plugin" in V2 image-host settings. This is not the future goal and should only be treated as a sample of the old-scheme problem. The real order is: first complete and release the new lib in the PicGo repository, then let Publisher upgrade the dependency and implement its own lightweight image-host UI.

## Goals / Non-Goals

**Goals:**

- Allow external plugins to use PicGo image-hosting capabilities by depending only on the npm lib, without requiring the `siyuan-plugin-picgo` plugin to be installed.
- Provide a stable headless manager/facade covering configuration read/write, uploader list, schema, validation, current image-host switching, and upload.
- Allow Publisher to implement its own lightweight UI, while field definitions, defaults, validation, and save format come from the PicGo lib, avoiding a second image-host model.
- Align with `picgo-v2-config-path-split`: configuration paths, runtime paths, external PicGo configuration, and log/cache paths must go through the same resolver entrypoint so consumers do not guess paths.
- Keep the `siyuan-plugin-picgo` plugin product usable, while no longer making it the runtime dependency external consumers must install.
- Provide a verifiable contract and task order for release and Publisher integration.

**Non-Goals:**

- Do not extract the full settings page from `picgo-plugin-app` for Publisher to use.
- Do not require Publisher to support the PicGo plugin marketplace or the full PicGo desktop configuration experience.
- Do not copy Universal-PicGo internal uploader implementation or configuration model into Publisher.
- Do not let this change directly modify the Publisher repository; Publisher implementation is owned by `publisher-picgo-headless-ui`.
- Do not use Publisher's current old lib code as the final target architecture basis.

## Decisions

### 1. Headless manager first, not shared UI

The PicGo repository provides a headless manager/facade, and Publisher implements its own lightweight UI.

```text
Publisher V2 UI
  └─ PicGo headless manager from zhi-siyuan-picgo
      ├─ listUploaders()
      ├─ getUploaderSchema(type)
      ├─ getConfig()/saveUploaderConfig()
      ├─ setCurrentUploader()
      ├─ validateUploaderConfig()
      └─ upload()/uploadMarkdownImages()
```

Reason: Publisher's problem is not the lack of the full PicGo settings page, but the lack of a trusted underlying configuration/upload contract. Sharing the full UI would leak the PicGo plugin product boundary back into Publisher.

Alternative: extract a shared `picgo-config-ui` package. Not adopted for now, because it would easily bring in full plugin product state, while Publisher only needs a lightweight configuration experience for publishing scenarios.

### 2. Configuration model is owned by the lib, UI is owned by consumers

- `universal-picgo` / `zhi-siyuan-picgo` own the configuration structure, defaults, schema, validation, and persistence semantics.
- `siyuan-plugin-publisher` owns its own presentation, platform-level image-host selection, and publishing preferences.
- Publisher may whitelist some uploaders for display, but must not redefine field meanings or save formats.

### 3. Schema must be sufficient to drive lightweight forms

Each uploader schema provides at least:

- uploader id
- display name
- description
- field list
- field types: `input` / `password` / `confirm` / `list` / future extensible types
- whether required
- default value
- source path of current value
- whether it is a sensitive field
- validation hint / options

This lets Publisher choose either "schema auto-rendering" or "handwritten form + schema alignment", without needing to copy configuration logic from the PicGo plugin UI.

### 4. SiYuan path resolution only goes through zhi-siyuan-picgo

External consumers do not directly concatenate `[workspace]/data/storage/syp/...` or `~/.universal-picgo/...`. `zhi-siyuan-picgo` provides instance creation and path resolution, internally reusing the result from `picgo-v2-config-path-split`.

### 5. Publisher integration is based on the released lib

After this change is complete, the new versions of `universal-picgo`, `universal-picgo-store`, and `zhi-siyuan-picgo` must be released first. Publisher change can only be implemented after upgrading to the new dependency, and should not apply temporary patches against the old package.

## Risks / Trade-offs

- [Risk] Schema is too weak, so Publisher still has to hardcode many fields. → Mitigation: every built-in uploader must have a schema audit, covering at least the fields required by the current PicGo settings page.
- [Risk] Schema is too strong and becomes a UI framework. → Mitigation: describe only data and validation; provide no Vue components and do not bind to Element Plus.
- [Risk] Publisher and the PicGo plugin modify the same configuration at the same time and cause overwrite. → Mitigation: configuration writes must be read-modify-write based; saves only write the target uploader/current fields and do not overwrite unknown fields.
- [Risk] v2 path split conflicts with the headless contract. → Mitigation: headless manager creation must reuse the same path resolver and must not add a second path rule set.
- [Risk] Third-party PicGo plugin configuration cannot be made lightweight. → Mitigation: the first version only requires built-in uploader schema; third-party plugin support can remain a non-goal or read-only/advanced JSON for later discussion.

## Migration Plan

1. Implement the headless contract in the PicGo repository while keeping the standalone PicGo plugin product working normally.
2. Internally verify with the `siyuan-plugin-picgo` settings page and upload smoke that the new contract does not break existing functionality.
3. Release the new lib packages externally.
4. In the Publisher repository, `publisher-picgo-headless-ui` upgrades the dependency to the new `zhi-siyuan-picgo` and rewrites V2 image-host settings.
5. Publisher removes the old entrypoints that checked "PicGo plugin must be installed" and opened the PicGo plugin iframe.

## Open Questions

- Should the first Publisher version display all built-in uploaders, or only a whitelist? This contract supports both; Publisher change decides the UI scope.
- Should third-party PicGo plugin/uploaders enter Publisher lightweight UI in the future? They are not required in the first version.
- Should the standalone `siyuan-plugin-picgo` plugin and Publisher share the same workspace PicGo configuration by default? The current preference is to share the same lib configuration, while Publisher still keeps its own platform-level `picbedService` preference.
