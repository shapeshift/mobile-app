import { Buffer } from 'buffer'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import * as SecureStore from 'expo-secure-store'
import {
  authorizeSeed,
  requestPublicKey as requestPublicKeyFromVault,
  signMessage as signMessageWithVault,
  deauthorizeSeed,
  getAuthorizedSeeds,
  PURPOSE_SIGN_SOLANA_TRANSACTION,
} from '../../modules/expo-seed-vault/src'
import { checkSeedVaultPermission, requestSeedVaultPermission } from './requestSeedVaultPermission'
// NOTE: @solana-mobile/mobile-wallet-adapter-protocol-web3js is Android-only.
// Always use dynamic import() to avoid crashing on iOS at module load time.

/**
 * Seeker Wallet Manager - POC Implementation
 *
 * This manager handles communication with Solana Mobile's Seeker wallet
 * via the Mobile Wallet Adapter (MWA) protocol.
 *
 * NOTE: MWA is a React Native library that uses Android intents to communicate
 * with wallet apps installed on the device (like Seeker's built-in Seed Vault).
 *
 * Key differences from regular wallet storage:
 * - Private keys are managed by Seeker's Seed Vault, NOT by this app
 * - We only store the auth_token for session reuse
 * - All signing operations go through MWA to the Seed Vault
 */

// Types matching MWA API
export type SeekerAccount = {
  address: string
  label?: string
  publicKey: Uint8Array
}

export type SeekerAuthorizationResult = {
  accounts: SeekerAccount[]
  authToken: string
  walletUriBase?: string
}

export type SeekerAppIdentity = {
  name: string
  uri: string
  icon: string
}

// MWA cluster type
type MwaCluster = 'mainnet-beta' | 'devnet' | 'testnet'

const APP_IDENTITY: SeekerAppIdentity = {
  name: 'ShapeShift',
  uri: 'https://app.shapeshift.com',
  icon: '/favicon.ico',
}

const DEFAULT_CLUSTER: MwaCluster = 'mainnet-beta'
const SEED_VAULT_AUTH_TOKEN_KEY = 'seeker_seed_vault_auth_token'

export class SeekerWalletManager {
  #authResult: SeekerAuthorizationResult | null = null
  #isAvailable: boolean | null = null
  #seedAuthTokens: Map<string, string> = new Map()
  #seedVaultAuthToken: string | null = null
  #seedVaultAuthTokenLoaded = false
  #seedVaultQueue: Promise<void> = Promise.resolve()

  public readonly [Symbol.toStringTag]: string = 'SeekerWalletManager'

  private withSeedVaultQueue<T>(fn: () => Promise<T>): Promise<T> {
    const queued = this.#seedVaultQueue.then(fn, fn)
    this.#seedVaultQueue = queued.then(
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
    )
    return queued
  }

  private async loadSeedVaultAuthToken(): Promise<void> {
    if (this.#seedVaultAuthTokenLoaded) return

    try {
      const token = await SecureStore.getItemAsync(SEED_VAULT_AUTH_TOKEN_KEY)
      if (token) {
        this.#seedVaultAuthToken = token
      }
    } catch (error) {
      console.warn('[SeekerWalletManager] Failed to load seed vault auth token:', error)
    }
    this.#seedVaultAuthTokenLoaded = true
  }

  private async saveSeedVaultAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(SEED_VAULT_AUTH_TOKEN_KEY, token)
      this.#seedVaultAuthToken = token
    } catch (error) {
      console.error('[SeekerWalletManager] Failed to save seed vault auth token:', error)
      this.#seedVaultAuthToken = token
    }
  }

  private async clearSeedVaultAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SEED_VAULT_AUTH_TOKEN_KEY)
    } catch (error) {
      console.warn('[SeekerWalletManager] Failed to clear seed vault auth token:', error)
    }
    this.#seedVaultAuthToken = null
  }

  // authorizeSeed() shows an empty modal when the seed is already authorized — check existing authorizations first
  private async getOrAuthorizeSeedToken(): Promise<string> {
    try {
      const authorizedSeeds = await getAuthorizedSeeds(PURPOSE_SIGN_SOLANA_TRANSACTION)
      if (authorizedSeeds.length > 0) {
        return authorizedSeeds[0].authToken
      }
    } catch (error) {
      console.warn(
        '[SeekerWalletManager] Failed to get authorized seeds, will request new authorization:',
        error,
      )
    }

    return await authorizeSeed(PURPOSE_SIGN_SOLANA_TRANSACTION)
  }

  /**
   * Check if MWA/Seeker wallet is available on this device
   */
  public async checkAvailability(): Promise<boolean> {
    if (this.#isAvailable !== null) {
      return this.#isAvailable
    }

    try {
      // Dynamic import - will fail if not in React Native environment with MWA
      const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol-web3js')

      // Try a quick transact to see if any wallet responds
      // This will open the wallet selector if available
      this.#isAvailable = typeof transact === 'function'
      return this.#isAvailable
    } catch (e) {
      this.#isAvailable = false
      return false
    }
  }

  /**
   * Check if we have a valid authorization
   */
  public get isAuthorized(): boolean {
    return this.#authResult !== null && this.#authResult.accounts.length > 0
  }

  /**
   * Get the authorized account address
   */
  public get address(): string | null {
    return this.#authResult?.accounts[0]?.address ?? null
  }

  /**
   * Get the cached auth token
   */
  public get authToken(): string | null {
    return this.#authResult?.authToken ?? null
  }

  /**
   * Authorize with Seeker wallet via MWA
   * This will open the Seeker wallet UI for user approval
   */
  public async authorize(
    cluster: MwaCluster = DEFAULT_CLUSTER,
  ): Promise<SeekerAuthorizationResult> {
    const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol-web3js')

    const result = await transact(async wallet => {
      const authResult = await wallet.authorize({
        cluster,
        identity: APP_IDENTITY,
      })

      return {
        accounts: authResult.accounts.map(account => {
          const publicKeyBytes = new Uint8Array(Buffer.from(account.address, 'base64'))
          const base58Address = new PublicKey(publicKeyBytes).toBase58()
          return {
            address: base58Address,
            label: account.label,
            publicKey: publicKeyBytes,
          }
        }),
        authToken: authResult.auth_token,
        walletUriBase: authResult.wallet_uri_base,
      }
    })

    this.#authResult = result
    return result
  }

  /**
   * Reauthorize using cached auth token
   * Faster than full authorization if token is still valid
   */
  public async reauthorize(
    _cluster: MwaCluster = DEFAULT_CLUSTER,
  ): Promise<SeekerAuthorizationResult | null> {
    if (!this.#authResult?.authToken) {
      console.warn('[SeekerWalletManager] No auth token for reauthorization')
      return null
    }

    try {
      const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol-web3js')

      const result = await transact(async wallet => {
        const authResult = await wallet.authorize({
          identity: APP_IDENTITY,
          auth_token: this.#authResult!.authToken,
        })

        return {
          accounts: authResult.accounts.map(account => {
            const publicKeyBytes = new Uint8Array(Buffer.from(account.address, 'base64'))
            const base58Address = new PublicKey(publicKeyBytes).toBase58()
            return {
              address: base58Address,
              label: account.label,
              publicKey: publicKeyBytes,
            }
          }),
          authToken: authResult.auth_token,
          walletUriBase: authResult.wallet_uri_base,
        }
      })

      this.#authResult = result
      return result
    } catch (e) {
      console.error('[SeekerWalletManager] Reauthorization failed:', e)
      // Clear cached auth on failure
      this.#authResult = null
      return null
    }
  }

  /**
   * Deauthorize and clear cached auth
   */
  public async deauthorize(): Promise<void> {
    await this.clearSeedAuthorizations()
    await this.clearSeedVaultAuthToken()

    if (!this.#authResult?.authToken) {
      this.#authResult = null
      return
    }

    try {
      const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol-web3js')

      await transact(async wallet => {
        await wallet.deauthorize({ auth_token: this.#authResult!.authToken })
      })
    } catch (e) {
      console.error('[SeekerWalletManager] Deauthorization failed:', e)
    } finally {
      this.#authResult = null
    }
  }

  /**
   * Sign a Solana transaction via Seeker wallet
   * The transaction should be a base64-encoded serialized VersionedTransaction
   */
  public async signTransaction(serializedTx: string): Promise<string> {
    if (!this.isAuthorized) {
      throw new Error('Not authorized with Seeker wallet')
    }

    const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol-web3js')

    // Decode the transaction
    const txBytes = Buffer.from(serializedTx, 'base64')
    const transaction = VersionedTransaction.deserialize(txBytes)

    const signedTx = await transact(async wallet => {
      // Reauthorize within the transaction session
      await wallet.authorize({
        identity: APP_IDENTITY,
        auth_token: this.#authResult!.authToken,
      })

      const [signedTransaction] = await wallet.signTransactions({
        transactions: [transaction],
      })

      return signedTransaction
    })

    // Return base64 encoded signed transaction
    return Buffer.from(signedTx.serialize()).toString('base64')
  }

  /**
   * Sign and send a Solana transaction via Seeker wallet
   */
  public async signAndSendTransaction(serializedTx: string): Promise<string> {
    if (!this.isAuthorized) {
      throw new Error('Not authorized with Seeker wallet')
    }

    const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol-web3js')

    // Decode the transaction
    const txBytes = Buffer.from(serializedTx, 'base64')
    const transaction = VersionedTransaction.deserialize(txBytes)

    const signature = await transact(async wallet => {
      // Reauthorize within the transaction session
      await wallet.authorize({
        identity: APP_IDENTITY,
        auth_token: this.#authResult!.authToken,
      })

      const [txSignature] = await wallet.signAndSendTransactions({
        transactions: [transaction],
      })

      return txSignature
    })

    return signature
  }

  /**
   * Get the Solana address from the authorized account
   */
  public getAddress(): string | null {
    return this.address
  }

  /**
   * Clear all seed authorizations from Seed Vault
   *
   * Deauthorizes all previously authorized seeds for the current app.
   * This is useful for cleaning up cached authorizations.
   */
  public async clearSeedAuthorizations(): Promise<void> {
    try {
      const authorizedSeeds = await getAuthorizedSeeds(PURPOSE_SIGN_SOLANA_TRANSACTION)

      for (const seed of authorizedSeeds) {
        try {
          await deauthorizeSeed(seed.authToken)
        } catch (error) {
          console.warn('[SeekerWalletManager] Failed to deauthorize seed:', seed.authToken, error)
        }
      }
    } catch (error) {
      console.warn('[SeekerWalletManager] Failed to get authorized seeds:', error)
    }

    for (const [derivationPath, authToken] of this.#seedAuthTokens.entries()) {
      try {
        await deauthorizeSeed(authToken)
      } catch (error) {
        console.warn(
          '[SeekerWalletManager] Failed to deauthorize cached seed for path:',
          derivationPath,
          error,
        )
      }
    }

    this.#seedAuthTokens.clear()
  }

  /**
   * Get a public key for a custom derivation path from Seed Vault
   *
   * Uses the native Seed Vault SDK directly via Expo module, bypassing MWA protocol limitations.
   * This enables multi-chain support with custom derivation paths.
   *
   * @param derivationPath BIP32 URI format (e.g., "bip32:/m/44'/397'/0'")
   * @returns Object containing base58-encoded public key
   * @throws Error if not authorized or request fails
   */
  public async getPublicKey(derivationPath: string): Promise<{ publicKey: string }> {
    if (!this.isAuthorized) {
      throw new Error('Not authorized with Seeker wallet')
    }

    return this.withSeedVaultQueue(() => this.getPublicKeyInternal(derivationPath))
  }

  private async getPublicKeyInternal(derivationPath: string): Promise<{ publicKey: string }> {
    const hasPermission = await checkSeedVaultPermission()

    if (!hasPermission) {
      const granted = await requestSeedVaultPermission()

      if (!granted) {
        throw new Error('Seed Vault permission denied by user')
      }

      await new Promise<void>(resolve => setTimeout(resolve, 500))
    }

    try {
      await this.loadSeedVaultAuthToken()
      const cachedAuthToken = this.#seedVaultAuthToken

      if (cachedAuthToken) {
        try {
          const result = await requestPublicKeyFromVault(cachedAuthToken, derivationPath)

          if (result.authToken) {
            await this.saveSeedVaultAuthToken(result.authToken)
          }

          const publicKeyBytes = new Uint8Array(Buffer.from(result.publicKey, 'base64'))
          const base58PublicKey = new PublicKey(publicKeyBytes).toBase58()

          return { publicKey: base58PublicKey }
        } catch (error) {
          console.warn(
            '[SeekerWalletManager] Cached auth token failed, will request new authorization:',
            error,
          )
          await this.clearSeedVaultAuthToken()
        }
      }

      const authToken = await this.getOrAuthorizeSeedToken()

      const result = await requestPublicKeyFromVault(authToken, derivationPath)

      const tokenToSave = result.authToken || authToken
      await this.saveSeedVaultAuthToken(tokenToSave)

      const publicKeyBytes = new Uint8Array(Buffer.from(result.publicKey, 'base64'))
      const base58PublicKey = new PublicKey(publicKeyBytes).toBase58()

      return { publicKey: base58PublicKey }
    } catch (error) {
      console.error('[SeekerWalletManager] getPublicKey failed:', {
        derivationPath,
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new Error(
        `Failed to get public key from Seed Vault: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
    }
  }

  /**
   * Sign an arbitrary message using Seed Vault
   *
   * Uses the native Seed Vault SDK's message signing capability for non-Solana transactions.
   * This is useful for signing NEAR, TON, SUI, and other blockchain-specific data.
   *
   * @param message Base64-encoded message to sign
   * @param derivationPath BIP32 URI format (e.g., "bip32:/m/44'/397'/0'")
   * @returns Object containing base64-encoded signature
   * @throws Error if not authorized or signing fails
   */
  public async signMessage(
    message: string,
    derivationPath: string,
  ): Promise<{ signature: string }> {
    if (!this.isAuthorized) {
      throw new Error('Not authorized with Seeker wallet')
    }

    return this.withSeedVaultQueue(() => this.signMessageInternal(message, derivationPath))
  }

  private async signMessageInternal(
    message: string,
    derivationPath: string,
  ): Promise<{ signature: string }> {
    const hasPermission = await checkSeedVaultPermission()

    if (!hasPermission) {
      const granted = await requestSeedVaultPermission()

      if (!granted) {
        throw new Error('Seed Vault permission denied by user')
      }

      await new Promise<void>(resolve => setTimeout(resolve, 500))
    }

    try {
      await this.loadSeedVaultAuthToken()
      const cachedAuthToken = this.#seedVaultAuthToken

      if (cachedAuthToken) {
        try {
          const result = await signMessageWithVault(cachedAuthToken, message, derivationPath)

          if (result.authToken) {
            await this.saveSeedVaultAuthToken(result.authToken)
          }

          return { signature: result.signature }
        } catch (error) {
          console.warn(
            '[SeekerWalletManager] Cached auth token failed for signing, will request new authorization:',
            error,
          )
          await this.clearSeedVaultAuthToken()
        }
      }

      const authToken = await this.getOrAuthorizeSeedToken()

      const result = await signMessageWithVault(authToken, message, derivationPath)

      const tokenToSave = result.authToken || authToken
      await this.saveSeedVaultAuthToken(tokenToSave)

      return { signature: result.signature }
    } catch (error) {
      console.error('[SeekerWalletManager] signMessage failed:', {
        derivationPath,
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new Error(
        `Failed to sign message with Seed Vault: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
    }
  }

  /**
   * Export authorization info (without sensitive data)
   * This can be sent to the web app for display purposes
   */
  public toJSON() {
    return {
      isAuthorized: this.isAuthorized,
      address: this.address,
      label: this.#authResult?.accounts[0]?.label ?? null,
    }
  }
}
