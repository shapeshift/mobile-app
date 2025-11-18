import { Linking, Platform } from 'react-native'

export interface WalletScheme {
  id: string
  name: string
  scheme: string
  androidPackage?: string
}

export interface DetectedWallet {
  id: string
  name: string
  scheme: string
  isInstalled: boolean
  androidPackage?: string
}

// Wallet schemes for iOS and Android package names
// Based on WalletConnect Explorer and common wallet deep link formats
export const WALLET_SCHEMES: WalletScheme[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    scheme: 'metamask',
    androidPackage: 'io.metamask',
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    scheme: 'trust',
    androidPackage: 'com.wallet.crypto.trustapp',
  },
  {
    id: 'zerion',
    name: 'Zerion',
    scheme: 'zerion',
    androidPackage: 'io.zerion.android',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    scheme: 'rainbow',
    androidPackage: 'me.rainbow',
  },
  {
    id: 'ledgerlive',
    name: 'Ledger Live',
    scheme: 'ledgerlive',
    androidPackage: 'com.ledger.live',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    scheme: 'cbwallet',
    androidPackage: 'org.toshi',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    scheme: 'phantom',
    androidPackage: 'app.phantom',
  },
  {
    id: 'argent',
    name: 'Argent',
    scheme: 'argent',
    androidPackage: 'im.argent.contractwalletclient',
  },
  {
    id: 'imtoken',
    name: 'imToken',
    scheme: 'imtoken',
    androidPackage: 'im.token.app',
  },
  {
    id: 'spot',
    name: 'Spot',
    scheme: 'spot',
  },
  {
    id: 'omni',
    name: 'Omni',
    scheme: 'omni',
  },
  {
    id: 'onto',
    name: 'ONTO',
    scheme: 'onto',
    androidPackage: 'com.github.ontio.onto',
  },
  {
    id: 'safe',
    name: 'Safe',
    scheme: 'safe',
  },
  {
    id: 'tokenpocket',
    name: 'TokenPocket',
    scheme: 'tokenpocket',
    androidPackage: 'vip.mytokenpocket',
  },
  {
    id: 'exodus',
    name: 'Exodus',
    scheme: 'exodus',
    androidPackage: 'exodusmovement.exodus',
  },
]

/**
 * Detect if a single wallet is installed
 */
export const detectWallet = async (wallet: WalletScheme): Promise<DetectedWallet> => {
  const url = `${wallet.scheme}://`

  console.log(`[WalletDetector] 🔍 Checking wallet: ${wallet.name}`)
  console.log(`[WalletDetector]    - ID: ${wallet.id}`)
  console.log(`[WalletDetector]    - URL scheme: ${url}`)
  console.log(`[WalletDetector]    - Platform: ${Platform.OS}`)

  if (wallet.androidPackage) {
    console.log(`[WalletDetector]    - Android package: ${wallet.androidPackage}`)
  }

  try {
    const canOpen = await Linking.canOpenURL(url)

    if (canOpen) {
      console.log(`[WalletDetector] ✅ ${wallet.name} IS INSTALLED!`)
    } else {
      console.log(`[WalletDetector] ❌ ${wallet.name} is not installed`)
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

// Cache for wallet detection results
let cachedDetection: DetectedWallet[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 30000 // 30 seconds

/**
 * Get cached wallet detection or perform new detection
 */
export const getCachedWalletDetection = async (): Promise<DetectedWallet[]> => {
  const now = Date.now()

  if (cachedDetection && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('[WalletDetector] 💾 Using cached detection results')
    console.log(`[WalletDetector] Cache age: ${Math.round((now - cacheTimestamp) / 1000)}s`)
    return cachedDetection
  }

  console.log('[WalletDetector] 🔄 Cache expired or empty, performing fresh detection')
  cachedDetection = await detectInstalledWallets()
  cacheTimestamp = now

  return cachedDetection
}

/**
 * Clear the detection cache
 */
export const clearDetectionCache = () => {
  console.log('[WalletDetector] 🗑️  Clearing detection cache')
  cachedDetection = null
  cacheTimestamp = 0
}
