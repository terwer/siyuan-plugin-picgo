## ADDED Requirements

### Requirement: Publisher uses the v2 PicGo path contract through the external lib
The system SHALL provide a supported integration path for `siyuan-plugin-publisher` to use bundled PicGo through `zhi-siyuan-picgo` without hardcoding legacy PicGo config paths.

#### Scenario: Publisher initializes PicGo with Siyuan config
- **WHEN** `siyuan-plugin-publisher` initializes PicGo through the external lib with a valid `SiyuanConfig`
- **THEN** the external lib SHALL resolve the bundled PicGo main config to `[workspace]/data/storage/syp/picgo/picgo.cfg.json`
- **THEN** the external lib SHALL resolve runtime and plugin dependencies to the device-local PicGo directory

#### Scenario: Publisher does not provide explicit paths
- **WHEN** publisher uses the default v2 external-lib integration without explicit path overrides
- **THEN** publisher SHALL NOT need to know or construct `~/.universal-picgo/picgo.cfg.json`, `widgets/sy-post-publisher/lib/picgo/picgo.cfg.json`, or other historical config paths

### Requirement: External lib supports explicit path overrides for debugging
The system SHALL allow advanced callers to override PicGo paths explicitly for local debugging while preserving the default v2 path contract.

#### Scenario: Publisher debug run passes explicit paths
- **WHEN** an advanced caller supplies explicit `configPath`, runtime directory, or plugin base directory to the external lib
- **THEN** the external lib SHALL use those supplied paths for that instance

#### Scenario: Publisher default run omits explicit paths
- **WHEN** an advanced caller does not supply explicit path overrides
- **THEN** the external lib SHALL use the standard v2 SiYuan workspace config and device-local runtime paths

### Requirement: Publisher integration documentation is reproducible
The system SHALL document a reproducible publisher integration test flow that uses the local external lib build and the v2 path contract.

#### Scenario: Developer follows publisher test documentation
- **WHEN** a developer follows the documented publisher integration test steps
- **THEN** the steps SHALL identify which package to build, how publisher should consume the local lib, how to run the integration, and how to verify the effective PicGo config/runtime paths

#### Scenario: Developer verifies path separation from publisher
- **WHEN** publisher triggers a PicGo upload through the external lib
- **THEN** the verification steps SHALL confirm that the main config comes from the SiYuan workspace and plugin/runtime files remain in `~/.universal-picgo`
