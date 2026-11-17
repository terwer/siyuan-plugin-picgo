/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2026 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { configureLogger } from "zhi-lib-base"

/**
 * Configure the zhi runtime loggers for the browser app.
 *
 * The console stays quiet by default and prints warnings and errors only.
 * The upload action lines keep printing at INFO so a user can still tell
 * "nothing happened" from "uploaded N images" without enabling debug noise.
 *
 * `simpleLogger` resolves the level on every call, so this may run after
 * modules that already created a logger at import time.
 */
export const configureLogging = (): void => {
  configureLogger({
    level: "warn",
    overrides: {
      // upload start/done in universal-picgo, paste start in the bootstrap
      "picgo-plugin": "info",
      "universal-picgo": "info",
    },
  })
}
