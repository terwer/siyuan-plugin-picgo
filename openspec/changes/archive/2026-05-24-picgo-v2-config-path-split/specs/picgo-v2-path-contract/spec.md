## ADDED Requirements

### Requirement: Workspace-synced PicGo main config
The system SHALL use `[workspace]/data/storage/syp/picgo/picgo.cfg.json` as the default Node/SiYuan desktop path for the bundled PicGo main configuration in v2.0.0.

#### Scenario: SiYuan desktop initializes bundled PicGo
- **WHEN** bundled PicGo is initialized inside a SiYuan desktop workspace with a known `workspaceDir`
- **THEN** the effective `configPath` SHALL be `[workspace]/data/storage/syp/picgo/picgo.cfg.json`

#### Scenario: Bundled PicGo saves uploader settings
- **WHEN** bundled PicGo saves image bed settings in SiYuan desktop
- **THEN** the settings SHALL be persisted to the workspace `picgo.cfg.json` file

### Requirement: Local runtime remains outside workspace sync
The system SHALL keep device-local runtime files under `~/.universal-picgo` and SHALL NOT place runtime-heavy or device-bound files under `[workspace]/data/storage/syp/picgo` by default.

#### Scenario: Runtime files are created
- **WHEN** bundled PicGo initializes runtime support for plugins, clipboard, i18n, logs, or zhi libraries
- **THEN** `package.json`, `package-lock.json`, `node_modules/`, `libs/`, `i18n-cli/`, clipboard scripts, clipboard image cache, and logs SHALL be created or read under `~/.universal-picgo`

#### Scenario: Workspace config directory remains lightweight
- **WHEN** the plugin has initialized and an upload flow has been exercised
- **THEN** `[workspace]/data/storage/syp/picgo` SHALL contain `picgo.cfg.json` as the synced main config and SHALL NOT receive `node_modules/`, `package-lock.json`, clipboard image cache, or runtime scripts from the v2 default path contract

### Requirement: External PicGo config stays device-local
The system SHALL keep `external-picgo-cfg.json` under the device-local PicGo directory and SHALL NOT sync it through the SiYuan workspace by default.

#### Scenario: External PicGo settings are read
- **WHEN** the plugin reads whether to use bundled PicGo or external PicGo
- **THEN** it SHALL read `external-picgo-cfg.json` from `~/.universal-picgo`

#### Scenario: External PicGo API differs per device
- **WHEN** one device configures an external PicGo API URL such as `http://127.0.0.1:36677`
- **THEN** that device-bound setting SHALL NOT be written to `[workspace]/data/storage/syp/picgo/external-picgo-cfg.json` by the v2 default path contract

### Requirement: Config path and runtime path are independent
The system SHALL support separate effective paths for `configPath`, device runtime directory, and PicGo plugin dependency directory.

#### Scenario: Config path points to workspace
- **WHEN** `configPath` is set to `[workspace]/data/storage/syp/picgo/picgo.cfg.json`
- **THEN** the runtime directory SHALL remain `~/.universal-picgo` unless explicitly overridden

#### Scenario: PicGo plugin dependencies are loaded
- **WHEN** PicGo third-party plugins are listed, loaded, installed, updated, or uninstalled
- **THEN** the plugin package metadata and `node_modules` SHALL be resolved through the device-local plugin base directory rather than through `dirname(configPath)`

### Requirement: Conservative v2 config migration
The system SHALL migrate from the 1.6.0+ home config to the v2 workspace config by copying only `picgo.cfg.json` when the workspace config is missing.

#### Scenario: Workspace config missing and home config exists
- **WHEN** `[workspace]/data/storage/syp/picgo/picgo.cfg.json` does not exist and `~/.universal-picgo/picgo.cfg.json` exists
- **THEN** the system SHALL copy the home `picgo.cfg.json` to the workspace config path
- **THEN** the system SHALL keep the home `picgo.cfg.json` unchanged

#### Scenario: Workspace config already exists
- **WHEN** both workspace and home `picgo.cfg.json` exist
- **THEN** the system SHALL use the workspace config as authoritative
- **THEN** the system SHALL NOT overwrite the workspace config from the home config

#### Scenario: No destructive directory migration
- **WHEN** v2 migration runs
- **THEN** the system SHALL NOT move, delete, or recursively migrate the entire `[workspace]/data/storage/syp/picgo` directory

### Requirement: Effective paths are observable for debugging
The system SHALL make the effective PicGo paths observable through logs or a debug API so tests can confirm which files are in use.

#### Scenario: PicGo initializes in development or test
- **WHEN** bundled PicGo initializes during development or test
- **THEN** logs or debug output SHALL include the effective main config path, runtime directory, and plugin base directory
