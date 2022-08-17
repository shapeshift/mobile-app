export type StoredWallet = { id: string; label: string; mnemonic: string }

export const isValidDeviceId = (deviceId: string) => /[a-z0-9-]+/.test(deviceId)

const parseMnemonic = (mnemonic: unknown): string | null => {
  if (typeof mnemonic === 'string') {
    const m = mnemonic.split(' ')
    if (![12, 18, 24].includes(m.length)) {
      throw new Error('Invalid mnemonic')
    }
    return mnemonic
  }

  return null
}

export class Wallet {
  readonly #value: StoredWallet

  constructor(wallet: StoredWallet) {
    if (
      !(
        typeof wallet === 'object' &&
        isValidDeviceId(wallet.id) &&
        parseMnemonic(wallet.mnemonic) &&
        wallet.label
      )
    ) {
      throw new Error('Invalid wallet')
    }

    this.#value = Object.freeze({
      id: wallet.id,
      label: wallet.label,
      mnemonic: wallet.mnemonic,
    })
  }

  toJSON() {
    return JSON.stringify(this.#value)
  }

  static fromJSON(wallet: string): Wallet {
    try {
      const result: StoredWallet = JSON.parse(wallet)
      return new Wallet(result)
    } catch (e) {
      console.error('[Wallet.fromString] Invalid wallet data', e)
    }

    throw new Error('data is not a valid wallet')
  }
}
