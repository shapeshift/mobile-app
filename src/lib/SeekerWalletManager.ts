import { PublicKey, VersionedTransaction } from '@solana/web3.js'

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

export class SeekerWalletManager {
  #authResult: SeekerAuthorizationResult | null = null
  #isAvailable: boolean | null = null

  public readonly [Symbol.toStringTag]: string = 'SeekerWalletManager'

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
      console.info('[SeekerWalletManager] MWA not available:', e)
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
  public async authorize(cluster: MwaCluster = DEFAULT_CLUSTER): Promise<SeekerAuthorizationResult> {
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
    console.info('[SeekerWalletManager] Authorized with address:', result.accounts[0]?.address)
    return result
  }

  /**
   * Reauthorize using cached auth token
   * Faster than full authorization if token is still valid
   */
  public async reauthorize(cluster: MwaCluster = DEFAULT_CLUSTER): Promise<SeekerAuthorizationResult | null> {
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
   * Get a public key for a custom derivation path from Seed Vault
   * This is used for multi-chain support (e.g., NEAR uses m/44'/397'/0')
   *
   * @param derivationPath BIP32 URI format (e.g., "bip32:/m/44'/397'/0'")
   * @returns Base58-encoded public key
   */
  public async getPublicKey(derivationPath: string): Promise<string> {
    if (!this.isAuthorized) {
      throw new Error('Not authorized with Seeker wallet')
    }

    const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol-web3js')

    const publicKey = await transact(async wallet => {
      // Reauthorize within the transaction session
      await wallet.authorize({
        identity: APP_IDENTITY,
        auth_token: this.#authResult!.authToken,
      })

      // Request public key for custom derivation path from Seed Vault
      // Note: This requires the Seed Vault SDK extension
      // @ts-expect-error - requestPublicKey is not in standard MWA types but is supported by Seed Vault
      const result = await wallet.requestPublicKey({
        derivation_path: derivationPath,
      })

      // Convert the public key bytes to base58
      const publicKeyBytes = new Uint8Array(Buffer.from(result.public_key, 'base64'))
      const base58PublicKey = new PublicKey(publicKeyBytes).toBase58()

      return base58PublicKey
    })

    return publicKey
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
