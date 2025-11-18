/* Register message handlers and injected JavaScript */
import * as Clipboard from 'expo-clipboard'
import once from 'lodash.once'
import { injectedJavaScript as injectedJavaScriptClipboard } from './clipboard'
import * as StoreReview from 'expo-store-review'
import * as Application from 'expo-application'

import { onConsole } from './console'
import { getWalletManager } from './getWalletManager'
import { EventData, MessageManager } from './MessageManager'
import * as Haptics from 'expo-haptics'
import Constants from 'expo-constants'
import { getCachedWalletDetection } from './WalletDetector'

import * as appJson from '../../app.json'

const isRunningInExpoGo = Constants.appOwnership === 'expo'

import { getExpoToken } from './notifications'

type HapticLevel = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid'

type HapticEvent = {
  level: HapticLevel
}

export const getMessageManager = once(() => {
  const messageManager = new MessageManager()

  console.log('[App] Injecting clipboard JavaScript')
  messageManager.registerInjectedJavaScript(injectedJavaScriptClipboard)

  const walletManager = getWalletManager()

  messageManager.on('console', onConsole)

  // wallet APIs
  messageManager.on('listWallets', () => walletManager.list())
  messageManager.on('hasWallets', () => walletManager.size > 0)
  messageManager.on('getWalletCount', () => walletManager.size)
  messageManager.on('deleteWallet', evt => walletManager.delete(evt.key))
  messageManager.on('getWallet', async evt => walletManager.getWalletWithMnemonic(evt.key))
  messageManager.on('hasWallet', evt => walletManager.has(evt.key))
  messageManager.on('updateWallet', (evt: EventData) =>
    walletManager.update(evt.key, { label: String(evt.label) }),
  )
  messageManager.on('addWallet', evt =>
    walletManager.add({
      label: String(evt.label),
      mnemonic: String(evt.mnemonic),
    }),
  )

  // clipboard
  messageManager.on('setClipboard', evt => Clipboard.setStringAsync(evt.key))

  // expo token for push notifications
  messageManager.on('getExpoToken', async () => {
    try {
      return await getExpoToken()
    } catch (error) {
      console.error('[App] Error getting Expo push token:', error)
      return null
    }
  })

  // haptics
  messageManager.on('vibrate', evt => {
    const { level } = evt as unknown as HapticEvent

    switch (level) {
      case 'light':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      case 'medium':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      case 'heavy':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      case 'soft':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
      case 'rigid':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
      default:
        console.warn('[haptics] Unknown or missing level:', level, '- defaulting to Medium')
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
  })

  messageManager.on('requestStoreReview', async () => {
    try {
      const available = await StoreReview.isAvailableAsync()
      const hasAction = await StoreReview.hasAction()

      if (!available) return false
      if (!hasAction) return false

      await StoreReview.requestReview()
      return true
    } catch (e) {
      console.error('[requestStoreReview:Error]', e)
      return false
    }
  })

  messageManager.on('getAppVersion', () => {
    return {
      version: isRunningInExpoGo ? appJson.version : Application.nativeApplicationVersion,
      buildNumber: isRunningInExpoGo
        ? undefined // not supported in expo go
        : Application.nativeBuildVersion,
    }
  })

  /**
   * this handler allows use to do the webview equivalent of window.location.reload()
   * without this, the web application is unable to reload the webview
   *
   * as of writing, this is used in the settings menu of web, with a "clear cache"
   * button that that blows away the redux persisted cache, then refreshes the page
   * to get to a good known state by calling this handler
   */
  messageManager.on('reloadWebview', () => {
    console.log('[App] Reloading webview')
    messageManager.webviewRef?.reload()
  })

  /**
   * Detect installed crypto wallet apps
   * Returns array of wallet IDs that are installed on the device
   */
  messageManager.on('detectWallets', async () => {
    console.log('[MessageManager] 📱 detectWallets handler called from web')
    try {
      const detectedWallets = await getCachedWalletDetection()
      const installedWalletIds = detectedWallets
        .filter(w => w.isInstalled)
        .map(w => w.id)

      console.log('[MessageManager] 📤 Returning detected wallet IDs:', installedWalletIds)
      return installedWalletIds
    } catch (error) {
      console.error('[MessageManager] ❌ Error in detectWallets handler:', error)
      return []
    }
  })

  return messageManager
})
