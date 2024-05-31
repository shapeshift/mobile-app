import { Buffer } from '@craftzdog/react-native-buffer'
import scrypt from '@seald-io/react-native-scrypt'
import RNSimpleCrypto from 'react-native-simple-crypto'

import { CipherString, SymmetricCryptoKey } from './classes'
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

  if (mac && key.macKey) {
    const macData = new Uint8Array(iv.byteLength + data.byteLength)
    macData.set(new Uint8Array(iv), 0)
    macData.set(new Uint8Array(data), iv.byteLength)
    const computedMac = await hmac(utils.toArrayBuffer(macData), key.macKey)
    const macsMatch = await compare(mac, computedMac)

    if (!macsMatch) throw new Error('HMAC signature is not valid or data has been tampered with')
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

async function pbkdf2(
  password: string | ArrayBuffer,
  salt: string | ArrayBuffer,
  algorithm: 'SHA256' | 'SHA512',
  iterations: number,
): Promise<ArrayBuffer> {
  salt = utils.toArrayBuffer(salt)

  return RNSimpleCrypto.PBKDF2.hash(password, salt, iterations, 32, algorithm)
}

export async function makeKey(password: string, email: string): Promise<SymmetricCryptoKey> {
  if (!password || !email) {
    throw new Error('A password and email are required to make a symmetric crypto key.')
  }

  email = email.normalize('NFKC').trim().toLowerCase()
  password = password.normalize('NFKC')

  const saltArray = Buffer.from(email, 'utf8')
  const passwordArray = Buffer.from(password, 'utf8')
  // The 'buffer' encoding is required to get the right value
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore this is crypto stuff, absolutely not touching/bumping things here despite the type error if this is happy at runtime
  // meaning we can decrypt a locked native wallet
  const key = await scrypt(passwordArray, saltArray, 16384, 8, 1, 32, 'buffer')

  const hashKey = await pbkdf2(key, password, 'SHA256', 1)
  const stretchedKey = await hkdfExpand(key, utils.fromUtf8ToArray('enc'), 32)
  const macKey = await hkdfExpand(key, utils.fromUtf8ToArray('mac'), 32)

  return new SymmetricCryptoKey(hashKey, stretchedKey, macKey)
}

export async function decryptWallet(
  cipherString: CipherString,
  key: SymmetricCryptoKey,
): Promise<string | null> {
  if (!(cipherString.data && cipherString.iv && cipherString.mac && cipherString.encryptionType)) {
    return null
  }
  const data = utils.fromB64ToArray(cipherString.data).buffer
  const iv = utils.fromB64ToArray(cipherString.iv).buffer
  const mac = cipherString.mac ? utils.fromB64ToArray(cipherString.mac).buffer : null
  const decipher = await aesDecrypt(data, iv, mac, key)

  return decipher == null ? null : utils.fromBufferToUtf8(decipher)
}
