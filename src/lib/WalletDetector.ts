import { Linking, Platform } from 'react-native'

export interface WalletScheme {
  id: string
  name: string
  scheme: string
}

export interface DetectedWallet extends WalletScheme {
  isInstalled: boolean
}

// Wallet URL schemes for detection
export const WALLET_SCHEMES: WalletScheme[] = [
  { id: 'metamask', name: 'MetaMask', scheme: 'metamask' },
  { id: 'trust', name: 'Trust Wallet', scheme: 'trust' },
  { id: 'zerion', name: 'Zerion', scheme: 'zerion' },
  { id: 'rainbow', name: 'Rainbow', scheme: 'rainbow' },
  { id: 'ledgerlive', name: 'Ledger Live', scheme: 'ledgerlive' },
  { id: 'coinbase', name: 'Coinbase Wallet', scheme: 'cbwallet' },
  { id: 'phantom', name: 'Phantom', scheme: 'phantom' },
  { id: 'argent', name: 'Argent', scheme: 'argent' },
  { id: 'imtoken', name: 'imToken', scheme: 'imtoken' },
  { id: 'spot', name: 'Spot', scheme: 'spot' },
  { id: 'omni', name: 'Omni', scheme: 'omni' },
  { id: 'onto', name: 'ONTO', scheme: 'onto' },
  { id: 'safe', name: 'Safe', scheme: 'safe' },
  { id: 'tokenpocket', name: 'TokenPocket', scheme: 'tokenpocket' },
  { id: 'exodus', name: 'Exodus', scheme: 'exodus' },
]

/**
 * Detect if a single wallet is installed
 */
export const detectWallet = async (wallet: WalletScheme): Promise<DetectedWallet> => {
  const url = `${wallet.scheme}://`

  console.log(`[WalletDetector] 🔍 Checking: ${wallet.name} (${url})`)

  try {
    const canOpen = await Linking.canOpenURL(url)

    if (canOpen) {
      console.log(`[WalletDetector] ✅ ${wallet.name} IS INSTALLED!`)
    } else {
      console.log(`[WalletDetector] ❌ ${wallet.name} not installed`)
    }

    return {
      ...wallet,
      isInstalled: canOpen,
    }
  } catch (error) {
    console.error(`[WalletDetector] ⚠️ Error detecting ${wallet.name}:`, error)
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
  console.log('[WalletDetector] 🚀 Starting wallet detection...')
  console.log(`[WalletDetector] Platform: ${Platform.OS} ${Platform.Version}`)
  console.log(`[WalletDetector] Checking ${WALLET_SCHEMES.length} wallets...`)
  console.log('[WalletDetector] ─────────────────────────────────────')

  const startTime = Date.now()

  const detectionPromises = WALLET_SCHEMES.map(wallet => detectWallet(wallet))
  const results = await Promise.all(detectionPromises)

  const installedCount = results.filter(w => w.isInstalled).length
  const elapsedTime = Date.now() - startTime

  console.log('[WalletDetector] ─────────────────────────────────────')
  console.log(`[WalletDetector] 📊 Detection complete in ${elapsedTime}ms`)
  console.log(`[WalletDetector] Found ${installedCount}/${WALLET_SCHEMES.length} installed wallets`)

  if (installedCount > 0) {
    console.log('[WalletDetector] 📱 Installed wallets:')
    results
      .filter(w => w.isInstalled)
      .forEach(w => {
        console.log(`[WalletDetector]    ✓ ${w.name} (${w.id})`)
      })
  } else {
    console.log('[WalletDetector] 📱 No wallets detected')
    console.log('[WalletDetector] ℹ️  This is expected on simulator/emulator')
    console.log('[WalletDetector] ℹ️  Test on real device with wallets installed')
  }

  return results
}
