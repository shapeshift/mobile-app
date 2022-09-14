/* Register message handlers and injected JavaScript */
import { LOGGING_WEBVIEW } from 'react-native-dotenv'
import { injectedJavaScript, onConsole } from './console'
import { getWalletManager } from './getWalletManager'
import { EventData, MessageManager } from './MessageManager'
import once from 'lodash.once'

let lastPong = Date.now()

export const getMessageManager = once(() => {
  const messageManager = new MessageManager()
  const enableLogging = LOGGING_WEBVIEW !== 'false'

  if (enableLogging) {
    console.log('[App] Injecting console logging JavaScript')
    messageManager.registerInjectedJavaScript(injectedJavaScript)
  }

  // Check page status
  setInterval(() => {
    const ago = Date.now() - lastPong
    if (ago > 60000) {
      console.warn(
        `WebView is not responding to pings. Last ping: ${Math.round(ago / 1000)} seconds ago`,
      )
      // If we haven't gotten a pong in 1 minute, try to reload the page
      lastPong = Date.now() // Wait another minute before we reload again
      messageManager.webviewRef?.reload()
    }
  }, 5000)

  const walletManager = getWalletManager()

  messageManager.on('pong', evt => void (lastPong = evt.id))
  messageManager.on('console', onConsole)
  messageManager.on('listWallets', () => walletManager.list())
  messageManager.on('hasWallets', () => walletManager.size > 0)
  messageManager.on('getWalletCount', () => walletManager.size)
  messageManager.on('deleteWallet', evt => walletManager.delete(evt.key))
  messageManager.on('getWallet', async evt => walletManager.get(evt.key))
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

  return messageManager
})
