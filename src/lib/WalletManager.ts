import { deleteItemAsync, getItemAsync, setItemAsync, WHEN_UNLOCKED } from 'expo-secure-store'
import { getEnrolledLevelAsync } from 'expo-local-authentication'
import { decrypt } from './crypto'
import { isValidDeviceId, isValidStoredWallet, parseMnemonic, StoredMnemonic, StoredWallet, StoredWalletWithMnemonic, Wallet } from './Wallet'
import AsyncStorage from '@react-native-async-storage/async-storage'

const getMnemonicKey = (key: string) => {
  if (!isValidDeviceId(key)) throw new Error('Invalid Mnemonic key')
  return `mnemonic_${key}`
}

const getWalletKey = (key: string) => {
  if (!isValidDeviceId(key)) throw new Error('Invalid Wallet key')
  return `wallet_${key}`
}

enum UpdateAction {
  ADD,
  REMOVE,
}

type StoredWalletsEntries = Array<[string, StoredWallet]>
type StoredWalletsMap = Map<string, StoredWallet>

export class WalletManager {
  #index: StoredWalletsMap = new Map()
  #useAuthentication = false

  public readonly [Symbol.toStringTag]: string = 'WalletManager'

  public async initialize() {
    try {
      if (this.#index.size === 0) {
        const index: StoredWalletsEntries = JSON.parse(
          (await AsyncStorage.getItem('mnemonic-index')) || '[]',
        )
        this.#index = new Map(index)
      } else {
        console.error('[WalletManager.initialize] initialize was already called')
      }
    } catch (e) {
      console.error('[WalletManager.initialize] Unable to read wallet index')
      // We couldn't parse the existing index, so we have to fall back to an empty index
      // We could end up with "lost" wallets, but I don't see a way to intelligently recover
      // from a failure to parse the stored JSON.
    }

    try {
      // https://docs.expo.dev/versions/latest/sdk/local-authentication/#securitylevel
      const securityLevel = await getEnrolledLevelAsync()
      this.#useAuthentication = securityLevel >= 1; // device has pin or biometrics
      console.info(`WalletManager.initialize] Device Security Level: ${securityLevel} useAuthentication:${this.#useAuthentication}`)
    } catch (e) {
      console.error('[WalletManager.initialize] Unable to determine device security state')
    }
  }

  public get size(): number {
    return this.#index.size
  }

  public async list() {
    return [...this.#index.values()]
  }

  public async add(value: { label: string; mnemonic: string }) {
    const ids = [...this.#index.keys()].sort((a, b) => Number(a) - Number(b))
    const nextId = ids.length ? String((Number(ids[ids.length - 1]) || 0) + 1) : '1'
    const wallet = await this.#setMnemonic(nextId, { ...value, id: nextId, createdAt: Date.now() })
    if (wallet) {
      try {
        const storedWallet = this.setStoredWallet(nextId, wallet.storedWallet)
        // Verify save and add to index
        await this.#updateIndex(nextId, UpdateAction.ADD, wallet)
        return storedWallet;
      } catch (e) {
        // if we fail here we should make sure to clean up
        this.deleteWallet(nextId);
      }
    }
  }

  public async deleteWallet(key: string): Promise<boolean> {
    try {
      await deleteItemAsync(getMnemonicKey(key))
    } catch (e) {
      console.error('[WalletManager.delete] Error deleting a wallet mnemonic')
    }

    try {
      await AsyncStorage.removeItem(getWalletKey(key))
      await this.#updateIndex(key, UpdateAction.REMOVE)
      return true
    } catch (e) {
      console.error('[WalletManager.delete] Error deleting a wallet')
    }
    return false
  }


  public has(key: string): boolean {
    return this.#index.has(key)
  }

  public keys(): IterableIterator<string> {
    return this.#index.keys()
  }

  public async updateStoredWallet(key: string, value: Partial<StoredWalletWithMnemonic>) {
    try {
      const originalWallet = await this.#getStoredWallet(key)
      if (originalWallet) {
        console.log("update wallet", { ...originalWallet, label: value.label ?? originalWallet.label })
        const storedWallet = await this.setStoredWallet(key, { ...originalWallet, label: value.label ?? originalWallet.label })
        if (storedWallet) {
          await this.#updateIndex(key, UpdateAction.ADD, storedWallet);
          return storedWallet;
        }
      }
      console.error('[update] Unable to find wallet to updated')
    } catch (e) {
      console.error('[update] Unable to update wallet', e)
    }

    return null
  }

  public async getStoredWalletWithMnemonic(key: string) {
    const keyString = key.toString();
    const storedWallet = await this.#getStoredWallet(keyString);
    const mnemonic = await this.#getMnemonic(keyString);
    if (storedWallet && mnemonic) {
      return (new Wallet({ ...storedWallet, mnemonic })).toJSON()
    }
  }


  public async setStoredWallet(key: string, value: StoredWallet): Promise<StoredWallet | null> {
    if (!isValidStoredWallet(value)) {
      console.error(`[setStoredWallet] Attempt to set failed: Invalid Stored Wallet`)
      return null
    }

    try {
      await AsyncStorage.setItem(getWalletKey(key), JSON.stringify({ ...value }))
      return { id: value.id, label: value.label, createdAt: value.createdAt }
    } catch (e) {
      console.error(`[setStoredWallet] Unable to set: ${e}`)
      return null
    }
  }


  async #getStoredWallet(key: string) {
    if (this.has(key)) {
      try {
        const result = await AsyncStorage.getItem(getWalletKey(key));
        if (result) {
          const storedWallet: StoredWallet = JSON.parse(result)
          if (isValidStoredWallet(storedWallet)) {
            return storedWallet
          } else {
            console.error('[WalletManager.getStoredWallet] Is not valid stored wallet:', storedWallet, typeof storedWallet, isValidDeviceId(storedWallet.id), Boolean(storedWallet.label))
          }
        }
        return null
      } catch (e) {
        // Delete a saved wallet if it's not valid
        await this.deleteWallet(key)
        console.error('[WalletManager.getStoredWallet] Unable to get stored wallet', e)
      }
    }
    console.error('[WalletManager.getStoredWallet] Key not found:', key)
    return null
  }

  async #getMnemonic(key: string) {
    if (this.has(key)) {
      try {
        const result = await getItemAsync(getMnemonicKey(key))
        if (result) {
          const storedMnemonic: StoredMnemonic = JSON.parse(result)
          return parseMnemonic(storedMnemonic.mnemonic)
        }
      } catch (e) {
        // Delete if it's not valid
        await this.deleteWallet(key)
        console.error('[WalletManager.getMnemonic] Unable to get mnemonic', e)
      }
    }
    return null
  }

  async #updateIndex(key: string, action: UpdateAction.REMOVE): Promise<void>
  async #updateIndex(key: string, action: UpdateAction.ADD, wallet: StoredWallet): Promise<void>
  async #updateIndex(key: string, action: UpdateAction, wallet?: StoredWallet): Promise<void> {
    console.log('[#updateIndex] Index Before', [...this.#index])
    try {
      // If we're adding a new deviceId, add it to the list to check
      if (action === UpdateAction.ADD && wallet && wallet.id === key) {
        this.#index.set(key, wallet)
      }

      if (action === UpdateAction.REMOVE) {
        this.#index.delete(key)
      }

      // We can't verify each saved mnemonic anymore because it'll prompt for biometrics
      await AsyncStorage.setItem('mnemonic-index', JSON.stringify([...this.#index]))
      console.log('[#updateIndex] Index After', [...this.#index])
    } catch (e) {
      console.error('[#updateIndex] Error updating mnemonic index', e)
      throw e
    }
  }


  async #setMnemonic(key: string, value: StoredWalletWithMnemonic): Promise<Wallet | null> {
    try {
      const wallet = new Wallet(value)
      try {
        await setItemAsync(getMnemonicKey(key), JSON.stringify({ mnemonic: wallet.toJSON().mnemonic }), {
          keychainAccessible: WHEN_UNLOCKED,
          requireAuthentication: this.#useAuthentication
        })
      } catch (e) {
        console.error(`[setMnemonic] Attempt to set mnemonic failed: ${e} requireAuthentication:${this.#useAuthentication}`)
        // if we attempted with auth, fallback to attempt without auth.  This may be only an issue on the emulators, but just in case
        // this may be better than failing entirely and having the app not work. 
        try {
          await setItemAsync(getMnemonicKey(key), JSON.stringify({ mnemonic: wallet.toJSON().mnemonic }), {
            keychainAccessible: WHEN_UNLOCKED,
            requireAuthentication: false,
          })
        } catch (e) {
          console.error(`[setMnemonic] Unable to set mnemonic: ${e}`)
          return null
        }
      }
      return wallet;
    } catch (e) {
      console.error(`[setMnemonic] Attempt to set failed: ${e} requireAuthentication:${this.#useAuthentication}`)
      return null
    }
  }

  async decryptWallet(encryptedWalletInfo: {
    email: string
    password: string
    encryptedWallet: string
  }) {
    const { email, password, encryptedWallet } = encryptedWalletInfo
    try {
      return await decrypt({ email, password, encryptedWallet })
    } catch (e) {
      throw new Error('Native wallet decryption failed: ' + e)
    }
  }
}
