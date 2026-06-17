import { describe, expect, it, vi, beforeEach } from "vitest"
import { PicListUploader } from "./PicListUploader"

// Mock universal-picgo-store before imports
vi.mock("universal-picgo-store", () => ({
  hasNodeEnv: false,
  win: {},
  JSONStore: vi.fn(),
}))

// Mock ExternalPicgoConfigDb
vi.mock("../db/externalPicGo", () => ({
  default: vi.fn(),
}))

import ExternalPicgoConfigDb from "../db/externalPicGo"

function createMockDb(overrides: Record<string, any> = {}) {
  const defaults: Record<string, any> = {
    picgoType: "app",
    picListApiUrl: "https://piclist.example.com/upload",
    picListApiKey: "test-api-key-123",
  }
  const values = { ...defaults, ...overrides }
  return {
    get: vi.fn((key: string) => values[key]),
    set: vi.fn(),
    has: vi.fn(),
  }
}

const mockCtx = { pluginBaseDir: "/tmp/picgo", log: { error: vi.fn() } } as any

describe("PicListUploader", () => {
  let uploader: PicListUploader
  let mockDb: ReturnType<typeof createMockDb>

  beforeEach(() => {
    vi.clearAllMocks()
    mockDb = createMockDb()
    ;(ExternalPicgoConfigDb as any).mockImplementation(() => mockDb)
    uploader = new PicListUploader(mockCtx, true) // isDev=true for debug logging
  })

  describe("isPicListConfigured", () => {
    it("returns true when both URL and key are set", () => {
      mockDb = createMockDb({
        picListApiUrl: "https://api.example.com/upload",
        picListApiKey: "secret-key",
      })
      ;(ExternalPicgoConfigDb as any).mockImplementation(() => mockDb)
      uploader = new PicListUploader(mockCtx, true)
      expect(uploader.isPicListConfigured()).toBe(true)
    })

    it("returns false when URL is empty", () => {
      mockDb = createMockDb({
        picListApiUrl: "",
        picListApiKey: "secret-key",
      })
      ;(ExternalPicgoConfigDb as any).mockImplementation(() => mockDb)
      uploader = new PicListUploader(mockCtx, true)
      expect(uploader.isPicListConfigured()).toBe(false)
    })

    it("returns false when key is empty", () => {
      mockDb = createMockDb({
        picListApiUrl: "https://api.example.com",
        picListApiKey: "",
      })
      ;(ExternalPicgoConfigDb as any).mockImplementation(() => mockDb)
      uploader = new PicListUploader(mockCtx, true)
      expect(uploader.isPicListConfigured()).toBe(false)
    })

    it("returns false when both URL and key are empty", () => {
      mockDb = createMockDb({
        picListApiUrl: "",
        picListApiKey: "",
      })
      ;(ExternalPicgoConfigDb as any).mockImplementation(() => mockDb)
      uploader = new PicListUploader(mockCtx, true)
      expect(uploader.isPicListConfigured()).toBe(false)
    })
  })

  describe("upload validation", () => {
    it("throws when picgoType is not App", async () => {
      mockDb = createMockDb({
        picgoType: "bundled",
        picListApiUrl: "https://example.com",
        picListApiKey: "test-key",
      })
      ;(ExternalPicgoConfigDb as any).mockImplementation(() => mockDb)
      uploader = new PicListUploader(mockCtx, true)

      await expect(uploader.upload(["file.jpg"])).rejects.toThrow("not supported via PicList API")
    })

    it("throws when input is empty (no clipboard support)", async () => {
      await expect(uploader.upload([])).rejects.toThrow("does not support clipboard upload")
    })

    it("throws when PicList is not configured", async () => {
      mockDb = createMockDb({
        picListApiUrl: "",
        picListApiKey: "",
      })
      ;(ExternalPicgoConfigDb as any).mockImplementation(() => mockDb)
      uploader = new PicListUploader(mockCtx, true)

      await expect(uploader.upload(["file.jpg"])).rejects.toThrow("not configured")
    })
  })
})
