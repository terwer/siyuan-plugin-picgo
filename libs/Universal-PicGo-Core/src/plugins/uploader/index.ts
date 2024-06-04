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
import tcYunUploader from "./tcyun"
import qiniuUploader from "./qiniu"
import upyunUploader from "./upyun"
import SMMSUploader from "./smms"
import imgurUploader from "./imgur"
import awss3Uploader from "./awss3"
import lskyUploader from "./lsky"

const buildInUploaders: IPicGoPlugin = () => {
  return {
    register(ctx: IPicGo) {
      githubUploader(ctx)
      gitlabUploader(ctx)
      aliYunUploader(ctx)
      tcYunUploader(ctx)
      qiniuUploader(ctx)
      upyunUploader(ctx)
      SMMSUploader(ctx)
      imgurUploader(ctx)
      awss3Uploader(ctx)
      lskyUploader(ctx)
    },
  }
}

export default buildInUploaders
