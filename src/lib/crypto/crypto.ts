import RNSimpleCrypto from 'react-native-simple-crypto'
import scrypt from '@seald-io/react-native-scrypt'
import { Buffer } from '@craftzdog/react-native-buffer'

import { CipherString, EncryptionType, SymmetricCryptoKey } from './classes'
import * as utils from './utils'

async function hmac(
  value: ArrayBuffer,
  key: ArrayBuffer,
): Promise<ArrayBuffer | SharedArrayBuffer> {
  return RNSimpleCrypto.HMAC.hmac256(value, key)
}

// Safely compare two values in a way that protects against timing attacks (Double HMAC Verification).
// ref: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2011/february/double-hmac-verification/
// ref: https://paragonie.com/blog/2015/11/preventing-timing-attacks-on-string-comparison-with-double-hmac-strategy
async function compare(a: ArrayBuffer, b: ArrayBuffer): Promise<boolean> {
  const macKey = await utils.randomBytes(32)

  const mac1 = await RNSimpleCrypto.HMAC.hmac256(a, macKey)
  const mac2 = await RNSimpleCrypto.HMAC.hmac256(b, macKey)

  if (mac1.byteLength !== mac2.byteLength) {
    return false
  }

  const arr1 = new Uint8Array(mac1)
  const arr2 = new Uint8Array(mac2)
  for (let i = 0; i < arr2.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false
    }
  }

  return true
}

async function aesDecrypt(
  encType: EncryptionType,
  data: ArrayBuffer,
  iv: ArrayBuffer,
  mac: ArrayBuffer | null,
  key: SymmetricCryptoKey,
): Promise<ArrayBuffer | null> {
  if (key.encKey == null) {
    console.warn('Missing encryption key')
    return null
  }

  if (key.macKey != null && mac == null) {
    console.warn('mac required.')
    return null
  }

  if (key.encType !== encType) {
    console.warn('encType required.')
    return null
  }

  if (key.macKey != null && mac != null) {
    const macData = new Uint8Array(iv.byteLength + data.byteLength)

    macData.set(new Uint8Array(iv), 0)
    macData.set(new Uint8Array(data), iv.byteLength)

    const computedMac = await hmac(macData.buffer, key.macKey)

    if (computedMac === null) {
      return null
    }

    const macsMatch = await compare(mac, computedMac)

    if (!macsMatch) {
      console.warn('mac failed.')
      return null
    }
  }

  return RNSimpleCrypto.AES.decrypt(data, key.encKey, iv)
}

// @see: https://tools.ietf.org/html/rfc5869
async function hkdfExpand(prk: ArrayBuffer, info: Uint8Array, size: number): Promise<Uint8Array> {
  const hashLen = 32 // sha256
  const okm = new Uint8Array(size)

  let previousT = new Uint8Array(0)

  const n = Math.ceil(size / hashLen)
  for (let i = 0; i < n; i++) {
    const t = new Uint8Array(previousT.length + info.length + 1)

    t.set(previousT)
    t.set(info, previousT.length)
    t.set([i + 1], t.length - 1)

    previousT = new Uint8Array(await hmac(t.buffer, prk))

    okm.set(previousT, i * hashLen)
  }

  return okm
}

export async function stretchKey(key: SymmetricCryptoKey): Promise<SymmetricCryptoKey> {
  if (key.key.byteLength === 32) {
    const newKey = new Uint8Array(64)

    newKey.set(await hkdfExpand(key.key, utils.fromUtf8ToArray('enc'), 32))
    newKey.set(await hkdfExpand(key.key, utils.fromUtf8ToArray('mac'), 32), 32)

    return new SymmetricCryptoKey(newKey.buffer)
  } else if (key.key.byteLength === 64) {
    return key
  } else {
    throw new Error('Invalid key size.')
  }
}

async function pbkdf2(
  password: string | ArrayBuffer,
  salt: string | ArrayBuffer,
  algorithm: 'SHA256' | 'SHA512',
  iterations: number,
): Promise<ArrayBuffer> {
  salt = utils.toArrayBuffer(salt)

  return RNSimpleCrypto.PBKDF2.hash(password, salt, iterations, 32, algorithm)
}

export async function hashPassword(password: string, key: SymmetricCryptoKey): Promise<string> {
  if (!password || !key) {
    throw new Error('A password and symmetric crypto key are required to hash the password.')
  }

  const digest = await pbkdf2(key.key, password, 'SHA256', 1)
  return Buffer.from(digest).toString('base64')
}

export async function makeKey(password: string, email: string): Promise<SymmetricCryptoKey> {
  if (!password || !email) {
    throw new Error('A password and email are required to make a symmetric crypto key.')
  }

  const salt = new Uint8Array(
    RNSimpleCrypto.utils.convertUtf8ToArrayBuffer(email.normalize('NFKC')),
  )

  const key = await scrypt(password.normalize('NFKC'), Array.from(salt), 16384, 8, 1, 32)

  return new SymmetricCryptoKey(Buffer.from(key, 'hex'))
}

export async function decryptToUtf8(
  cipherString: CipherString,
  key: SymmetricCryptoKey,
): Promise<string | null> {
  if (!(cipherString.data && cipherString.iv && cipherString.mac && cipherString.encryptionType)) {
    return null
  }
  const data = utils.fromB64ToArray(cipherString.data).buffer
  const iv = utils.fromB64ToArray(cipherString.iv).buffer
  const mac = cipherString.mac ? utils.fromB64ToArray(cipherString.mac).buffer : null
  const decipher = await aesDecrypt(cipherString.encryptionType, data, iv, mac, key)

  if (decipher == null) {
    return null
  }

  return utils.fromBufferToUtf8(decipher)
}

export async function decryptWallet(
  cipherString: CipherString,
  key: SymmetricCryptoKey,
): Promise<string | null> {
  return decryptToUtf8(cipherString, await stretchKey(key))
}
