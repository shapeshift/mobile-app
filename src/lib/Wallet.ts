export type StoredWallet = { id: string; label: string; createdAt: number }
export type StoredMnemonic = { mnemonic: string }
export type StoredWalletWithMnemonic = StoredWallet & StoredMnemonic


export const isValidDeviceId = (deviceId: string) => /[a-z0-9-]+/.test(deviceId)
export const isValidStoredWallet = (storedWallet: StoredWallet): boolean => {
  return typeof storedWallet === 'object' &&
    isValidDeviceId(storedWallet.id) &&
    // a cheap way to make sure the date is reasonable
    new Date(storedWallet.createdAt ?? Date.now()).valueOf() > 1600000000000 &&
    Boolean(storedWallet.label)
}

export const parseMnemonic = (mnemonic: unknown): string | null => {
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
        isValidStoredWallet(wallet) &&
        parseMnemonic(wallet.mnemonic)
      )
    ) {
      throw new Error('Invalid wallet')
    }

    this.#value = Object.freeze({
      id: wallet.id,
      label: wallet.label,
      createdAt: wallet.createdAt ?? Date.now(),
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

  /**
   * Returns non sensitive wallet meta-data only.  No mnemonic. 
   */
  get storedWallet(): StoredWallet {
    return { id: this.#value.id, label: this.#value.label, createdAt: this.#value.createdAt }
  }

  toJSON() {
    return this.#value
  }

  static fromJSON(wallet: string): Wallet {
    try {
      const result: StoredWalletWithMnemonic = JSON.parse(wallet)
      return new Wallet(result)
    } catch (e) {
      console.error('[Wallet.fromJSON] Invalid wallet data', e)
    }

    throw new Error('data is not a valid wallet')
  }
}
