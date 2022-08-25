export type StoredWallet = { id: string; label: string; createdAt: number }
export type StoredWalletWithMnemonic = StoredWallet & { mnemonic: string }

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
  readonly #value: StoredWalletWithMnemonic

  constructor(wallet: StoredWalletWithMnemonic) {
    if (
      !(
        typeof wallet === 'object' &&
        isValidDeviceId(wallet.id) &&
        // a cheap way to make sure the date is reasonable
        new Date(wallet.createdAt).valueOf() > 1600000000000 &&
        parseMnemonic(wallet.mnemonic) &&
        wallet.label
      )
    ) {
      throw new Error('Invalid wallet')
    }

    this.#value = Object.freeze({
      id: wallet.id,
      label: wallet.label,
      createdAt: wallet.createdAt || Date.now(),
      mnemonic: wallet.mnemonic,
    })
  }

  get id() {
    return this.#value.id
  }

  get label() {
    return this.#value.label
  }

  get createdAt() {
    return this.#value.createdAt
  }

  toJSON(): StoredWallet {
    return { id: this.#value.id, label: this.#value.label, createdAt: this.#value.createdAt }
  }

  static fromJSON(wallet: string): Wallet {
    try {
      const result: StoredWalletWithMnemonic = JSON.parse(wallet)
      return new Wallet(result)
    } catch (e) {
      console.error('[Wallet.fromString] Invalid wallet data', e)
    }

    throw new Error('data is not a valid wallet')
  }
}
