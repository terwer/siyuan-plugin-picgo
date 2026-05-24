## ADDED Requirements

### Requirement: Plugin product and library roles are explicit
The refactor SHALL define separate architectural roles for the SiYuan plugin product and the reusable PicGo/Siyuan libraries.

#### Scenario: Package role matrix is documented
- **WHEN** the refactor baseline is recorded
- **THEN** each workspace package is classified as product shell, UI app, Siyuan adapter, application facade, domain core, store/port, host adapter, or build-only script

#### Scenario: Dependency direction is one-way
- **WHEN** packages depend on shared capabilities
- **THEN** product code depends on facades/adapters and domain libraries, while domain libraries do not depend on product UI, SiYuan DOM, Electron menus, or plugin packaging concerns

### Requirement: Reusable library entrypoints are not product catch-alls
Reusable library packages SHALL expose stable, target-specific public entrypoints instead of a single opaque `dist/index.js` that mixes UI, host, runtime, and domain concerns.

#### Scenario: Public exports are intentional
- **WHEN** downstream code imports `universal-picgo`, `universal-picgo-store`, or `zhi-siyuan-picgo`
- **THEN** the imported entrypoint represents a documented public contract for that target runtime

#### Scenario: Deep source imports are blocked
- **WHEN** plugin product code needs a helper currently located inside a library source tree
- **THEN** the helper is exposed through a deliberate facade or moved to the product layer, and product code does not import library `src` paths directly

### Requirement: Domain core is UI and host neutral
The PicGo domain core SHALL avoid direct dependencies on product UI frameworks, SiYuan DOM state, Electron-only UI helpers, and implicit global runtime detection.

#### Scenario: UI framework does not leak into lib core
- **WHEN** a reusable library main entry is built
- **THEN** Vue, Element Plus, product components, and product-only UI helpers are absent unless the entrypoint is explicitly documented as a UI adapter

#### Scenario: Host capabilities are accessed through ports
- **WHEN** code requires filesystem, clipboard, Electron remote, SiYuan kernel API, npm plugin management, or localStorage behavior
- **THEN** the capability is provided through an explicit port/adapter boundary rather than direct `win.require`, `SiyuanDevice.siyuanWindow`, or global `hasNodeEnv` probing from arbitrary layers

### Requirement: Lifecycle ownership is explicit
The refactor SHALL make ownership of PicGo context, Siyuan API clients, configuration migration, event bus subscriptions, and plugin loader state explicit.

#### Scenario: Singleton state is justified or removed
- **WHEN** `SiyuanPicGo`, `picgoEventBus`, or `UniversalPicGo` lifecycle state is used
- **THEN** the owner, initialization timing, reset behavior, and test strategy are documented

#### Scenario: Core construction has bounded side effects
- **WHEN** a PicGo core object is constructed by a library consumer
- **THEN** construction does not implicitly perform unrelated product operations such as UI setup, host migration, npm plugin installation, or third-party plugin loading unless explicitly requested by a lifecycle step

### Requirement: Product and library builds are verified independently
The refactor SHALL verify plugin product bundles and publishable library bundles as separate outputs with separate constraints.

#### Scenario: Product bundle uses product facade
- **WHEN** the SiYuan plugin artifact is built
- **THEN** bootstrap and app code consume product-level facades/adapters rather than library internals or prebuilt opaque library bundles

#### Scenario: Library bundle remains reusable
- **WHEN** publishable library artifacts are built
- **THEN** they do not include product-only UI dependencies, plugin packaging assets, SiYuan DOM assumptions, or unbounded Node/Electron escape paths in generic entrypoints
