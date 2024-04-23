import uploader, { IUploadResult } from "./s3/uploader"
import { formatPath } from "./s3/utils"
import { IAwsS3Config, IPicGo, IPluginConfig } from "../../types"
import { ILocalesKey } from "../../i18n/zh-CN"
import { IBuildInEvent } from "../../utils/enums"

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  const userConfig: IAwsS3Config = ctx.getConfig("picBed.awss3")
  if (!userConfig) {
    throw new Error("Can't find amazon s3 uploader config")
  }

  if (userConfig.customUrl) {
    userConfig.customUrl = userConfig.customUrl.replace(/\/?$/, "")
  }

  const client = uploader.createS3Client(ctx, userConfig)
  const output = ctx.output

  const tasks = output.map((item, idx) =>
    uploader.createUploadTask({
      client,
      index: idx,
      bucketName: userConfig.bucketName,
      path: formatPath(item, userConfig.uploadPath || ""),
      item: item,
      acl: userConfig.acl || "public-read",
      customUrl: userConfig.customUrl || "",
      corsProxy: userConfig.corsProxy,
    })
  )

  let results: IUploadResult[]

  try {
    results = await Promise.all(tasks)
  } catch (err: any) {
    ctx.log.error("Error occurs when uploading to S3, Please check network connectivity and S3 configuration")
    ctx.log.error(err, err.stack)
    ctx.emit(IBuildInEvent.NOTIFICATION, {
      title: ctx.i18n.translate<ILocalesKey>("UPLOAD_FAILED"),
      body: ctx.i18n.translate<ILocalesKey>("CHECK_SETTINGS"),
    })
    throw err
  }

  for (const result of results) {
    const { index, url, imgURL } = result
    delete output[index].buffer
    delete output[index].base64Image
    output[index].imgUrl = imgURL
    output[index].url = url
  }

  return ctx
}

const config = (ctx: IPicGo): IPluginConfig[] => {
  const defaultConfig: IAwsS3Config = {
    accessKeyID: "",
    secretAccessKey: "",
    bucketName: "",
    uploadPath: "{year}/{month}/{md5}.{extName}",
    pathStyleAccess: false,
    rejectUnauthorized: true,
    acl: "public-read",
    corsProxy: false,
  }
  let userConfig = ctx.getConfig<IAwsS3Config>("picBed.awss3") || {}
  userConfig = { ...defaultConfig, ...userConfig }
  const config: IPluginConfig[] = [
    {
      name: "accessKeyID",
      type: "input",
      default: userConfig.accessKeyID,
      required: true,
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_ACCESSKEYID")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_ACCESSKEYID")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_MESSAGE_ACCESSKEYID")
      },
    },
    {
      name: "secretAccessKey",
      type: "input",
      default: userConfig.secretAccessKey,
      required: true,
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_SECRET_ACCESSKEY")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_SECRET_ACCESSKEY")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_MESSAGE_SECRET_ACCESSKEY")
      },
    },
    {
      name: "bucketName",
      type: "input",
      default: userConfig.bucketName,
      required: true,
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_BUCKET")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_BUCKET")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_MESSAGE_BUCKET")
      },
    },
    {
      name: "uploadPath",
      type: "input",
      default: userConfig.uploadPath,
      required: true,
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_UPLOADPATH")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_UPLOADPATH")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_MESSAGE_UPLOADPATH")
      },
    },
    {
      name: "region",
      type: "input",
      default: userConfig.region,
      required: false,
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_REGION")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_REGION")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_MESSAGE_REGION")
      },
    },
    {
      name: "endpoint",
      type: "input",
      default: userConfig.endpoint,
      required: true,
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_ENDPOINT")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_ENDPOINT")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_MESSAGE_ENDPOINT")
      },
    },
    {
      name: "customUrl",
      type: "input",
      default: userConfig.customUrl,
      required: false,
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_CUSTOM_URL")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_CUSTOM_URL")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_MESSAGE_CUSTOM_URL")
      },
    },
    {
      name: "pathStyleAccess",
      type: "confirm",
      default: userConfig.pathStyleAccess || false,
      required: false,
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_PATHSTYLEACCESS")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_PATHSTYLEACCESS")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_MESSAGE_PATHSTYLEACCESS")
      },
    },
    {
      name: "rejectUnauthorized",
      type: "confirm",
      default: userConfig.rejectUnauthorized || true,
      required: false,
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_REJECTUNAUTHORIZED")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_REJECTUNAUTHORIZED")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_MESSAGE_REJECTUNAUTHORIZED")
      },
    },
    {
      name: "acl",
      type: "input",
      default: userConfig.acl || "public-read",
      required: false,
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_ACL")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_ACL")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_MESSAGE_ACL")
      },
    },
    {
      name: "corsProxy",
      type: "confirm",
      default: userConfig.corsProxy,
      required: false,
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_CORS_PROXY")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_CORS_PROXY")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST_MESSAGE_CORS_PROXY")
      },
    },
  ]
  return config
}

export default function register(ctx: IPicGo): void {
  ctx.helper.uploader.register("awss3", {
    get name() {
      return ctx.i18n.translate<ILocalesKey>("PICBED_AWSS3PLIST")
    },
    handle,
    config,
  })
}
