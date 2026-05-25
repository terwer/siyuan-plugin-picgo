import { IPicGo, ImageItem, SIYUAN_PICGO_FILE_MAP_KEY } from "zhi-siyuan-picgo"
import { PasteInputSnapshot } from "./PasteEventAdapter"

export interface DocumentMutationResult {
  blockId: string
  insertedMarkdown: string
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

class DocumentMutationPort {
  public constructor(
    private readonly siyuanApi: any,
    private readonly logger: PasteUploadTransactionDeps["logger"]
  ) {}

  public async insertRemoteImage(snapshot: PasteInputSnapshot, remoteImage: any): Promise<DocumentMutationResult> {
    const markdown = this.toMarkdown(remoteImage, snapshot)
    const response = await this.insertBlock(markdown, snapshot)
    const blockId = this.extractInsertedBlockId(response)
    this.logger.info("paste image markdown inserted", {
      transactionId: snapshot.transactionId,
      blockId,
      response,
    })

    return {
      blockId,
      insertedMarkdown: markdown,
    }
  }

  private toMarkdown(remoteImage: any, snapshot: PasteInputSnapshot): string {
    const url = remoteImage?.imgUrl ?? remoteImage?.url ?? ""
    const alt = remoteImage?.alt ?? snapshot.file?.name ?? snapshot.generatedName
    return `![${alt}](${url})`
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

class MetadataRepository {
  public constructor(private readonly siyuanApi: any) {}

  public async commit(snapshot: PasteInputSnapshot, remoteImage: any, mutation: DocumentMutationResult) {
    const attrs = await this.siyuanApi.getBlockAttrs(snapshot.pageId)
    const mapInfoStr = attrs[SIYUAN_PICGO_FILE_MAP_KEY] ?? "{}"
    let fileMap: Record<string, any> = {}
    try {
      fileMap = JSON.parse(mapInfoStr)
    } catch {
      fileMap = {}
    }

    const remoteUrl = remoteImage?.imgUrl ?? remoteImage?.url ?? ""
    const item = new ImageItem(snapshot.generatedName, remoteUrl, false, snapshot.file?.name ?? "", "")
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
 * This is the only automatic paste upload use case. It intentionally does not
 * call SiYuan uploadAsset, does not poll DOM, and does not replace a default
 * local asset inserted by SiYuan.
 */
class PasteUploadTransaction {
  private readonly documentMutation: DocumentMutationPort
  private readonly metadataRepository: MetadataRepository

  public constructor(private readonly deps: PasteUploadTransactionDeps) {
    this.documentMutation = new DocumentMutationPort(deps.siyuanApi, deps.logger)
    this.metadataRepository = new MetadataRepository(deps.siyuanApi)
  }

  public async execute(snapshot: PasteInputSnapshot) {
    this.deps.logger.info("paste upload transaction started", {
      transactionId: snapshot.transactionId,
      pageId: snapshot.pageId,
      targetBlockId: snapshot.targetBlockId,
      preventedBy: snapshot.preventedBy,
    })

    let remoteImage: any
    let mutation: DocumentMutationResult | undefined

    try {
      this.deps.notifyInfo("检测到剪贴板图片，已接管默认粘贴，正在上传到 PicGo 图床...")
      remoteImage = await this.uploadToPicGo(snapshot)

      this.ensureRemoteImage(remoteImage)
      mutation = await this.documentMutation.insertRemoteImage(snapshot, remoteImage)
      const metadataItem = await this.metadataRepository.commit(snapshot, remoteImage, mutation)

      this.deps.notifySuccess("🎉剪贴板图片已上传并插入图床链接")
      return {
        ok: true,
        transactionId: snapshot.transactionId,
        remoteImage,
        mutation,
        metadataItem,
      }
    } catch (error: any) {
      const message = this.toUserError(error, Boolean(remoteImage), Boolean(mutation))
      this.deps.logger.error("paste upload transaction failed", {
        transactionId: snapshot.transactionId,
        remoteImage,
        mutation,
        error,
      })
      this.deps.notifyError(message)
      return {
        ok: false,
        transactionId: snapshot.transactionId,
        remoteImage,
        mutation,
        error,
        rollbackState: message,
      }
    }
  }

  private async uploadToPicGo(snapshot: PasteInputSnapshot) {
    const imageItem = new ImageItem(snapshot.generatedName, snapshot.file as any, true, snapshot.file?.name ?? "", "")
    // ignoreReplaceLink=true is used only to reuse the PicGo upload primitive.
    // The transaction owns document mutation and metadata commit itself; no
    // bootstrap polling/replacement pass or SiYuan uploadAsset compensation is
    // allowed on this path.
    const result = await this.deps.picgoPostApi.uploadSingleImageToBed(snapshot.pageId, {}, imageItem, true, true)
    return Array.isArray(result) ? result[0] : result?.[0]
  }

  private ensureRemoteImage(remoteImage: any) {
    if (!remoteImage?.imgUrl || String(remoteImage.imgUrl).trim().length === 0) {
      throw new Error("PicGO配置错误，请检查配置。")
    }
  }

  private toUserError(error: any, hasRemoteImage: boolean, hasDocumentMutation: boolean): string {
    if (!hasRemoteImage) {
      return `图片上传失败，已阻断默认粘贴且未写入文档：${error?.toString?.() ?? error}`
    }
    if (!hasDocumentMutation) {
      return `图片已上传到图床，但写入文档失败；未写入元数据，请手动复制图床链接处理：${error?.toString?.() ?? error}`
    }
    return `图片已写入文档，但元数据同步失败；不会启动轮询或二次上传：${error?.toString?.() ?? error}`
  }
}

export { DocumentMutationPort, MetadataRepository, PasteUploadTransaction }
