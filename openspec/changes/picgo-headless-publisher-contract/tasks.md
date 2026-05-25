## 1. Contract shape

- [ ] 1.1 Define the public headless manager/facade API names, input types, return types, and error structures for `universal-picgo` and `zhi-siyuan-picgo`.
- [ ] 1.2 Clarify which APIs belong to generic `universal-picgo` and which SiYuan-specific APIs belong to `zhi-siyuan-picgo`.
- [ ] 1.3 Document clearly that external consumers do not need to install the `siyuan-plugin-picgo` plugin product.
- [ ] 1.4 Add TypeScript exported types: uploader list item, uploader schema field, validation result, and headless manager options.

## 2. Configuration management

- [ ] 2.1 Implement the public configuration read API, able to initialize defaults and preserve unknown fields.
- [ ] 2.2 Implement bounded uploader configuration save API that cannot overwrite unrelated configuration sections.
- [ ] 2.3 Implement current uploader read/set APIs and use the PicGo canonical config structure.
- [ ] 2.4 Ensure configuration operations use the v2 path resolver from `picgo-v2-config-path-split` and do not create a second routing rule set.
- [ ] 2.5 Add legacy configuration migration if needed; migration semantics must match the path split decisions of copy-only/no-delete/no-overwrite.

## 3. Uploader metadata and Schema

- [ ] 3.1 Inventory all built-in uploaders registered by `Universal-PicGo-Core`.
- [ ] 3.2 Normalize each built-in uploader's configuration definition into serializable schema metadata.
- [ ] 3.3 Mark sensitive fields such as token, secret, and password in the schema.
- [ ] 3.4 Include defaults, required markers, field types, and list options when available.
- [ ] 3.5 Add an audit: fail if a built-in uploader is missing a schema, or if a configuration item cannot be represented as lightweight UI fields.

## 4. Validation and upload

- [ ] 4.1 Implement uploader configuration validation API returning structured field-level errors.
- [ ] 4.2 Ensure save and test-upload paths use the same validation rules unless they go through a documented raw escape hatch.
- [ ] 4.3 Expose upload entrypoints that use managed configuration and the current uploader.
- [ ] 4.4 Ensure the existing `SiyuanPicGo` Markdown image replacement capability can use the same configuration source and path resolution.
- [ ] 4.5 Add structured error handling for unknown uploader id, missing required fields, invalid configuration, and upload failures.

## 5. Documentation and release

- [ ] 5.1 Update lib README or DEVELOPMENT docs with a SiYuan plugin headless consumer usage example.
- [ ] 5.2 Document the build and release order for `universal-picgo-store`, `universal-picgo`, and `zhi-siyuan-picgo`.
- [ ] 5.3 Cross-reference Publisher change `publisher-picgo-headless-ui` in the docs, explaining that Publisher implementation must start after lib release/link.
- [ ] 5.4 Document what is not provided: shared Vue UI, dependency on the PicGo plugin product, and complete third-party plugin configuration UI.

## 6. Verification

- [ ] 6.1 Add unit tests for configuration read/save/current-uploader operations.
- [ ] 6.2 Add unit tests or focused integration tests for uploader list and schema output.
- [ ] 6.3 Add validation tests for required fields and unknown uploader id.
- [ ] 6.4 Successfully build `universal-picgo-store`, `universal-picgo`, and `zhi-siyuan-picgo`.
- [ ] 6.5 Verify in the SiYuan `test` workspace that `siyuan-plugin-picgo` can still open the settings page and upload through the existing product UI.
- [ ] 6.6 Provide a local-link or packed-package smoke path that Publisher can use before the final npm release.
