/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { win } from "../../utils"
import { onExit } from "./signalExitShim"
import MurmurHash3 from "./Murmurhash3"

const murmurHash3 = new MurmurHash3(win.__filename)
const activeFiles = {} as any

// if we run inside of a worker_thread, `process.pid` is not unique
/* istanbul ignore next */
const threadId = (function getId() {
  try {
    const workerThreads = win.require("worker_threads")

    /// if we are in main thread, this is set to `0`
    return workerThreads.threadId
  } catch (e) {
    // worker_threads are not available, fallback to 0
    return 0
  }
})()

let invocations = 0
function getTmpname(filename: string) {
  return (
    filename +
    "." +
    murmurHash3.hash(String(win.process.pid)).hash(String(threadId)).hash(String(++invocations)).result()
  )
}

function cleanupOnExit(tmpfile: any) {
  return () => {
    try {
      const fs = win.fs
      fs.unlinkSync(typeof tmpfile === "function" ? tmpfile() : tmpfile)
    } catch {
      // ignore errors
    }
  }
}

function serializeActiveFile(absoluteName: string) {
  return new Promise((resolve: any) => {
    // make a queue if it doesn't already exist
    if (!activeFiles[absoluteName]) {
      activeFiles[absoluteName] = []
    }

    activeFiles[absoluteName].push(resolve) // add this job to the queue
    if (activeFiles[absoluteName].length === 1) {
      resolve()
    } // kick off the first one
  })
}

// https://github.com/isaacs/node-graceful-fs/blob/master/polyfills.js#L315-L342
function isChownErrOk(err: any) {
  if (err.code === "ENOSYS") {
    return true
  }

  const nonroot = !win.process.getuid || win.process.getuid() !== 0
  if (nonroot) {
    if (err.code === "EINVAL" || err.code === "EPERM") {
      return true
    }
  }

  return false
}

async function writeFileAsync(filename: string, data: any, options = {} as any) {
  const fs = win.fs
  const path = win.require("path")
  const { promisify } = win.require("util")

  if (typeof options === "string") {
    options = { encoding: options }
  }

  let fd
  let tmpfile: any
  /* istanbul ignore next -- The closure only gets called when onExit triggers */
  const removeOnExitHandler = onExit(cleanupOnExit(() => tmpfile))
  const absoluteName = path.resolve(filename)

  try {
    await serializeActiveFile(absoluteName)
    const truename = await promisify(fs.realpath)(filename).catch(() => filename)
    tmpfile = getTmpname(truename)

    if (!options.mode || !options.chown) {
      // Either mode or chown is not explicitly set
      // Default behavior is to copy it from original file
      const stats = await promisify(fs.stat)(truename).catch(() => {})
      if (stats) {
        if (options.mode == null) {
          options.mode = stats.mode
        }

        if (options.chown == null && win.process.getuid) {
          options.chown = { uid: stats.uid, gid: stats.gid }
        }
      }
    }

    fd = await promisify(fs.open)(tmpfile, "w", options.mode)
    if (options.tmpfileCreated) {
      await options.tmpfileCreated(tmpfile)
    }
    if (win.ArrayBuffer.isView(data)) {
      await promisify(fs.write)(fd, data, 0, data.length, 0)
    } else if (data != null) {
      await promisify(fs.write)(fd, String(data), 0, String(options.encoding || "utf8"))
    }

    if (options.fsync !== false) {
      await promisify(fs.fsync)(fd)
    }

    await promisify(fs.close)(fd)
    fd = null

    if (options.chown) {
      await promisify(fs.chown)(tmpfile, options.chown.uid, options.chown.gid).catch((err: any) => {
        if (!isChownErrOk(err)) {
          throw err
        }
      })
    }

    if (options.mode) {
      await promisify(fs.chmod)(tmpfile, options.mode).catch((err: any) => {
        if (!isChownErrOk(err)) {
          throw err
        }
      })
    }

    await promisify(fs.rename)(tmpfile, truename)
  } finally {
    if (fd) {
      await promisify(fs.close)(fd).catch(
        /* istanbul ignore next */
        () => {}
      )
    }
    removeOnExitHandler()
    await promisify(fs.unlink)(tmpfile).catch(() => {})
    activeFiles[absoluteName].shift() // remove the element added by serializeSameFile
    if (activeFiles[absoluteName].length > 0) {
      activeFiles[absoluteName][0]() // start next job if one is pending
    } else {
      delete activeFiles[absoluteName]
    }
  }
}

async function writeFile(filename: string, data: any, options: any, callback: any) {
  if (options instanceof Function) {
    callback = options
    options = {}
  }

  const promise = writeFileAsync(filename, data, options)
  if (callback) {
    try {
      const result = await promise
      return callback(result)
    } catch (err) {
      return callback(err)
    }
  }

  return promise
}

function writeFileSync(filename: string, data: any, options?: any) {
  const fs = win.fs

  if (typeof options === "string") {
    options = { encoding: options }
  } else if (!options) {
    options = {}
  }
  try {
    filename = fs.realpathSync(filename)
  } catch (ex) {
    // it's ok, it'll happen on a not yet existing file
  }
  const tmpfile = getTmpname(filename)

  if (!options.mode || !options.chown) {
    // Either mode or chown is not explicitly set
    // Default behavior is to copy it from original file
    try {
      const stats = fs.statSync(filename)
      options = Object.assign({}, options)
      if (!options.mode) {
        options.mode = stats.mode
      }
      if (!options.chown && win.process.getuid) {
        options.chown = { uid: stats.uid, gid: stats.gid }
      }
    } catch (ex) {
      // ignore stat errors
    }
  }

  let fd
  const cleanup = cleanupOnExit(tmpfile)
  const removeOnExitHandler = onExit(cleanup)

  let threw = true
  try {
    fd = fs.openSync(tmpfile, "w", options.mode || 0o666)
    if (options.tmpfileCreated) {
      options.tmpfileCreated(tmpfile)
    }
    if (win.ArrayBuffer.isView(data)) {
      fs.writeSync(fd, data, 0, data.length, 0)
    } else if (data != null) {
      fs.writeSync(fd, String(data), 0, String(options.encoding || "utf8"))
    }
    if (options.fsync !== false) {
      fs.fsyncSync(fd)
    }

    fs.closeSync(fd)
    fd = null

    if (options.chown) {
      try {
        fs.chownSync(tmpfile, options.chown.uid, options.chown.gid)
      } catch (err) {
        if (!isChownErrOk(err)) {
          throw err
        }
      }
    }

    if (options.mode) {
      try {
        fs.chmodSync(tmpfile, options.mode)
      } catch (err) {
        if (!isChownErrOk(err)) {
          throw err
        }
      }
    }

    fs.renameSync(tmpfile, filename)
    threw = false
  } finally {
    if (fd) {
      try {
        fs.closeSync(fd)
      } catch (ex) {
        // ignore close errors at this stage, error may have closed fd already.
      }
    }
    removeOnExitHandler()
    if (threw) {
      cleanup()
    }
  }
}

export { writeFile, writeFileSync, getTmpname, cleanupOnExit }
