/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IPicGo, IPicGoPlugin } from "../../types"
import githubUploader from "./github"
import gitlabUploader from "./gitlab"
import aliYunUploader from "./aliyun"
import qiniuUploader from "./qiniu"
import SMMSUploader from "./smms"
import imgurUploader from "./imgur"

const buildInUploaders: IPicGoPlugin = () => {
  return {
    register(ctx: IPicGo) {
      githubUploader(ctx)
      gitlabUploader(ctx)
      aliYunUploader(ctx)
      qiniuUploader(ctx)
      SMMSUploader(ctx)
      imgurUploader(ctx)
    },
  }
}

export default buildInUploaders
