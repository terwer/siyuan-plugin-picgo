## ADDED Requirements

### Requirement: Headless consumers can create a PicGo manager without depending on an installed plugin product

`zhi-siyuan-picgo` SHALL expose a public headless manager or equivalent facade for SiYuan consumers. Creating and using this facade MUST NOT require `siyuan-plugin-picgo` to already be installed as a SiYuan plugin, and MUST NOT require `/data/plugins/siyuan-plugin-picgo` to exist.

#### Scenario: Publisher creates manager when the PicGo plugin product is not installed

- **WHEN** an external consumer creates a headless manager in a SiYuan workspace where `/data/plugins/siyuan-plugin-picgo/plugin.json` does not exist
- **THEN** manager creation SHALL succeed as long as the npm package and runtime environment are available
- **AND** the PicGo lib contract SHALL NOT require the caller to perform plugin installation detection

#### Scenario: Standalone PicGo plugin continues using the same underlying contract

- **WHEN** `siyuan-plugin-picgo` internally uses PicGo configuration and upload behavior
- **THEN** it SHALL continue to work normally as a product shell based on the same underlying lib contract
- **AND** that product shell SHALL NOT become a required runtime dependency for external consumers

### Requirement: Headless consumers can read and save PicGo configuration

Headless manager SHALL provide public methods to read the current PicGo configuration and save bounded configuration updates; callers do not need to instantiate internal DB classes directly.

#### Scenario: Read current configuration

- **WHEN** an external consumer requests the current PicGo configuration
- **THEN** manager SHALL return persisted configuration with default sections initialized
- **AND** manager SHALL preserve unknown fields to ensure compatibility with future versions

#### Scenario: Save one uploader configuration without overwriting unknown fields

- **WHEN** an external consumer saves the configuration for one uploader
- **THEN** manager SHALL update only the target uploader configuration and necessary current-uploader metadata
- **AND** unrelated uploader configuration, plugin configuration, and unknown fields SHALL remain unchanged

### Requirement: Headless consumers can manage the current uploader

Headless manager SHALL expose public methods to read and set the current uploader used by upload operations.

#### Scenario: Set current uploader

- **WHEN** an external consumer sets the current uploader to a supported uploader id
- **THEN** subsequent uploads based on the same persisted configuration SHALL use that uploader
- **AND** configuration SHALL record the selected uploader using the PicGo canonical config structure

#### Scenario: Reject unknown uploader id

- **WHEN** an external consumer tries to set the current uploader to an unknown uploader id
- **THEN** manager SHALL return or throw a structured validation error
- **AND** the persisted current uploader SHALL NOT be modified

### Requirement: Headless consumers can list supported built-in uploaders

Headless manager SHALL provide the list of built-in uploaders available in the current runtime, including stable uploader ids that can be used to save configuration and perform uploads.

#### Scenario: List built-in uploaders

- **WHEN** an external consumer requests the uploader list
- **THEN** manager SHALL include the built-in uploaders registered by `universal-picgo`
- **AND** each item SHALL include at least id, display name, whether it is built in, and whether schema is available

### Requirement: Headless consumers can get uploader configuration schema

Headless manager SHALL expose configuration schema for supported built-in uploaders. The schema SHALL provide enough metadata for consumers to render lightweight configuration forms without importing `picgo-plugin-app` UI code.

#### Scenario: Get schema for a built-in uploader

- **WHEN** an external consumer requests the schema for a supported built-in uploader
- **THEN** manager SHALL return field metadata, including field name, field type, label or message key, whether required, known default value, whether sensitive, and options for list fields

#### Scenario: Schema is not bound to Vue or Element Plus

- **WHEN** a consumer reads uploader schema
- **THEN** schema SHALL be plain serializable data
- **AND** schema SHALL NOT depend on Vue components, Element Plus components, or `picgo-plugin-app` imports

### Requirement: Headless consumers can validate uploader configuration

Headless manager SHALL expose uploader configuration validation before save and test upload.

#### Scenario: Validate valid uploader configuration

- **WHEN** an external consumer validates the complete configuration for a supported uploader
- **THEN** manager SHALL return a successful validation result
- **AND** the result SHALL identify the validated uploader id

#### Scenario: Validate missing required fields

- **WHEN** an external consumer validates configuration that is missing required fields
- **THEN** manager SHALL return structured validation failure including field names and messages
- **AND** manager SHALL NOT persist invalid configuration unless the caller explicitly uses a documented unsafe raw escape hatch

### Requirement: Headless consumers can upload through managed configuration

Headless manager SHALL provide upload entrypoints that use the same managed configuration and current uploader state.

#### Scenario: Upload one image

- **WHEN** an external consumer uploads a supported image input through the headless manager
- **THEN** manager SHALL use the current uploader from managed configuration
- **AND** manager SHALL return PicGo image output, or return a structured error consistent with existing upload behavior

#### Scenario: Upload Markdown images

- **WHEN** an external consumer uploads images referenced in Markdown through the SiYuan facade
- **THEN** facade SHALL preserve the existing Markdown replacement behavior of `SiyuanPicGo`
- **AND** facade SHALL use the same configuration source as the headless manager

### Requirement: Headless contract uses canonical path resolution

Headless manager SHALL use path resolution rules consistent with `picgo-v2-config-path-split`, and SHALL NOT require consumers to manually construct config/runtime/plugin paths.

#### Scenario: Resolve paths in a SiYuan workspace

- **WHEN** a SiYuan consumer creates manager with SiYuan config
- **THEN** `zhi-siyuan-picgo` SHALL internally resolve workspace config and local runtime paths
- **AND** the consumer SHALL not need to know the physical path layout

#### Scenario: Keep device-local runtime separated

- **WHEN** manager initializes plugin runtime, logs, cache, external PicGo configuration, or dependency directories
- **THEN** these device-local artifacts SHALL follow v2 path split rules
- **AND** they SHALL NOT be saved to the workspace-synced `picgo.cfg.json` location unless the path split contract explicitly specifies it
