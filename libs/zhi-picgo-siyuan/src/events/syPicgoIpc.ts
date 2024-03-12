import { getPicgoFromWindow, handleStreamlinePluginName, simpleClone } from "../utils/common"
import path from "path"
import { IPicGoHelperType } from "../utils/enum"
import { IGuiMenuItem, PicGo as PicGoCore } from "zhi-picgo-core"
import { handleFromMain, sendToMain } from "./enentHandler"
import { electronRequire } from "../utils/requireUtil"

const { dialog, getCurrentWindow } = electronRequire("@electron/remote")

// get uploader or transformer config
const getConfig = (name: string, type: IPicGoHelperType, ctx: PicGoCore) => {
  let config: any[] = []
  if (name === "") {
    return config
  } else {
    const handler = ctx.helper[type].get(name)
    if (handler) {
      if (handler.config) {
        config = handler.config(ctx)
      }
    }
    return config
  }
}

const handleConfigWithFunction = (config: any[]) => {
  for (const i in config) {
    if (typeof config[i].default === "function") {
      config[i].default = config[i].default()
    }
    if (typeof config[i].choices === "function") {
      config[i].choices = config[i].choices()
    }
  }
  return config
}

const getPluginList = (): IPicGoPlugin[] => {
  const picgo = getPicgoFromWindow()
  const STORE_PATH = picgo.baseDir

  const pluginList = picgo.pluginLoader.getFullList()
  const list = []
  for (const i in pluginList) {
    const plugin = picgo.pluginLoader.getPlugin(pluginList[i])!
    const pluginPath = path.join(STORE_PATH, `/node_modules/${pluginList[i]}`)
    const pluginPKG = require(path.join(pluginPath, "package.json"))
    const uploaderName = plugin.uploader || ""
    const transformerName = plugin.transformer || ""
    let menu: Omit<IGuiMenuItem, "handle">[] = []
    if (plugin.guiMenu) {
      menu = plugin.guiMenu(picgo).map((item) => ({
        label: item.label,
      }))
    }
    let gui = false
    if (pluginPKG.keywords && pluginPKG.keywords.length > 0) {
      if (pluginPKG.keywords.includes("picgo-gui-plugin")) {
        gui = true
      }
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const obj: IPicGoPlugin = {
      name: handleStreamlinePluginName(pluginList[i]),
      fullName: pluginList[i],
      author: pluginPKG.author.name || pluginPKG.author,
      description: pluginPKG.description,
      logo: "file://" + path.join(pluginPath, "logo.png").split(path.sep).join("/"),
      version: pluginPKG.version,
      gui,
      config: {
        plugin: {
          fullName: pluginList[i],
          name: handleStreamlinePluginName(pluginList[i]),
          config: plugin.config ? handleConfigWithFunction(plugin.config(picgo)) : [],
        },
        uploader: {
          name: uploaderName,
          config: handleConfigWithFunction(getConfig(uploaderName, IPicGoHelperType.uploader, picgo)),
        },
        transformer: {
          name: transformerName,
          config: handleConfigWithFunction(getConfig(uploaderName, IPicGoHelperType.transformer, picgo)),
        },
      },
      enabled: picgo.getConfig(`picgoPlugins.${pluginList[i]}`),
      homepage: pluginPKG.homepage ? pluginPKG.homepage : "",
      guiMenu: menu,
      ing: false,
    }
    list.push(obj)
  }
  return list
}

/**
 * 获取Path环境变量
 */
const getEnvPath = () => {
  const picgo = getPicgoFromWindow()

  // node
  const NODE_PATH = picgo.getConfig<Undefinable<string>>("settings.nodePath") || ""
  let ENV_PATH = process.env.PATH
  if (NODE_PATH !== "") {
    ENV_PATH = process.env.PATH + ":" + NODE_PATH
  }

  return ENV_PATH
}

// handles
const handleImportLocalPlugin = () => {
  handleFromMain("importLocalPlugin", async function (event: any, msg: any) {
    const res = await dialog.showOpenDialog(getCurrentWindow(), {
      properties: ["openDirectory"],
    })
    const filePaths = res.filePaths
    console.log("filePaths=>", filePaths)

    const picgo = getPicgoFromWindow()
    console.log("picgo=>", picgo)
    if (filePaths.length > 0) {
      const res = await picgo.pluginHandler.install(
        filePaths,
        {},
        {
          PATH: getEnvPath(),
        }
      )
      if (res.success) {
        try {
          const list = simpleClone(getPluginList())
          console.log("pluginList=>", list)
          sendToMain("pluginList", { success: true, data: list })
        } catch (e: any) {
          sendToMain("pluginList", {
            success: false,
            data: [],
            error: e.toString(),
          })
        }
      } else {
        sendToMain("pluginList", {
          success: false,
          data: [],
          error: "导入插件失败，请检查picgo.log",
        })
      }
    }
  })
}

const handleGetPluginList = () => {
  handleFromMain("getPluginList", async function (event: any, msg: any) {
    const picgo = getPicgoFromWindow()

    try {
      const list = simpleClone(getPluginList())
      // here can just send JS Object not function
      // or will cause [Failed to serialize arguments] error
      sendToMain("pluginList", { success: true, data: list })
    } catch (e: any) {
      sendToMain("pluginList", {
        success: false,
        data: [],
        error: e.toString(),
      })
      picgo.log.error(e)
    }
  })
}

const handlePluginInstall = () => {
  handleFromMain("installPlugin", async function (event: any, msg: any) {
    const picgo = getPicgoFromWindow()

    const fullName = msg.rawArgs
    const res = await picgo.pluginHandler.install(
      [fullName],
      {},
      {
        PATH: getEnvPath(),
      }
    )
    sendToMain("installPluginFinished", {
      success: res.success,
      body: fullName,
      errMsg: res.success ? "" : res.body,
    })
  })
}

const handlePluginUninstall = () => {
  handleFromMain("uninstallPlugin", async function (event: any, msg: any) {
    const picgo = getPicgoFromWindow()

    const fullName = msg.rawArgs
    const res = await picgo.pluginHandler.uninstall(
      [fullName],
      {},
      {
        PATH: getEnvPath(),
      }
    )

    sendToMain("uninstallSuccess", {
      success: res.success,
      body: fullName,
      errMsg: res.success ? "" : res.body,
    })
  })
}

const handlePluginUpdate = () => {
  handleFromMain("updatePlugin", async function (event: any, msg: any) {
    const picgo = getPicgoFromWindow()

    const fullName = msg.rawArgs
    const res = await picgo.pluginHandler.update(
      [fullName],
      {},
      {
        PATH: getEnvPath(),
      }
    )

    sendToMain("updateSuccess", {
      success: res.success,
      body: fullName,
      errMsg: res.success ? "" : res.body,
    })
  })
}

/**
 * 处理PicGO相关事件
 */
export default {
  listen() {
    handleImportLocalPlugin()
    handleGetPluginList()
    handlePluginInstall()
    handlePluginUninstall()
    handlePluginUpdate()
  },
}
