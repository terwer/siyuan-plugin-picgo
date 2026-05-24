# picgo-paste-upload-ownership Specification

## Purpose
TBD - created by archiving change picgo-internal-refactor. Update Purpose after archive.
## Requirements
### Requirement: Paste image upload is plugin-owned from the event source
When PicGo automatic paste upload is enabled, the plugin SHALL take exclusive ownership of the paste image flow before SiYuan default paste handling or internal asset upload runs.

#### Scenario: Default paste handling is blocked first
- **WHEN** a paste event contains image files and PicGo automatic paste upload is enabled
- **THEN** the plugin calls the real host event's default-prevention capability, such as `source.preventDefault()`, before starting any PicGo upload
- **AND** SiYuan's default image paste/internal asset upload path does not run for that image

#### Scenario: No ownership means no automatic takeover
- **WHEN** the plugin cannot prove that the real host paste event was prevented
- **THEN** the automatic PicGo takeover path is not considered valid for this refactor

### Requirement: Double-upload compensation is forbidden
The refactor SHALL NOT use double upload, delayed polling, DOM probing, or post-hoc markdown link swapping as the normal paste upload architecture.

#### Scenario: SiYuan uploadAsset is not used as paste compensation
- **WHEN** handling an automatic paste image upload
- **THEN** the normal path does not first upload to PicGo and then call SiYuan `uploadAsset` merely to create a local asset for later replacement

#### Scenario: Polling is not the transaction boundary
- **WHEN** handling an automatic paste image upload
- **THEN** correctness does not depend on `waitTimeout`, `retryTimes`, `JsTimer`, waiting for DOM images to appear, or searching block markdown after the fact

#### Scenario: Link replacement is not a stealth correction
- **WHEN** the final document link is written
- **THEN** it is written by the plugin-owned paste transaction, not by stealing/replacing a link inserted by SiYuan default paste behavior

### Requirement: Paste upload is a single explicit transaction
The plugin SHALL treat paste image upload as one explicit transaction covering input capture, PicGo upload, document mutation, metadata update, and failure handling.

#### Scenario: Successful paste has one final source of truth
- **WHEN** paste image upload succeeds
- **THEN** the document link, PicGo upload result, and `custom-picgo-file-map-key` metadata refer to the same plugin-owned image result
- **AND** there is no unmanaged default local asset result that must be reconciled later

#### Scenario: Failure is understandable and bounded
- **WHEN** PicGo upload, document insertion, or metadata update fails
- **THEN** the plugin leaves a bounded, user-understandable state rather than a half-updated mix of local asset, remote URL, stale metadata, and pending retry timers

### Requirement: Paste upload architecture is rewritten around a transaction boundary
The refactor SHALL replace the legacy paste compensation script with a product-level transaction boundary, such as `PasteUploadTransaction`, rather than wrapping the old path.

#### Scenario: Paste listener delegates to a transaction use case
- **WHEN** the bootstrap paste listener decides PicGo should handle a pasted image
- **THEN** it delegates to a paste upload transaction/application service after preventing the host default behavior
- **AND** the listener itself does not directly orchestrate PicGo upload, SiYuan asset upload, DOM lookup, block markdown replacement, and metadata mutation

#### Scenario: Responsibilities are separated by ports and adapters
- **WHEN** paste upload is refactored
- **THEN** host event parsing/default prevention is isolated in a paste event adapter
- **AND** final document insertion/replacement is isolated behind a document mutation port
- **AND** `custom-picgo-file-map-key` updates are isolated behind a metadata repository or equivalent boundary

### Requirement: Legacy compensation path is removed, not wrapped
The old double-upload compensation path SHALL be treated as a design defect to remove from automatic paste upload, not as a compatibility fallback.

#### Scenario: ignoreReplaceLink clipboard bypass is not the new core
- **WHEN** implementing the new paste transaction
- **THEN** the transaction does not depend on `uploadSingleImageToBed(..., ignoreReplaceLink=true)` followed by a separate bootstrap polling/replacement pass

#### Scenario: Default local asset is not an intermediate source of truth
- **WHEN** automatic paste upload succeeds
- **THEN** the final document state is produced from the plugin-owned remote upload result
- **AND** a SiYuan default local asset path is not created merely so the plugin can later replace it

### Requirement: Rollback behavior is designed before implementation
The refactor SHALL define bounded failure states for every stage of the paste transaction before accepting the implementation.

#### Scenario: PicGo upload fails after default paste is prevented
- **WHEN** the plugin has prevented the host default paste behavior and the PicGo upload fails
- **THEN** the plugin follows a defined rollback policy, such as inserting nothing with a clear error or inserting an explicit retry placeholder
- **AND** it does not trigger SiYuan default upload later as an implicit fallback

#### Scenario: Document mutation fails after remote upload succeeds
- **WHEN** PicGo upload succeeds but writing the final link into the document fails
- **THEN** the plugin reports a bounded recovery state and does not write metadata that claims the document contains the remote image

#### Scenario: Metadata commit fails after document mutation succeeds
- **WHEN** the final document link is written but metadata commit fails
- **THEN** the plugin reports a recoverable metadata-sync failure without starting delayed DOM polling or a second asset upload

### Requirement: Real host verification is mandatory
The refactor SHALL verify paste ownership against real SiYuan host behavior, not only against mocks or isolated unit tests.

#### Scenario: Host smoke proves default prevention
- **WHEN** the refactor is ready for review
- **THEN** a real SiYuan paste smoke or equivalent host-level automation demonstrates that default paste/internal upload was prevented before plugin upload began

#### Scenario: Mock-only proof is insufficient
- **WHEN** tests only mock the paste handler or only assert the final URL
- **THEN** those tests are insufficient to accept the paste upload refactor

