## ADDED Requirements

### Requirement: PicGo lib release precedes Publisher headless UI integration

The PicGo repository SHALL treat this change as the upstream dependency of Publisher change `publisher-picgo-headless-ui`. Publisher implementation SHALL target the new PicGo lib contract that has been released or explicitly local-linked, rather than the old `zhi-siyuan-picgo` package behavior.

#### Scenario: Publisher change references PicGo contract

- **WHEN** Publisher implements `publisher-picgo-headless-ui`
- **THEN** its design SHALL reference this PicGo change as an upstream dependency
- **AND** it SHALL NOT treat the current old Publisher PicGo bridge behavior as the target contract

#### Scenario: PicGo lib is available before Publisher upgrades dependency

- **WHEN** Publisher upgrades `zhi-siyuan-picgo` to use the new headless contract
- **THEN** PicGo packages SHALL already be built and usable through an official release or explicit local-link workflow
- **AND** Publisher change SHALL record the version or link source used

### Requirement: Cross-repository responsibility boundary is clear

The PicGo repository SHALL own core upload behavior, configuration persistence semantics, uploader schema, validation, and SiYuan path resolution. Publisher SHALL only own its own lightweight UI and platform-level publishing preferences.

#### Scenario: Publisher renders its own UI but does not redefine PicGo configuration semantics

- **WHEN** Publisher renders PicGo-driven image-host settings
- **THEN** field definitions and save format SHALL come from the PicGo lib contract
- **AND** Publisher-specific selections, such as per-platform `picbedService`, SHALL remain in Publisher configuration

#### Scenario: PicGo plugin product remains optional

- **WHEN** a user installs Publisher but does not install `siyuan-plugin-picgo`
- **THEN** PicGo lib contract SHALL still allow Publisher to configure and use PicGo-driven uploaders
- **AND** missing capabilities SHALL be reported as lib/runtime/config issues, not as a requirement to install the PicGo plugin product
