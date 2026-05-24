# picgo-runtime-boundary-integrity Specification

## Purpose
TBD - created by archiving change picgo-internal-refactor. Update Purpose after archive.
## Requirements
### Requirement: Runtime capability boundaries are explicit
The plugin SHALL define and enforce explicit runtime capability boundaries instead of relying on implicit Node/browser fallback behavior.

#### Scenario: Browser target excludes Node escape paths
- **WHEN** the browser-facing plugin bundle is built
- **THEN** the bundle does not include unapproved direct `eval`, `eval("require")`, `vm-browserify`, or Node polyfill escape paths

#### Scenario: Host or Node capabilities are injected deliberately
- **WHEN** code requires SiYuan/Electron/Node-only capabilities
- **THEN** those capabilities are accessed through an explicit host adapter or facade rather than dynamic global probing

### Requirement: Direct eval warnings are treated as architecture failures
The refactor SHALL treat direct `eval` warnings as evidence of runtime-boundary or dependency-design defects, not as isolated code-style findings.

#### Scenario: Eval warning root cause is traced
- **WHEN** build output reports direct `eval` or `eval("require")`
- **THEN** the dependency path, target runtime, and architectural cause are documented before any local implementation change is accepted

#### Scenario: Single-line suppression is rejected
- **WHEN** a proposed change only aliases, ignores, patches `node_modules`, or rewrites the reported `eval` occurrences without changing the boundary that allowed them into the bundle
- **THEN** the change is not sufficient for this refactor

### Requirement: Dependency inputs are controlled by target runtime
The plugin SHALL consume dependencies through source, conditional exports, or stable facades appropriate to the target runtime, rather than opaque pre-bundled artifacts that hide incompatible fallback code.

#### Scenario: Opaque dist bundle is identified
- **WHEN** a workspace or tightly coupled dependency is consumed from a prebuilt `dist` artifact
- **THEN** the refactor records whether that artifact contains bundled polyfills, dynamic require, or generated eval paths before treating it as acceptable

#### Scenario: Runtime-specific entrypoints are selected
- **WHEN** a package is used by both browser-facing and Node/host-facing code
- **THEN** its public contract exposes runtime-specific entrypoints or adapters so each target receives only the capabilities it can safely execute

### Requirement: Bundle verification gates architecture completion
The internal refactor SHALL NOT be considered complete until bundle verification proves that forbidden runtime capabilities have not leaked into the wrong target.

#### Scenario: Bundle audit passes
- **WHEN** the refactor is ready for review
- **THEN** build verification includes an audit for direct `eval`, `new Function`, `eval("require")`, `vm-browserify`, and unintended Node polyfills in target artifacts

#### Scenario: Approved exception is explicit
- **WHEN** a dynamic-code or Node-polyfill pattern is intentionally retained for a specific target
- **THEN** the exception names the target, owner, reason, and containment boundary, and is not used to justify browser-bundle leakage

