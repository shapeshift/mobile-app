import { useEffect, useState } from 'react'
import { getMessageManager } from '../lib/getMessageManager'
import { getSeekerWalletManager } from '../lib/getSeekerWalletManager'

/**
 * Hook to handle Seeker wallet communication with the WebView
 *
 * Sets up message handlers for:
 * - seekerCheckAvailability: Check if Seeker/MWA is available
 * - seekerAuthorize: Request authorization from Seeker wallet
 * - seekerDeauthorize: Revoke authorization
 * - seekerGetAddress: Get the authorized Solana address
 * - seekerSignTransaction: Sign a transaction via Seeker
 * - seekerSignAndSendTransaction: Sign and send a transaction via Seeker
 * - seekerGetPublicKey: Get public key for custom derivation path (multi-chain support)
 */
export const useSeekerWallet = () => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const messageManager = getMessageManager()
  const seekerManager = getSeekerWalletManager()

  useEffect(() => {
    // Check availability on mount
    void seekerManager.checkAvailability().then(available => {
      setIsAvailable(available)
      console.info('[useSeekerWallet] Seeker availability:', available)
    })
  }, [seekerManager])

  useEffect(() => {
    /**
     * Check if Seeker/MWA wallet is available on this device
     */
    messageManager.on('seekerCheckAvailability', async () => {
      const available = await seekerManager.checkAvailability()
      setIsAvailable(available)
      return { available }
    })

    /**
     * Request authorization from Seeker wallet
     * This will open the Seeker wallet UI for user approval
     */
    messageManager.on('seekerAuthorize', async evt => {
      try {
        const cluster = (evt.cluster as 'mainnet-beta' | 'devnet' | 'testnet') ?? 'mainnet-beta'
        const result = await seekerManager.authorize(cluster)
        setIsAuthorized(true)
        return {
          success: true,
          address: result.accounts[0]?.address,
          label: result.accounts[0]?.label,
        }
      } catch (e) {
        console.error('[useSeekerWallet] Authorization failed:', e)
        return {
          success: false,
          error: e instanceof Error ? e.message : 'Authorization failed',
        }
      }
    })

    /**
     * Deauthorize from Seeker wallet
     */
    messageManager.on('seekerDeauthorize', async () => {
      try {
        await seekerManager.deauthorize()
        setIsAuthorized(false)
        return { success: true }
      } catch (e) {
        console.error('[useSeekerWallet] Deauthorization failed:', e)
        return {
          success: false,
          error: e instanceof Error ? e.message : 'Deauthorization failed',
        }
      }
    })

    /**
     * Get the authorized Solana address
     */
    messageManager.on('seekerGetAddress', () => {
      const address = seekerManager.getAddress()
      return { address }
    })

    /**
     * Get the current Seeker wallet status
     */
    messageManager.on('seekerGetStatus', async () => {
      const available = await seekerManager.checkAvailability()
      return {
        available,
        isAuthorized: seekerManager.isAuthorized,
        address: seekerManager.address,
      }
    })

    /**
     * Sign a transaction via Seeker wallet
     * Expects: { transaction: string } where transaction is base64 encoded
     * Returns: { signedTransaction: string } where signedTransaction is base64 encoded
     */
    messageManager.on('seekerSignTransaction', async evt => {
      try {
        const transaction = evt.transaction as string
        if (!transaction) {
          return { success: false, error: 'Transaction is required' }
        }

        const signedTransaction = await seekerManager.signTransaction(transaction)
        return { success: true, signedTransaction }
      } catch (e) {
        console.error('[useSeekerWallet] Sign transaction failed:', e)
        return {
          success: false,
          error: e instanceof Error ? e.message : 'Sign transaction failed',
        }
      }
    })

    /**
     * Sign and send a transaction via Seeker wallet
     * Expects: { transaction: string } where transaction is base64 encoded
     * Returns: { signature: string } - the transaction signature
     */
    messageManager.on('seekerSignAndSendTransaction', async evt => {
      try {
        const transaction = evt.transaction as string
        if (!transaction) {
          return { success: false, error: 'Transaction is required' }
        }

        const signature = await seekerManager.signAndSendTransaction(transaction)
        return { success: true, signature }
      } catch (e) {
        console.error('[useSeekerWallet] Sign and send transaction failed:', e)
        return {
          success: false,
          error: e instanceof Error ? e.message : 'Sign and send transaction failed',
        }
      }
    })

    /**
     * Get a public key for a custom derivation path from Seed Vault
     * This enables multi-chain support (e.g., NEAR uses m/44'/397'/0')
     * Expects: { derivationPath: string } in BIP32 URI format
     * Returns: { publicKey: string } - base58-encoded public key
     */
    messageManager.on('seekerGetPublicKey', async evt => {
      try {
        const derivationPath = evt.derivationPath as string
        if (!derivationPath) {
          return { success: false, error: 'Derivation path is required' }
        }

        const publicKey = await seekerManager.getPublicKey(derivationPath)
        return { publicKey }
      } catch (e) {
        console.error('[useSeekerWallet] Get public key failed:', e)
        return {
          success: false,
          error: e instanceof Error ? e.message : 'Get public key failed',
        }
      }
    })
  }, [messageManager, seekerManager])

  return {
    isAvailable,
    isAuthorized,
  }
}
