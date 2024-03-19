/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

// This script is copyed from https://raw.githubusercontent.com/jensyt/imurmurhash-js/master/imurmurhash.js
// access iMurmurHash using the global object MurmurHash3

/**
 @preserve
 JS Implementation of incremental MurmurHash3 (r150) (as of May 10, 2013)
 @author <a href="mailto:jensyt@gmail.com">Jens Taylor</a>
 @see http://github.com/homebrewing/brauhaus-diff
 @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 @see http://github.com/garycourt/murmurhash-js
 @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 @see http://sites.google.com/site/murmurhash/
 */

/**
 * This class representing MurmurHash3 implementation
 */

/**
 * Implementation of the MurmurHash3 algorithm
 */
class MurmurHash3 {
  private h1: number
  private rem: number
  private k1: number
  private len: number

  /**
   * Creates an instance of MurmurHash3.
   * @param seed - Optional seed for the hash function
   */
  constructor(seed = 0) {
    this.h1 = seed
    this.rem = 0
    this.k1 = 0
    this.len = 0
  }

  /**
   * Adds a string to the hash calculation.
   * @param {string} key - The string to be hashed
   * @returns {MurmurHash3} - The updated MurmurHash3 object
   */
  hash(key: string): MurmurHash3 {
    let h1: number = this.h1
    let k1: number
    let i = 0
    let len: number = key.length

    this.len += len

    for (; len >= 4; len -= 4) {
      k1 =
        (key.charCodeAt(i) & 0xff) |
        ((key.charCodeAt(i + 1) & 0xff) << 8) |
        ((key.charCodeAt(i + 2) & 0xff) << 16) |
        ((key.charCodeAt(i + 3) & 0xff) << 24)

      k1 = Math.imul(k1, 0xcc9e2d51)
      k1 = (k1 << 15) | (k1 >>> 17)
      k1 = Math.imul(k1, 0x1b873593)

      h1 ^= k1
      h1 = (h1 << 13) | (h1 >>> 19)
      h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0

      i += 4
    }

    this.h1 = h1
    this.rem = len
    this.k1 = 0

    return this
  }

  /**
   * Finalizes the hash calculation and returns the hash value.
   * @returns {number} - The 32-bit hash value
   */
  result(): number {
    let h1: number = this.h1
    let k1: number = this.k1

    k1 ^= this.len & 3

    k1 = Math.imul(k1, 0xcc9e2d51)
    k1 = (k1 << 15) | (k1 >>> 17)
    k1 = Math.imul(k1, 0x1b873593)

    h1 ^= k1

    h1 ^= this.len
    h1 ^= h1 >>> 16
    h1 = Math.imul(h1, 0x85ebca6b)
    h1 ^= h1 >>> 13
    h1 = Math.imul(h1, 0xc2b2ae35)
    h1 ^= h1 >>> 16

    return h1 >>> 0
  }

  /**
   * Resets the hash object for reuse.
   * @param {number} seed - Optional seed for the hash function
   * @returns {MurmurHash3} - The reset MurmurHash3 object
   */
  reset(seed?: number): MurmurHash3 {
    this.h1 = seed || 0
    this.rem = this.k1 = this.len = 0
    return this
  }
}

export default MurmurHash3
