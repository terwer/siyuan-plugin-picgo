# PR #682 后完善计划 — PicList 远程上传功能修复与加固

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 修复 PR #682 合并后的 5 个已知问题（1 个 Critical + 4 个 Warning），使远程 PicList 上传功能达到生产就绪状态。

**Architecture:** 在现有 `PicListUploader` 基础上修复类型错误、加固安全传输、补充测试、改善错误处理、清理默认值。

**Tech Stack:** TypeScript, Vitest (jsdom), universal-picgo-store, zhi-lib-base

---

### Task 1: 修复 logger.debug 类型错误（Critical）

**Objective:** 修复 `PicListUploader.ts:79` 的 TS2554 类型错误 — `logger.debug()` 传了 4 个参数，接口只接受 1-2 个。

**Files:**
- Modify: `libs/Universal-PicGo-Core/src/core/PicListUploader.ts:79`

**Step 1: 定位问题行**

当前代码（第 78-79 行）：
```typescript
this.logger.debug("Uploading to PicList, url =>", requestUrl.replace(apiKey, "***"))
this.logger.debug("File name =>", fileName, "size =>", fileBlob.size)
```

第 78 行有 2 个参数 ✅，第 79 行有 4 个参数 ❌。

**Step 2: 修改为模板字符串**

```typescript
this.logger.debug("Uploading to PicList, url =>", requestUrl.replace(apiKey, "***"))
this.logger.debug(`File name => ${fileName}, size => ${fileBlob.size}`)
```

**Step 3: 验证修复**

```bash
cd libs/Universal-PicGo-Core && pnpm build 2>&1 | grep -c "TS2554"
```
Expected: `0` (no TS2554 errors)

**Step 4: 提交**

```bash
git add libs/Universal-PicGo-Core/src/core/PicListUploader.ts
git commit -m "fix(PicListUploader): fix logger.debug argument count TS2554 error"
```

---

### Task 2: API Key 安全传输 — 添加 Authorization header 支持

**Objective:** 将 API Key 从 URL query string 移至 HTTP `Authorization` header，避免密钥泄露到服务器日志/代理日志。

**Files:**
- Modify: `libs/Universal-PicGo-Core/src/core/PicListUploader.ts:77-84`（buildRequestUrl 调用和 fetch）

**当前代码（第 77-87 行）：**
```typescript
const requestUrl = this.buildRequestUrl(apiUrl, apiKey)
// ...
const response = await fetch(requestUrl, {
    method: "POST",
    body: formData,
})
```

**问题分析：** PicList API 规范说 `POST {apiUrl}?key={apiKey}`，但这个接口大概率也支持 `Authorization` header。我们需要做兼容处理：优先尝试 header 方式，同时保留 query string 作为 fallback（因为有些部署可能只支持 query string）。

**Step 1: 重构 buildRequestUrl → 分离 URL 构建和认证注入**

修改 `PicListUploader.ts` 的私有方法 `buildRequestUrl` 为公开的 `buildAuthHeaders`：

```typescript
/**
 * 构建带认证的请求头。
 * 优先使用 Authorization header，同时保留 query param 作为 fallback。
 */
private buildAuthHeaders(apiKey: string): Record<string, string> {
    return {
        "Authorization": `Bearer ${apiKey}`,
    }
}
```

**Step 2: 修改 upload 方法中的 fetch 调用**

```typescript
// 旧代码（删除）:
// const requestUrl = this.buildRequestUrl(apiUrl, apiKey)
// const response = await fetch(requestUrl, { method: "POST", body: formData })

// 新代码:
const requestUrl = apiUrl  // 直接使用配置的 URL，不再拼接 key
const headers = this.buildAuthHeaders(apiKey)

const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
        ...headers,
    },
    body: formData,
})
```

**Step 3: 更新 JSDoc 注释**

修改 `PicListUploader.ts` 类顶部的接口规范注释：

```typescript
/**
 * 接口规范：
 * - URL: POST {apiUrl}
 * - Headers: Authorization: Bearer {apiKey}
 * - Content-Type: multipart/form-data
 * - Body: file 字段，包含图片文件
 * - 响应: { success: true, result: "https://..." }
 */
```

**Step 4: 验证构建**

```bash
cd libs/Universal-PicGo-Core && pnpm build 2>&1 | tail -5
```
Expected: `✓ built in ...`

**Step 5: 提交**

```bash
git add libs/Universal-PicGo-Core/src/core/PicListUploader.ts
git commit -m "fix(PicListUploader): move API key from URL query to Authorization header"
```

---

### Task 3: 修复默认值 — 占位 URL 改为空字符串

**Objective:** `picListApiUrl` 默认值 `"https://example.com/upload"` 会误导用户以为已配置，改为 `""` 与 `picListApiKey` 保持一致。

**Files:**
- Modify: `libs/Universal-PicGo-Core/src/db/externalPicGo/index.ts:23`

**Step 1: 修改默认值**

```typescript
// 旧:
picListApiUrl: "https://example.com/upload",
// 新:
picListApiUrl: "",
```

**Step 2: 验证**

```bash
cd libs/Universal-PicGo-Core && pnpm build 2>&1 | tail -3
```
Expected: build success.

**Step 3: 提交**

```bash
git add libs/Universal-PicGo-Core/src/db/externalPicGo/index.ts
git commit -m "fix(PicListUploader): change picListApiUrl default from placeholder to empty string"
```

---

### Task 4: 修复多文件上传错误处理 — 不丢弃已成功结果

**Objective:** 当批量上传多个文件时，某个文件失败不应丢弃之前已成功的上传结果。

**Files:**
- Modify: `libs/Universal-PicGo-Core/src/core/PicListUploader.ts:68-120`（upload 方法中的 for 循环）

**当前代码（第 69-120 行）：**
```typescript
for (const inputItem of input) {
    try {
        // ... upload logic ...
        results.push({ ... })
    } catch (e: any) {
        this.logger.error(`PicList upload error for item ${inputItem}:`, e)
        throw e  // ← 直接抛出，results 中已有的成功结果全部丢失
    }
}
```

**Step 1: 重构错误处理为收集模式**

```typescript
const results: IImgInfo[] = []
const errors: { item: any; error: Error }[] = []

for (const inputItem of input) {
    try {
        const { fileBlob, fileName } = await this.resolveFileData(inputItem)
        if (!fileBlob) {
            this.logger.warn("Skipping empty input item:", inputItem)
            continue
        }

        // ... (upload logic unchanged) ...
        
        results.push({
            fileName: imgUrl.substring(imgUrl.lastIndexOf("/") + 1) || fileName,
            imgUrl,
        })
        this.logger.info(`PicList upload success: ${fileName} => ${JSON.stringify(resultList)}`)
    } catch (e: any) {
        this.logger.error(`PicList upload error for item ${inputItem}:`, e)
        errors.push({ item: inputItem, error: e })
        // 不 throw，继续处理剩余文件
    }
}

// 如果有部分失败，记录汇总日志
if (errors.length > 0) {
    this.logger.warn(
        `PicList upload finished with ${errors.length}/${input.length} failures. ` +
        `${results.length} succeeded.`
    )
}

// 如果全部失败，才抛出错误
if (results.length === 0 && errors.length > 0) {
    throw new Error(
        `All ${errors.length} uploads to PicList failed. First error: ${errors[0].error.message}`
    )
}

return results
```

**Step 2: 验证构建**

```bash
cd libs/Universal-PicGo-Core && pnpm build 2>&1 | tail -3
```

**Step 3: 提交**

```bash
git add libs/Universal-PicGo-Core/src/core/PicListUploader.ts
git commit -m "fix(PicListUploader): preserve partial upload results on batch failure"
```

---

### Task 5: 编写 PicListUploader 单元测试

**Objective:** 为 `PicListUploader` 添加测试覆盖，验证核心路径。

**Files:**
- Create: `libs/Universal-PicGo-Core/src/core/PicListUploader.spec.ts`

**测试框架：** Vitest (jsdom)，参考已有测试 `UniversalPicGo.spec.ts` 的模式。

**Step 1: 创建测试文件骨架**

```typescript
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest"
import { PicListUploader } from "./PicListUploader"
import * as store from "universal-picgo-store"

// Mock universal-picgo-store
vi.mock("universal-picgo-store", () => ({
    hasNodeEnv: false,
    win: {},
    JSONStore: vi.fn(),
}))

// Mock ExternalPicgoConfigDb
vi.mock("../db/externalPicGo", () => ({
    default: vi.fn().mockImplementation(() => ({
        get: vi.fn((key: string) => {
            const values: Record<string, any> = {
                picgoType: "app",
                picListApiUrl: "https://piclist.example.com/upload",
                picListApiKey: "test-api-key-123",
            }
            return values[key]
        }),
    })),
}))

describe("PicListUploader", () => {
    let uploader: PicListUploader
    const mockCtx = { pluginBaseDir: "/tmp/picgo", log: { error: vi.fn() } } as any

    beforeEach(() => {
        uploader = new PicListUploader(mockCtx, true) // isDev=true
    })

    describe("isPicListConfigured", () => {
        it("returns true when both URL and key are set", () => {
            expect(uploader.isPicListConfigured()).toBe(true)
        })

        it("returns false when URL is empty", () => {
            // Mock get to return empty url
            ;(uploader.db.get as any).mockImplementation((key: string) => {
                if (key === "picListApiUrl") return ""
                if (key === "picListApiKey") return "test-key"
                if (key === "picgoType") return "app"
            })
            expect(uploader.isPicListConfigured()).toBe(false)
        })

        it("returns false when key is empty", () => {
            ;(uploader.db.get as any).mockImplementation((key: string) => {
                if (key === "picListApiUrl") return "https://example.com"
                if (key === "picListApiKey") return ""
                if (key === "picgoType") return "app"
            })
            expect(uploader.isPicListConfigured()).toBe(false)
        })
    })

    describe("upload validation", () => {
        it("throws when picgoType is not App", async () => {
            ;(uploader.db.get as any).mockImplementation((key: string) => {
                if (key === "picgoType") return "bundled"
                if (key === "picListApiUrl") return "https://example.com"
                if (key === "picListApiKey") return "test-key"
            })
            await expect(uploader.upload([])).rejects.toThrow("not supported via PicList API")
        })

        it("throws when input is empty (no clipboard support)", async () => {
            await expect(uploader.upload([])).rejects.toThrow("does not support clipboard upload")
        })

        it("throws when PicList is not configured", async () => {
            ;(uploader.db.get as any).mockImplementation((key: string) => {
                if (key === "picListApiUrl") return ""
                if (key === "picListApiKey") return ""
                if (key === "picgoType") return "app"
            })
            await expect(uploader.upload(["file.jpg"])).rejects.toThrow("not configured")
        })
    })
})
```

**Step 2: 运行测试**

```bash
cd libs/Universal-PicGo-Core && npx vitest run src/core/PicListUploader.spec.ts
```
Expected: 5 tests pass.

**Step 3: 提交**

```bash
git add libs/Universal-PicGo-Core/src/core/PicListUploader.spec.ts
git commit -m "test(PicListUploader): add unit tests for config validation and error paths"
```

---

### Task 6: 全量构建验证

**Objective:** 确保所有修改后整体构建通过。

**Step 1: 运行全量构建**

```bash
cd /Volumes/workspace/mydocs/siyuan-plugins/siyuan-plugin-picgo
pnpm build 2>&1 | tail -20
```
Expected: all packages build successfully, no TS errors.

**Step 2: 运行所有测试**

```bash
cd libs/Universal-PicGo-Core && npx vitest run 2>&1 | tail -20
```
Expected: all tests pass including new PicListUploader tests.

**Step 3: 提交（如有遗漏文件）**

```bash
git status
# 如有未提交的修改文件，按需 add + commit
```

---

### Task 7: 更新类型定义中的注释（可选改进）

**Objective:** 在 `IExternalPicgoConfig` 接口中添加更详细的字段说明。

**Files:**
- Modify: `libs/Universal-PicGo-Core/src/types/index.d.ts:649-657`

**当前注释：**
```typescript
/**
 * picListApiUrl 是远程 PicList 服务的上传接口地址
 */
picListApiUrl?: string

/**
 * picListApiKey 是远程 PicList 服务的 API 认证密钥
 */
picListApiKey?: string
```

**改进后：**
```typescript
/**
 * picListApiUrl 是远程 PicList 服务的上传接口地址。
 * 通过 Authorization: Bearer header 传递 API Key 进行认证。
 * 留空时不会启用远程 PicList 模式（需同时配置 picListApiKey）。
 */
picListApiUrl?: string

/**
 * picListApiKey 是远程 PicList 服务的 API 认证密钥。
 * 通过 HTTP Authorization: Bearer header 传递（非 URL 参数）。
 * 此值在日志中自动脱敏。
 */
picListApiKey?: string
```

提交：
```bash
git add libs/Universal-PicGo-Core/src/types/index.d.ts
git commit -m "docs(types): improve PicList config field documentation"
```

---

## 顺序依赖

```
Task 1 (类型修复)
  ↓
Task 2 (安全加固)
  ↓
Task 3 (默认值修复) ← 与 Task 2 无冲突，可并行
  ↓
Task 4 (错误处理)
  ↓
Task 5 (测试)        ← 依赖 Task 1-4 的最终代码形态
  ↓
Task 6 (全量验证)
  ↓
Task 7 (类型注释)    ← 可选，最后做
```

## 验证清单

- [ ] `pnpm build` 无 TS 错误（尤其 TS2554）
- [ ] `npx vitest run` 全部测试通过
- [ ] `PicListUploader.upload()` 不再通过 URL query 传 API key
- [ ] 批量上传中单个文件失败不影响其他文件
- [ ] 默认 `picListApiUrl` 为空字符串，不会误导用户
- [ ] `isPicListConfigured()` 在未配置时正确返回 false

---

## 风险与权衡

| 风险 | 缓解 |
|------|------|
| PicList 服务器可能不支持 `Authorization` header | 如果 PicList 确实践要求 query param，后续可加 fallback 优先 header > query |
| 部分成功返回可能改变上层调用者预期 | 当前上层 `SiyuanPicGoUploadApi` 不检查部分成功，只取结果或 catch error — 行为不变 |
| 测试 mock 较多，可能遗漏真实环境问题 | 测试聚焦配置验证和错误路径，集成测试留待后续 |
