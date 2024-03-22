import { v4 as uuidv4 } from "uuid"

/**
 * ID生成统一入口
 */
const newUuid = () => {
  return uuidv4()
}

const IdUtil = {
  newUuid,
}

export default IdUtil
