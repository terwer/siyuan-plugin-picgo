import { describe, expect, it } from "vitest"
import { PicgoHelper } from "./picgoHelper"

const createHelper = (cfg: any) => {
  const uploaders = new Map<string, any>([
    [
      "awss3",
      {
        name: "AWS S3",
        config: () => [],
      },
    ],
  ])
  const ctx = {
    helper: {
      uploader: {
        get: (id: string) => uploaders.get(id),
        getIdList: () => Array.from(uploaders.keys()),
      },
    },
  } as any
  return new PicgoHelper(ctx, cfg)
}

describe("PicgoHelper uploader profile selection", () => {
  it("does not change selected profile when editing a non-selected config", () => {
    const cfg: any = {
      picBed: {
        current: "awss3",
        uploader: "awss3",
        awss3: {
          _id: "rustfs",
          _configName: "rustfs",
          endpoint: "http://rustfs.local",
        },
      },
      uploader: {
        awss3: {
          defaultId: "rustfs",
          configList: [
            {
              _id: "default",
              _configName: "Default",
              endpoint: "http://default.local",
            },
            {
              _id: "rustfs",
              _configName: "rustfs",
              endpoint: "http://rustfs.local",
            },
          ],
        },
      },
    }
    const helper = createHelper(cfg)

    helper.updateUploaderConfig("awss3", "default", {
      _id: "default",
      _configName: "Default edited",
      endpoint: "http://edited.local",
    } as any)

    expect(cfg.uploader.awss3.defaultId).toBe("rustfs")
    expect(cfg.picBed.awss3._id).toBe("rustfs")
    expect(cfg.picBed.awss3.endpoint).toBe("http://rustfs.local")
    expect(cfg.uploader.awss3.configList.find((item: any) => item._id === "default").endpoint).toBe(
      "http://edited.local"
    )
  })

  it("preserves selected profile identity when editing the selected config", () => {
    const cfg: any = {
      picBed: {
        current: "awss3",
        uploader: "awss3",
        awss3: {
          _id: "rustfs",
          _configName: "rustfs",
          endpoint: "http://rustfs.local",
        },
      },
      uploader: {
        awss3: {
          defaultId: "rustfs",
          configList: [
            {
              _id: "rustfs",
              _configName: "rustfs",
              endpoint: "http://rustfs.local",
            },
          ],
        },
      },
    }
    const helper = createHelper(cfg)

    helper.updateUploaderConfig("awss3", "rustfs", {
      _id: "rustfs",
      _configName: "rustfs edited",
      endpoint: "http://rustfs-edited.local",
    } as any)

    expect(cfg.uploader.awss3.defaultId).toBe("rustfs")
    expect(cfg.picBed.awss3._id).toBe("rustfs")
    expect(cfg.picBed.awss3.endpoint).toBe("http://rustfs-edited.local")
  })

  it("does not auto-select a newly added config when a selected profile already exists", () => {
    const cfg: any = {
      picBed: {
        current: "awss3",
        uploader: "awss3",
        awss3: {
          _id: "rustfs",
          _configName: "rustfs",
        },
      },
      uploader: {
        awss3: {
          defaultId: "rustfs",
          configList: [
            {
              _id: "rustfs",
              _configName: "rustfs",
            },
          ],
        },
      },
    }
    const helper = createHelper(cfg)

    helper.updateUploaderConfig("awss3", undefined as any, {
      _configName: "new profile",
      endpoint: "http://new.local",
    } as any)

    expect(cfg.uploader.awss3.defaultId).toBe("rustfs")
    expect(cfg.picBed.awss3._id).toBe("rustfs")
    expect(cfg.uploader.awss3.configList).toHaveLength(2)
  })
})
