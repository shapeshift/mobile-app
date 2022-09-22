import { EncryptionType } from './encryptionType'

export class CipherString {
  encryptedString?: string
  encryptionType?: EncryptionType
  data?: string
  iv?: string
  mac?: string

  constructor(
    encryptedStringOrType: string | EncryptionType,
    data?: string,
    iv?: string,
    mac?: string,
  ) {
    if (data != null) {
      const encType = encryptedStringOrType as EncryptionType

      this.encryptedString = `${encType}.${data}|${iv}|${mac}`
      this.encryptionType = encType
      this.data = data
      this.iv = iv

      if (mac != null) {
        this.mac = mac
      }

      return
    }

    this.encryptedString = encryptedStringOrType as string
    if (!this.encryptedString) {
      return
    }

    const header = this.encryptedString.split('.')

    if (header.length === 2) {
      try {
        this.encryptionType = Number(header[0])
        ;[this.data, this.iv, this.mac] = header[1].split('|')
      } catch (e) {
        console.error('[CipherString]', e)
        return
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-extra-semi
      ;[this.data, this.iv, this.mac] = this.encryptedString.split('|')

      this.encryptionType = this.mac
        ? EncryptionType.AesCbc128_HmacSha256_B64
        : EncryptionType.AesCbc256_B64
    }

    switch (this.encryptionType) {
      case EncryptionType.AesCbc128_HmacSha256_B64:
      case EncryptionType.AesCbc256_HmacSha256_B64:
        if (!this.mac) throw new Error('MAC required for encryption type.')
        break
      case EncryptionType.AesCbc256_B64:
        if (!this.iv) throw new Error('IV required for encryption type.')
        break
      case EncryptionType.Rsa2048_OaepSha256_B64:
      case EncryptionType.Rsa2048_OaepSha1_B64:
        if (!this.data) throw new Error('Data required for encryption type')
        break
      default:
        return
    }
  }
}
