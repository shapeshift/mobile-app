import { deleteItemAsync, getItemAsync, setItemAsync, WHEN_UNLOCKED } from 'expo-secure-store'
import { isValidDeviceId, StoredWallet, StoredWalletWithMnemonic, Wallet } from './Wallet'

const getKey = (key: string) => {
  if (!isValidDeviceId(key)) throw new Error('Invalid key')
  return `mnemonic_${key}`
}

enum UpdateAction {
  ADD,
  REMOVE,
}

export class WalletManager {
  #index = new Set<string>()

  public readonly [Symbol.toStringTag]: string = 'WalletManager'

  public async initialize() {
    try {
      if (this.#index.size === 0) {
        const index: string[] = JSON.parse((await getItemAsync('mnemonic-index')) || '[]')
        this.#index = new Set(index)
      } else {
        console.error('[WalletManager.initialize] initialize was already called')
      }
    } catch (e) {
      console.error('[WalletManager.initialize] Unable to read wallet index')
      // We couldn't parse the existing index, so we have to fall back to an empty index
      // We could end up with "lost" wallets, but I don't see a way to intelligently recover
      // from a failure to parse the stored JSON.
    }
  }

  public get size(): number {
    return this.#index.size
  }

  public async list() {
    const list: Array<StoredWallet> = []
    for (const id of this.#index) {
      try {
        const w = await this.get(id)
        if (w) {
          list.push({ id: w.id, label: w.label, createdAt: w.createdAt })
        }
      } catch (e) {
        console.error('[WalletManager.list] Error getting a wallet')
      }
    }

    return list
  }

  public async add(value: { label: string; mnemonic: string }) {
    const ids = [...this.#index].sort((a, b) => Number(a) - Number(b))
    const nextId = ids.length ? String((Number(ids[ids.length - 1]) || 0) + 1) : '1'

    return this.set(nextId, { ...value, id: nextId, createdAt: Date.now() })
  }

  public async delete(key: string): Promise<boolean> {
    try {
      await this.#updateIndex(key, UpdateAction.REMOVE)
      return true
    } catch (e) {
      console.error('[WalletManager.delete] Error deleting a wallet')
    }

    return false
  }

  public async get(key: string): Promise<Wallet | null> {
    if (this.has(key)) {
      try {
        const result = await getItemAsync(getKey(key))
        if (result) return Wallet.fromJSON(result)
      } catch (e) {
        console.error('[WalletManager.get] Unable to get mnemonic', e)
      }
    }

    return null
  }

  public has(key: string): boolean {
    return this.#index.has(key)
  }

  public keys(): IterableIterator<string> {
    return this.#index.keys()
  }

  public async set(key: string, value: StoredWalletWithMnemonic): Promise<StoredWallet | null> {
    try {
      const wallet = new Wallet(value)
      await setItemAsync(getKey(key), JSON.stringify(wallet.toJSON()), {
        keychainAccessible: WHEN_UNLOCKED,
      })
      // Verify save and add to index
      await this.#updateIndex(key, UpdateAction.ADD)
      return { id: wallet.id, label: wallet.label, createdAt: wallet.createdAt }
    } catch (e) {
      console.error('[setMnemonic] Unable to set mnemonic', e)
      return null
    }
  }

  async #updateIndex(key: string, action: UpdateAction) {
    console.log('[#updateIndex] Index Before', [...this.#index])
    try {
      // If we're adding a new deviceId, add it to the list to check
      if (action === UpdateAction.ADD) {
        this.#index.add(key)
      }

      for (const id of this.#index) {
        const exists = await getItemAsync(getKey(id))
        // Use a key of '*' to delete all wallets
        if (!exists || (action === UpdateAction.REMOVE && (key === id || key === '*'))) {
          try {
            // This is the only place we remove an item from the index
            await deleteItemAsync(getKey(id))
            this.#index.delete(id)
            console.log('[#updateIndex] Removed item', id)
          } catch (e) {
            console.error('[#updateIndex] Could not remove invalid mnemonic', id, e)
          }
        }
      }

      await setItemAsync('mnemonic-index', JSON.stringify([...this.#index]))
      console.log('[#updateIndex] Index After', [...this.#index])
    } catch (e) {
      console.error('[#updateIndex] Error updating mnemonic index', e)
      throw e
    }
  }
}
