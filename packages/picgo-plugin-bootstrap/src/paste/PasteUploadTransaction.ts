import { IPicGo, ImageItem, SIYUAN_PICGO_FILE_MAP_KEY } from "zhi-siyuan-picgo"
import { PasteInputSnapshot } from "./PasteEventAdapter"

export interface DocumentMutationResult {
  blockId: string
  insertedMarkdown: string
}

export interface LocalAssetUploadResult {
  /** SiYuan workspace-relative asset path, for example `assets/image-20240101-abcdef.png`. */
  assetPath: string
  /** Asset file name, which keys the local-image metadata map. */
  assetName: string
}

/**
 * Which document mutation the transaction performs.
 *
 * - `remote-link`: the pasted image is inserted with its image-bed URL.
 * - `local-link`: the clipboard image is still uploaded to the image bed, but
 *   the document keeps a SiYuan local asset link, because `siyuan.replaceLink`
 *   is disabled. Uploading and link replacement are independent settings.
 */
export type PasteUploadMode = "remote-link" | "local-link"

export interface MetadataCommitOptions {
  /** Local asset path used as the metadata origin, so later link replacement can match it. */
  originUrl?: string
}

export interface PasteUploadTransactionDeps {
  ctx: IPicGo
  picgoPostApi: any
  siyuanApi: any
  notifyInfo: (msg: string) => void
  notifySuccess: (msg: string) => void
  notifyError: (msg: string) => void
  logger: {
    debug: (...args: any[]) => void
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
  }
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/tiff": "tiff",
  "image/x-icon": "ico",
}

const hasFileExtension = (name: string) => /\.[A-Za-z0-9]+$/.test(name)

class DocumentMutationPort {
  public constructor(private readonly siyuanApi: any, private readonly logger: PasteUploadTransactionDeps["logger"]) {}

  public async insertRemoteImage(snapshot: PasteInputSnapshot, remoteImage: any): Promise<DocumentMutationResult> {
    const markdown = this.toRemoteMarkdown(remoteImage, snapshot)
    return await this.insertImageMarkdown(snapshot, markdown, "remote")
  }

  public async insertLocalImage(
    snapshot: PasteInputSnapshot,
    localAsset: LocalAssetUploadResult
  ): Promise<DocumentMutationResult> {
    const markdown = this.toLocalMarkdown(snapshot, localAsset)
    return await this.insertImageMarkdown(snapshot, markdown, "local")
  }

  private async insertImageMarkdown(
    snapshot: PasteInputSnapshot,
    markdown: string,
    imageKind: "remote" | "local"
  ): Promise<DocumentMutationResult> {
    const response = await this.insertBlock(markdown, snapshot)
    const blockId = this.extractInsertedBlockId(response)
    this.logger.info("paste image markdown inserted", {
      transactionId: snapshot.transactionId,
      blockId,
      imageKind,
      response,
    })

    return {
      blockId,
      insertedMarkdown: markdown,
    }
  }

  private toRemoteMarkdown(remoteImage: any, snapshot: PasteInputSnapshot): string {
    const url = remoteImage?.imgUrl ?? remoteImage?.url ?? ""
    const alt = remoteImage?.alt ?? snapshot.file?.name ?? snapshot.generatedName
    return `![${alt}](${url})`
  }

  private toLocalMarkdown(snapshot: PasteInputSnapshot, localAsset: LocalAssetUploadResult): string {
    const alt = snapshot.file?.name ?? snapshot.generatedName
    return `![${alt}](${localAsset.assetPath})`
  }

  private async insertBlock(markdown: string, snapshot: PasteInputSnapshot): Promise<any> {
    if (typeof this.siyuanApi.insertBlock === "function") {
      return await this.siyuanApi.insertBlock(markdown, "markdown", {
        previousID: snapshot.targetBlockId,
        parentID: snapshot.pageId,
      })
    }

    if (typeof this.siyuanApi.siyuanRequest === "function") {
      return await this.siyuanApi.siyuanRequest("/api/block/insertBlock", {
        dataType: "markdown",
        data: markdown,
        previousID: snapshot.targetBlockId,
        parentID: snapshot.pageId,
        nextID: "",
      })
    }

    throw new Error("当前 Siyuan API 适配器不支持 insertBlock")
  }

  private extractInsertedBlockId(response: any): string {
    const data = response?.data ?? response
    const op = Array.isArray(data) ? data?.[0]?.doOperations?.[0] : data?.[0]?.doOperations?.[0]
    const id = op?.id ?? response?.id ?? ""
    if (!id) {
      throw new Error("文档写入成功但未返回新图片块 ID")
    }
    return id
  }
}

/**
 * Stores the clipboard file as a SiYuan local asset.
 *
 * Only used when `siyuan.replaceLink` is disabled: the image still goes to the
 * image bed, but the document must keep a local asset link instead of the
 * remote URL, so the transaction has to create that local asset itself.
 */
class AssetUploadPort {
  public constructor(private readonly siyuanApi: any, private readonly logger: PasteUploadTransactionDeps["logger"]) {}

  public async upload(snapshot: PasteInputSnapshot): Promise<LocalAssetUploadResult> {
    if (!snapshot.file) {
      throw new Error("剪贴板图片不存在，无法写入本地图片")
    }
    if (typeof this.siyuanApi.uploadAsset !== "function") {
      throw new Error("当前 Siyuan API 适配器不支持资源上传（uploadAsset）")
    }

    const fileName = this.resolveAssetFileName(snapshot)
    const formData = new FormData()
    formData.append("assetsDirPath", "/assets/")
    formData.append("file[]", snapshot.file, fileName)

    const data = await this.siyuanApi.uploadAsset(formData)
    const succMap = data?.succMap ?? {}
    const assetPath = String(Object.values(succMap)[0] ?? "").trim()
    if (!assetPath) {
      const errFiles = Array.isArray(data?.errFiles) && data.errFiles.length > 0 ? data.errFiles.join(", ") : ""
      throw new Error(`思源资源上传未返回资源路径${errFiles ? `（失败文件：${errFiles}）` : ""}`)
    }

    this.logger.info("paste local asset uploaded", {
      transactionId: snapshot.transactionId,
      assetPath,
    })

    return {
      assetPath,
      assetName: assetPath.split("/").pop() ?? fileName,
    }
  }

  private resolveAssetFileName(snapshot: PasteInputSnapshot): string {
    const rawName = String(snapshot.file?.name ?? "").trim()
    if (rawName && hasFileExtension(rawName)) {
      return rawName
    }

    const mimeType = String(snapshot.file?.type ?? "").toLowerCase()
    const extension = MIME_EXTENSIONS[mimeType] ?? "png"
    return `${rawName || snapshot.generatedName}.${extension}`
  }
}

class MetadataRepository {
  public constructor(private readonly siyuanApi: any) {}

  public async commit(
    snapshot: PasteInputSnapshot,
    remoteImage: any,
    mutation: DocumentMutationResult,
    options?: MetadataCommitOptions
  ) {
    const attrs = await this.siyuanApi.getBlockAttrs(snapshot.pageId)
    const mapInfoStr = attrs[SIYUAN_PICGO_FILE_MAP_KEY] ?? "{}"
    let fileMap: Record<string, any> = {}
    try {
      fileMap = JSON.parse(mapInfoStr)
    } catch {
      fileMap = {}
    }

    const remoteUrl = remoteImage?.imgUrl ?? remoteImage?.url ?? ""
    const originUrl = options?.originUrl ?? snapshot.generatedName
    const item = new ImageItem(originUrl, remoteUrl, false, snapshot.file?.name ?? "", "")
    item.blockId = mutation.blockId
    fileMap[item.hash] = item

    await this.siyuanApi.setBlockAttrs(snapshot.pageId, {
      [SIYUAN_PICGO_FILE_MAP_KEY]: JSON.stringify(fileMap),
    })

    return item
  }
}

/**
 * Product-level paste upload transaction.
 *
 * This is the only automatic paste upload use case. Uploading to the image bed
 * is driven by `siyuan.autoUpload`, and writing the image-bed URL into the
 * document is driven by `siyuan.replaceLink`; the two settings are independent:
 *
 * - replaceLink enabled: insert the remote image-bed URL.
 * - replaceLink disabled: still upload, but insert a SiYuan local asset link so
 *   later "publish with image bed" flows can do the replacement from metadata.
 *
 * The transaction never polls the DOM and never rewrites a block inserted by
 * SiYuan; every document mutation happens inside this transaction.
 */
class PasteUploadTransaction {
  private readonly documentMutation: DocumentMutationPort
  private readonly metadataRepository: MetadataRepository
  private readonly assetUpload: AssetUploadPort

  public constructor(private readonly deps: PasteUploadTransactionDeps) {
    this.documentMutation = new DocumentMutationPort(deps.siyuanApi, deps.logger)
    this.metadataRepository = new MetadataRepository(deps.siyuanApi)
    this.assetUpload = new AssetUploadPort(deps.siyuanApi, deps.logger)
  }

  public async execute(snapshot: PasteInputSnapshot) {
    const mode: PasteUploadMode = snapshot.replaceLink === false ? "local-link" : "remote-link"
    this.deps.logger.info("paste upload transaction started", {
      transactionId: snapshot.transactionId,
      pageId: snapshot.pageId,
      targetBlockId: snapshot.targetBlockId,
      mode,
      preventedBy: snapshot.preventedBy,
    })

    let remoteImage: any
    let localAsset: LocalAssetUploadResult | undefined
    let mutation: DocumentMutationResult | undefined

    try {
      this.deps.notifyInfo("检测到剪贴板图片，已接管默认粘贴，正在上传到 PicGo 图床...")
      remoteImage = await this.uploadToPicGo(snapshot)

      this.ensureRemoteImage(remoteImage)
      if (mode === "local-link") {
        localAsset = await this.assetUpload.upload(snapshot)
        mutation = await this.documentMutation.insertLocalImage(snapshot, localAsset)
      } else {
        mutation = await this.documentMutation.insertRemoteImage(snapshot, remoteImage)
      }
      const metadataItem = await this.metadataRepository.commit(
        snapshot,
        remoteImage,
        mutation,
        localAsset ? { originUrl: localAsset.assetPath } : undefined
      )

      this.deps.notifySuccess(
        mode === "local-link"
          ? "🎉剪贴板图片已上传到图床，替换本地链接已关闭，文档保留本地图片"
          : "🎉剪贴板图片已上传并插入图床链接"
      )
      return {
        ok: true,
        mode,
        transactionId: snapshot.transactionId,
        remoteImage,
        localAsset,
        mutation,
        metadataItem,
      }
    } catch (error: any) {
      const message = this.toUserError(error, Boolean(remoteImage), Boolean(mutation), mode)
      this.deps.logger.error("paste upload transaction failed", {
        transactionId: snapshot.transactionId,
        mode,
        remoteImage,
        localAsset,
        mutation,
        error,
      })
      this.deps.notifyError(message)
      return {
        ok: false,
        mode,
        transactionId: snapshot.transactionId,
        remoteImage,
        localAsset,
        mutation,
        error,
        rollbackState: message,
      }
    }
  }

  private async uploadToPicGo(snapshot: PasteInputSnapshot) {
    this.deps.ctx.reloadConfig()
    const imageItem = new ImageItem(snapshot.generatedName, snapshot.file as any, true, snapshot.file?.name ?? "", "")
    // ignoreReplaceLink=true is used only to reuse the PicGo upload primitive.
    // The transaction owns document mutation and metadata commit itself; no
    // bootstrap polling/replacement pass is allowed on this path, and the
    // local-link mode writes its own SiYuan asset link instead.
    const result = await this.deps.picgoPostApi.uploadSingleImageToBed(snapshot.pageId, {}, imageItem, true, true)
    return Array.isArray(result) ? result[0] : result?.[0]
  }

  private ensureRemoteImage(remoteImage: any) {
    if (!remoteImage?.imgUrl || String(remoteImage.imgUrl).trim().length === 0) {
      throw new Error("PicGO配置错误，请检查配置。")
    }
  }

  private toUserError(
    error: any,
    hasRemoteImage: boolean,
    hasDocumentMutation: boolean,
    mode: PasteUploadMode
  ): string {
    if (!hasRemoteImage) {
      return `图片上传失败，已阻断默认粘贴且未写入文档：${error?.toString?.() ?? error}`
    }
    if (!hasDocumentMutation) {
      return mode === "local-link"
        ? `图片已上传到图床，但本地图片写入文档失败；未写入元数据，请检查思源资源上传后重试：${
            error?.toString?.() ?? error
          }`
        : `图片已上传到图床，但写入文档失败；未写入元数据，请手动复制图床链接处理：${error?.toString?.() ?? error}`
    }
    return `图片已写入文档，但元数据同步失败；不会启动轮询或二次上传：${error?.toString?.() ?? error}`
  }
}

export { AssetUploadPort, DocumentMutationPort, MetadataRepository, PasteUploadTransaction }
