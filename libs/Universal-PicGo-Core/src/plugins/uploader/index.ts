/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IPicGo, IPicGoPlugin } from "../../types"
import SMMSUploader from "./smms"
import githubUploader from "./github"
import gitlabUploader from "./gitlab"
import aliYunUploader from "./aliyun"
const buildInUploaders: IPicGoPlugin = () => {
  return {
    register(ctx: IPicGo) {
      SMMSUploader(ctx)
      githubUploader(ctx)
      gitlabUploader(ctx)
      aliYunUploader(ctx)
    },
  }
}

export default buildInUploaders
