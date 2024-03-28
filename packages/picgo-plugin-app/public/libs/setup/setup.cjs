/**
 * 这个脚本会在执行 `await zhi.npm.checkAndInitNode()` 的时候自动调用
 * 可在这里写上一些需要安装其他包的脚本
 */
const https = require("https")
const fs = require("fs")
const path = require("path")
const child_process = require("child_process")
const os = require("os")

const downloadAndInstallNodeJS = async (version, installDir) => {
  const downloadUrl = (() => {
    switch (os.platform()) {
      case "win32":
        return `https://npmmirror.com/mirrors/node/${version}/node-${version}-win-x64.zip`
      case "darwin":
        return `https://npmmirror.com/mirrors/node/${version}/node-${version}-darwin-x64.tar.gz`
      case "linux":
        return `https://npmmirror.com/mirrors/node/${version}/node-${version}-linux-x64.tar.xz`
      default:
        throw new Error("不支持的操作系统")
    }
  })()
  console.log("获取到下载链接：", downloadUrl)

  if (!fs.existsSync(installDir)) {
    fs.mkdirSync(installDir, { recursive: true })
  }

  const downloadPath = path.join(installDir, `node-${version}.tar.gz`)
  const extractDir = path.join(installDir, "current")

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(downloadPath)
    const request = https.get(downloadUrl, (response) => {
      if (response.statusCode !== 200) {
        if (response.statusCode === 302 && response.headers.location) {
          // Handle 302 redirect
          console.log("Received 302 Redirect. New URL:", response.headers.location)
          const newUrl = response.headers.location
          const newRequest = https.get(newUrl, (newResponse) => {
            if (newResponse.statusCode !== 200) {
              reject(new Error(`Failed to download Node.js. Status code: ${newResponse.statusCode}`))
              return
            }
            newResponse.pipe(file)
            newResponse.on("end", () => {
              console.log("Node.js安装包下载完成 =>", downloadPath)

              if (os.platform() === "win32") {
                const psCommand = `Expand-Archive -Path ${downloadPath} -DestinationPath ${extractDir}`
                child_process.execSync(`powershell ${psCommand}`)
              } else {
                const tarCommand = `tar -xzf "${downloadPath}" -C "${installDir}"`
                child_process.execSync(tarCommand)
              }

              const baseFilename = path.basename(downloadUrl)
              const zipFolder = baseFilename.substring(0, baseFilename.lastIndexOf("x64") + 3)
              console.log("Node.js安装包解压完成 =>", zipFolder)
              fs.unlinkSync(downloadPath)

              // 重命名文件夹为"current"
              fs.renameSync(path.join(installDir, zipFolder), extractDir)
              console.log("Node.js重命名完成 =>", extractDir)
              console.log(`Node.js ${version} 已成功安装到 ${extractDir}`)
              resolve()
            })
          })
          newRequest.on("error", (e) => {
            console.error("重新发起下载请求时发生错误:", e)
            reject(e)
          })
        } else {
          reject(new Error(`Failed to download Node.js. Status code: ${response.statusCode}`))
        }
        return
      }
      response.pipe(file)
      response.on("end", () => {
        console.log("Node.js安装包下载完成")

        if (os.platform() === "win32") {
          const psCommand = `Expand-Archive -Path ${downloadPath} -DestinationPath ${extractDir}`
          child_process.execSync(`powershell ${psCommand}`)
        } else {
          const tarCommand = `tar -xzf ${downloadPath} -C ${installDir}`
          child_process.execSync(tarCommand)
        }

        console.log("Node.js安装包解压完成")
        fs.unlinkSync(downloadPath)

        fs.renameSync(path.join(installDir, `node-${version}`), extractDir)

        console.log(`Node.js ${version} 已成功安装到 ${installDir}/current`)
        resolve()
      })
    })

    request.on("error", (e) => {
      console.error("下载Node.js安装包时发生错误:", e)
      reject(e)
    })
  })
}

const installNodeJS = async () => {
  console.log(process.argv)
  const nodeVersion = process.argv.length >= 3 ? process.argv[2] : "v18.18.2"
  const installDirectory = process.argv.length >= 4 ? process.argv[3] : process.cwd()
  console.log(`Node.js ${nodeVersion} 准备安装到 ${installDirectory}/current，请稍后...`)
  try {
    await downloadAndInstallNodeJS(nodeVersion, installDirectory)
    console.info("Node.js 安装成功😄")
  } catch (error) {
    console.error("安装Node.js时发生错误:", error)
  }
}

;(async () => {
  await installNodeJS()
})()
