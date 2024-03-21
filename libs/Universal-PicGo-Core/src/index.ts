import { UniversalPicGo } from "./core/UniversalPicGo"
import { ExternalPicgo } from "./core/ExternalPicgo"
import { currentWin, hasNodeEnv, parentWin, win } from "universal-picgo-store"
import { PicgoTypeEnum } from "./utils/enums"
import { IPicGo, IImgInfo } from "./types"

export { UniversalPicGo, ExternalPicgo }
export { PicgoTypeEnum }
export { win, currentWin, parentWin, hasNodeEnv }
export { type IPicGo, type IImgInfo }
