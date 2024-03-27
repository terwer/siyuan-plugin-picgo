/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * This is a browser shim that provides the same functional interface
 * as the main node export, but it does nothing.
 * @module
 */
export const onExit: (cb: any, opts?: { alwaysLast?: boolean }) => () => void = () => () => {}
export const load = () => {}
export const unload = () => {}
