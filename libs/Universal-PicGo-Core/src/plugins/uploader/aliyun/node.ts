/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

// Backward-compatible internal adapter name.
//
// The old implementation imported ali-oss at module top-level. Even when the
// runtime branch was not used by browser targets, the static import forced the
// SDK and its core-js/lodash dynamic-global fallbacks into generic bundles.
// Keep the internal symbol available, but delegate to the signed HTTP uploader
// that works through ctx.request and explicit proxy/host request handling.
export { handleWeb as handleNode } from "./web"
