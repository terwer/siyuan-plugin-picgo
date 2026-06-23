import { describe, expect, it, vi, beforeEach } from "vitest"
import { PicListUploader } from "./PicListUploader"

// Mock universal-picgo-store before imports
vi.mock("universal-picgo-store", () => ({
  hasNodeEnv: false,
  win: {},
  JSONStore: vi.fn(),
}))

function createRouteConfig(overrides: Record<string, any> = {}) {
  const defaults: Record<string, any> = {
    picgoType: "app",
    picListApiUrl: "https://piclist.example.com/upload",
    picListApiKey: "test-api-key-123",
  }
  return { ...defaults, ...overrides }
}

const mockCtx = { pluginBaseDir: "/tmp/picgo", log: { error: vi.fn() } } as any

describe("PicListUploader", () => {
  let uploader: PicListUploader
  let routeConfig: Record<string, any>

  beforeEach(() => {
    vi.clearAllMocks()
    routeConfig = createRouteConfig()
    uploader = new PicListUploader(mockCtx, true, () => routeConfig) // isDev=true for debug logging
  })

  describe("isPicListConfigured", () => {
    it("returns true when both URL and key are set", () => {
      routeConfig = createRouteConfig({
        picListApiUrl: "https://api.example.com/upload",
        picListApiKey: "secret-key",
      })
      expect(uploader.isPicListConfigured()).toBe(true)
    })

    it("returns false when URL is empty", () => {
      routeConfig = createRouteConfig({
        picListApiUrl: "",
        picListApiKey: "secret-key",
      })
      expect(uploader.isPicListConfigured()).toBe(false)
    })

    it("returns false when key is empty", () => {
      routeConfig = createRouteConfig({
        picListApiUrl: "https://api.example.com",
        picListApiKey: "",
      })
      expect(uploader.isPicListConfigured()).toBe(false)
    })

    it("returns false when both URL and key are empty", () => {
      routeConfig = createRouteConfig({
        picListApiUrl: "",
        picListApiKey: "",
      })
      expect(uploader.isPicListConfigured()).toBe(false)
    })
  })

  describe("upload validation", () => {
    it("throws when picgoType is not App", async () => {
      routeConfig = createRouteConfig({
        picgoType: "bundled",
        picListApiUrl: "https://example.com",
        picListApiKey: "test-key",
      })

      await expect(uploader.upload(["file.jpg"])).rejects.toThrow("not supported via PicList API")
    })

    it("throws when input is empty (no clipboard support)", async () => {
      await expect(uploader.upload([])).rejects.toThrow("does not support clipboard upload")
    })

    it("throws when PicList is not configured", async () => {
      routeConfig = createRouteConfig({
        picListApiUrl: "",
        picListApiKey: "",
      })

      await expect(uploader.upload(["file.jpg"])).rejects.toThrow("not configured")
    })
  })
})
