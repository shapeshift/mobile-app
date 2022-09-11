import { WalletManager } from './WalletManager'
import once from 'lodash.once'

export const getWalletManager = once(() => {
  const walletManager = new WalletManager()
  walletManager
    .initialize()
    .catch(e =>
      console.error('[WalletManager.initialize] Error loading wallet index from storage', e),
    )
  return walletManager
})
