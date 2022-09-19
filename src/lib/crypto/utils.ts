import RNSimpleCrypto from 'react-native-simple-crypto'
import { Buffer } from '@craftzdog/react-native-buffer'

export function fromUtf8ToArray(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, 'utf8'))
}

export function fromBufferToUtf8(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('utf8')
}

export function fromB64ToArray(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, 'base64'))
}

export function toArrayBuffer(value: string | ArrayBuffer): ArrayBuffer {
  let buf: ArrayBuffer
  if (typeof value === 'string') {
    buf = fromUtf8ToArray(value).buffer
  } else {
    buf = value
  }
  return buf
}

export async function randomBytes(length: number): Promise<ArrayBuffer> {
  return RNSimpleCrypto.utils.randomBytes(length)
}
