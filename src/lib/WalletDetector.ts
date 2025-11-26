import { Linking, Platform } from 'react-native'

export interface WalletScheme {
  name: string
  scheme: string
}

export interface DetectedWallet extends WalletScheme {
  isInstalled: boolean
}

// Wallet URL schemes for detection
export const WALLET_SCHEMES: WalletScheme[] = [
  { name: 'MetaMask', scheme: 'metamask' },
  { name: 'Trust Wallet', scheme: 'trust' },
  { name: 'Zerion', scheme: 'zerion' },
  { name: 'Rainbow', scheme: 'rainbow' },
  { name: 'Ledger Live', scheme: 'ledgerlive' },
  { name: 'Coinbase Wallet', scheme: 'cbwallet' },
  { name: 'Phantom', scheme: 'phantom' },
  { name: 'Argent', scheme: 'argent' },
  { name: 'imToken', scheme: 'imtoken' },
  { name: 'Spot', scheme: 'spot' },
  { name: 'Omni', scheme: 'omni' },
  { name: 'ONTO', scheme: 'onto' },
  { name: 'Safe', scheme: 'safe' },
  { name: 'TokenPocket', scheme: 'tokenpocket' },
  { name: 'Exodus', scheme: 'exodus' },
]

/**
 * Detect if a single wallet is installed
 */
export const detectWallet = async (wallet: WalletScheme): Promise<DetectedWallet> => {
  const url = `${wallet.scheme}://`

  try {
    const canOpen = await Linking.canOpenURL(url)
    return {
      ...wallet,
      isInstalled: canOpen,
    }
  } catch (error) {
    return {
      ...wallet,
      isInstalled: false,
    }
  }
}

/**
 * Detect all installed wallets
 */
export const detectInstalledWallets = async (): Promise<DetectedWallet[]> => {
  const detectionPromises = WALLET_SCHEMES.map(wallet => detectWallet(wallet))
  return await Promise.all(detectionPromises)
}
