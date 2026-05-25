## ADDED Requirements

### Requirement: Public API stability under internal refactor
The plugin SHALL preserve its public API surface while internal modules are refactored.

#### Scenario: Existing plugin entry remains stable
- **WHEN** the plugin is built and loaded by SiYuan
- **THEN** the existing plugin entry and manifest-facing contract remain compatible with the current release behavior

#### Scenario: Public exports remain stable
- **WHEN** downstream code imports the published workspace packages
- **THEN** the exported symbols and module paths that form the public API remain available unless a separate breaking change is explicitly proposed

### Requirement: Persistent data compatibility
The plugin SHALL continue to read and write existing user configuration, cache, and storage data without requiring migration that breaks current installs.

#### Scenario: Existing data is still readable
- **WHEN** a user opens an existing installation after the refactor
- **THEN** previously stored configuration and metadata remain readable by the current runtime

#### Scenario: Existing data is still writable
- **WHEN** the user changes settings or uploads images
- **THEN** the plugin continues writing data in the same externally compatible contract unless a separate migration is explicitly approved

### Requirement: User-visible behavior remains equivalent
The plugin SHALL preserve the observable behavior of the current bootstrap, settings, upload, and Siyuan integration flows.

#### Scenario: Core flows behave the same
- **WHEN** a user opens settings, uploads an image, or interacts with the Siyuan integration surface
- **THEN** the user-visible flow remains functionally equivalent to the current release

### Requirement: Refactor completion requires contract verification
The internal refactor SHALL NOT be considered complete until contract checks and runtime validation confirm that external behavior is unchanged.

#### Scenario: Verification gates pass
- **WHEN** the refactor is ready for review
- **THEN** contract tests, build checks, and host smoke provide evidence that the public API and user-visible behavior were preserved
