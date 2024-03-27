/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

class Mac {
  accessKey: string
  secretKey: string
  options: any

  constructor(accessKey: string, secretKey: string, options?: Partial<any>) {
    this.accessKey = accessKey
    this.secretKey = secretKey
    this.options = { ...options }
  }
}

export { Mac }
