# PicGo 3.0 Unified Async Config Source — Implementation Plan

> **For Hermes:** Implement task-by-task, following TDD for all new code.

**Goal:** Implement PicGo 3.0 unified async configuration facade that supersedes v2 main-config-only persistence boundary, covering all user configuration domains through a single ready barrier.

**Architecture:** New `UnifiedPicGoConfigFacade` in `libs/Universal-PicGo-Core` routes all config reads/writes to domain-specific owner files (picgo.cfg.json, external-picgo-cfg.json, siyuan-cfg). V3 migration imports legacy data per-domain. All callers (UI, headless, upload, paste, uploaders) use the async facade instead of direct DB/localStorage reads.

**Tech Stack:** TypeScript, Universal-PicGo-Store (JSONStore adapters), Vue 3 (UI), SiYuan Kernel API

---

## Phase 1: Foundation — Types, Facade Contract, and Core Implementation

### Task 1.1: Define unified config types
**Files:**
- Create: `libs/Universal-PicGo-Core/src/config/UnifiedConfigTypes.ts`

```ts
type ConfigDomain =
  | "picgoMain" | "picgoSettings" | "siyuanBehavior" | "siyuanConnection"
  | "externalPicList" | "pluginValues" | "uploaderConfig" | "lskyState" | "pasteBootstrap"

interface UnifiedConfigSnapshot { ... }
interface ReadyUnifiedPicGoConfigFacade { ... }
interface UnifiedConfigMigrationState { ... }
```

### Task 1.2: Define and export ConfigDomain constants & owner file mapping
**Files:** Create `libs/Universal-PicGo-Core/src/config/ConfigDomainMapping.ts`

### Task 1.3: Implement ConfigNotReadyError and ConfigFlushError
**Files:** Create `libs/Universal-PicGo-Core/src/config/ConfigErrors.ts`

### Task 1.4: Implement mask utility
**Files:** Create `libs/Universal-PicGo-Core/src/config/MaskUtils.ts`

### Task 1.5: Implement per-domain default-generated recognition
**Files:** Create `libs/Universal-PicGo-Core/src/config/DefaultRecognition.ts`

### Task 1.6: Implement V3 migration state management
**Files:** Create `libs/Universal-PicGo-Core/src/config/V3MigrationState.ts`

---

## Phase 2: Unified Async Config Facade Core

### Task 2.1: Implement resolveOwnerStorageAdapter
**Files:** 
- Create: `libs/Universal-PicGo-Core/src/config/StorageAdapterResolver.ts`

### Task 2.2: Implement facade initialization (createUnifiedPicGoConfigFacade)
**Files:** 
- Create: `libs/Universal-PicGo-Core/src/config/UnifiedConfigFacade.ts`

### Task 2.3: Implement facade domain getters/setters
### Task 2.4: Implement flush/reload with debounce and writeVersion
### Task 2.5: Implement maskSnapshot
### Task 2.6: Wire facade exports through index.ts

---

## Phase 3: V3 Migration Service

### Task 3.1: Implement per-domain migration importers
### Task 3.2: Implement migration orchestration (run, retry)
### Task 3.3: Integrate migration into facade initialization

---

## Phase 4: Fix ExternalPicgoConfigDb for async backend

### Task 4.1: Add ensureReady() / ready-before-default to ExternalPicgoConfigDb

---

## Phase 5: Update siyuanPicgo.ts to route all owner files through KernelAdapter

---

## Phase 6: Caller Refactoring

### Task 6.1: Refactor settings UI stores
### Task 6.2: Refactor headless API
### Task 6.3: Refactor upload dispatch (SiyuanPicGoUploadApi)
### Task 6.4: Refactor Lsky uploader
### Task 6.5: Refactor useSiyuanSetting

---

## Phase 7: Paste/Bootstrap Refactoring

---

## Phase 8: Tests & Verification

---

**Implementation starts now. Will proceed phase by phase.**
