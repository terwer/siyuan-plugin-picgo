# Fix: ExternalPicgoConfigDb defaults lost by JSONStore.loadFromRemote()

> **For Hermes:** Implement task-by-task, TDD.

**Goal:** Fix the bug where `ExternalPicgoConfigDb` defaults (`picgoType="Bundled"`) are wiped by `JSONStore.loadFromRemote()` replacing `this.data`, causing settings UI to show empty dropdown instead of "内置 PicGo".

**Root Cause:** `JSONStore.read()` returns `this.data`. For async backends:
1. Constructor starts `loadFromRemote()` (async, sets `this.data = remoteData`)
2. `ExternalPicgoConfigDb.doSafeSet()` writes defaults to `this.data` (sync, in-memory)
3. `loadFromRemote()` completes → **replaces `this.data` wholesale** → defaults lost
4. If remote data is `{}` (empty file), defaults are gone; if remote data has `useBundledPicgo:false`, defaults are overridden

**Architecture:** Make `ExternalPicgoConfigDb.read()` merge `initialValue` defaults on top of whatever `JSONStore.read()` returns, ensuring the settings UI always sees sensible defaults even during async race windows.

**Tech Stack:** TypeScript, universal-picgo-store (JSONStore)

---

### Task 1: Write failing test — defaults survive loadFromRemote overwrite

**Objective:** Reproduce the bug in a test.

**Files:**
- Modify: `libs/Universal-PicGo-Core/src/config/SettingsStorePattern.spec.ts` (add test)
- Create: `libs/Universal-PicGo-Core/src/config/ExternalPicgoDefaultSurvival.spec.ts`

**Step 1: Write test that simulates async backend clearing defaults**

```ts
it("external defaults survive JSONStore.loadFromRemote() overwrite", async () => {
  // Simulate async adapter where loadFromRemote returns {} (empty file)
  // The ExternalPicgoConfigDb must still return defaults after read()
  let remoteData: Record<string, any> = {}
  const asyncAdpt = {
    mode: "async" as const,
    read: async () => remoteData,
    write: async (d: Record<string, any>) => { remoteData = d },
  }
  
  // Directly create ExternalPicgoConfigDb and test its read() output
  const ctx = { configPath: "test", pluginBaseDir: "test", log: { error: () => {} } } as any
  const db = new ExternalPicgoConfigDb(ctx) // should seed defaults
  await (db as any).ensureReady() // wait for remote load
  
  const data = db.read()
  expect(data.picgoType).toBe("Bundled")
  expect(data.useBundledPicgo).toBe(true)
})
```

**Step 2: Run test to verify failure**
Run: `pnpm --filter universal-picgo test -- --run src/config/ExternalPicgoDefaultSurvival.spec.ts`
Expected: FAIL — `picgoType` is `undefined`

### Task 2: Fix ExternalPicgoConfigDb.read() to merge defaults

**Objective:** Modify `read()` to always return initial defaults merged with stored data.

**Files:**
- Modify: `libs/Universal-PicGo-Core/src/db/externalPicGo/index.ts:51-53`

**Step 3: Implement the fix**

```ts
read(flush?: boolean): IJSON {
  const stored = this.db.read(flush)
  // PicGo 3.0: Merge initialValue defaults on top of stored data.
  // This ensures the UI always sees sensible defaults even when
  // JSONStore.loadFromRemote() has replaced this.data mid-flight.
  // initialValue keys take precedence only when stored has no value.
  return { ...this.initialValue, ...(stored ?? {}) }
}
```

**Step 4: Run test to verify pass**
Run: `pnpm --filter universal-picgo test -- --run src/config/ExternalPicgoDefaultSurvival.spec.ts`
Expected: PASS

### Task 3: Verify all existing tests still pass

**Step 5: Run full test suite**
Run: `pnpm --filter universal-picgo test -- --run`
Expected: 174+ tests pass

### Task 4: Verify against errlog.txt scenario

**Step 6: Build and check**
Run: `pnpm --filter universal-picgo build && pnpm --filter zhi-siyuan-picgo build`
Expected: builds pass, user can test in SiYuan

---

### Task 5: Add same fix to ConfigDb.read() for consistency

**Files:**
- Modify: `libs/Universal-PicGo-Core/src/db/config/index.ts`

Apply same merge pattern to `ConfigDb.read()` for consistency.

---

### Verification

After all tasks:
- `ExternalPicgoConfigDb.read()` always returns `{ useBundledPicgo: true, picgoType: "Bundled", ... }` merged with stored data
- Settings UI dropdown shows "内置 PicGo" by default
- No regression in existing 173 tests
- Real SiYuan environment: no crash, default selected
