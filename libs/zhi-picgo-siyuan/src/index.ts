import { IPicGo, PicGo } from "zhi-picgo-core"
import pkg from "../package.json"
import path from "path"
import fs from "fs"
import dayjs from "dayjs"
import { handleFromMain, removeEventListeners, sendToMain } from "./events/enentHandler"
import ipcList from "./events/IpcList"

/*
 * 思源笔记内部PicGO对象定义
 */
class SyPicgo {
  private picgo: PicGo
  public ipcMethods

  constructor(configPath: string) {
    this.picgo = new PicGo(configPath)

    // 文件自动重命名
    this.picgo.helper.beforeUploadPlugins.register("renameFn", {
      handle: async (ctx: IPicGo) => {
        const autoRename = this.picgo.getConfig("settings.autoRename")
        if (autoRename) {
          await Promise.all(
            ctx.output.map(async (item, index) => {
              let fileName: string | undefined
              // eslint-disable-next-line prefer-const
              fileName = dayjs().add(index, "ms").format("YYYYMMDDHHmmSSS") + item.extname
              item.fileName = fileName
              console.log("即将自动重命名图片，新名称=>", fileName)
            })
          )
        }
      },
    })

    // 事件注册
    this.ipcMethods = {
      // eslint-disable-next-line @typescript-eslint/ban-types
      handleEvent: (channel: string, args?: object) => {
        sendToMain(channel, args)
      },
      registerEvent: (channel: string, eventCallback: any) => {
        handleFromMain(channel, eventCallback)
      },
      removeEvent: (channel: string) => {
        removeEventListeners(channel)
      },
    }

    // 开启监听
    ipcList.listen()
    console.log("SyPicgo开启Electron事件监听")

    console.log("picgo core inited.configPath", configPath)
  }

  /**
   * 初始化
   */
  activate() {
    this.picgo.saveConfig({
      debug: true,
      PICGO_ENV: "SY-PICGO",
    })
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.picgo.GUI_VERSION = pkg.version
    console.log("sy-picgo v" + pkg.version + " activated.")
  }

  /**
   * 上传图片
   * @param input 图片数组
   */
  public async upload(input?: any[]) {
    let ret
    console.log("PicGo is uploading...")
    try {
      const result = await this.picgo.upload(input)
      if (result instanceof Array) {
        ret = result
        console.log("upload success.total=>" + result.length)
      }
    } catch (e) {
      console.error("upload error", e)
      throw new Error("upload error, please check you picgo config!Detail info:" + JSON.stringify(e))
    }

    console.log("ret=>", ret)
    return JSON.stringify(ret)
  }

  /**
   * 从剪贴板上传图片
   */
  public async uploadFormClipboard() {
    let ret
    console.log("PicGo is uploading form clipboard... ")
    try {
      ret = await this.picgo.upload()
      console.log("upload success.")
      console.log("ret=>", ret)
    } catch (e) {
      console.error("upload error", e)
      throw new Error("upload error, please check you picgo config!Detail info:" + JSON.stringify(e))
    }
    return ret
  }

  /**
   * 销毁PicGO对象
   */
  deactivate() {
    this.picgo = null as any
    console.log("picgo deactivated.")
  }

  /**
   * 获取PicGO对象
   */
  public getPicgoObj() {
    // console.log("get current picgo object.")
    return this.picgo
  }

  /**
   * 合并目录
   *
   * @param appFolder 目录
   * @param filename 文件
   */
  public combinePath(appFolder: string, filename: string) {
    return path.join(appFolder, filename)
  }

  /**
   * 删除文件夹
   *
   * @param folder 文件夹
   */
  public rmFolder(folder: string) {
    if (fs.existsSync(folder)) {
      // fs.rm(folder, { recursive: true, force: true })
      fs.rmdirSync(folder, { recursive: true })
    }
  }

  /**
   * 删除文件
   *
   * @param filename 文件夹
   */
  public rmFile(filename: string) {
    if (fs.existsSync(filename)) {
      fs.unlinkSync(filename)
    }
  }

  /**
   * 还原文件
   *
   * @param data json数据
   * @param dstfile 目的地文件
   */
  public restoreCfg(data: string, dstfile: string) {
    fs.writeFileSync(dstfile, data, "utf8")
  }

  /**
   * 读取Json文件
   *
   * @param filename 文件名
   */
  public readFileAsJson(filename: string) {
    let data = "{}"
    if (fs.existsSync(filename)) {
      data = fs.readFileSync(filename, "utf8")
    }
    return data
  }
}

const picgoExtension = {
  getCrossPlatformAppDataFolder: () => {
    let configFilePath
    if (process.platform === "darwin") {
      configFilePath = path.join(process.env.HOME ?? "", "/Library/Application Support")
    } else if (process.platform === "win32") {
      // Roaming包含在APPDATA中了
      configFilePath = process.env.APPDATA
    } else if (process.platform === "linux") {
      configFilePath = process.env.HOME
    }

    return configFilePath
  },
  ensurePath: (folder: string) => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder)
    }
  },
  upgradeCfg: (oldCfg: string, newCfgFolder: string, newCfgName: string) => {
    const picgo_cfg_067 = oldCfg
    const picgo_cfg_folder_070 = newCfgFolder

    picgoExtension.ensurePath(picgo_cfg_folder_070)

    const picgo_cfg_070 = path.join(picgo_cfg_folder_070, newCfgName)
    if (fs.existsSync(picgo_cfg_067) && !fs.existsSync(picgo_cfg_070)) {
      console.warn("检测到旧的PicGO配置文件，启动迁移")
      fs.copyFileSync(picgo_cfg_067, picgo_cfg_070)
    }
  },
  joinPath: (appFolder: string, filename: string) => {
    return path.join(appFolder, filename)
  },
  initPicgo: (configPath: string) => {
    const syPicgo = new SyPicgo(configPath)
    syPicgo.activate()
    return syPicgo
  },
}

export default picgoExtension
