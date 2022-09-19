import { SymmetricCryptoKey } from './symmetricCryptoKey'

export interface EncryptedObject {
  iv: ArrayBuffer
  data: ArrayBuffer
  mac?: ArrayBuffer
  key: SymmetricCryptoKey
}
