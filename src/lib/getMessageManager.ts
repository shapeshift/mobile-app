/* Register message handlers and injected JavaScript */
import once from 'lodash.once'
import { LOGGING_WEBVIEW } from 'react-native-dotenv'

import { injectedJavaScript, onConsole } from './console'
import { getWalletManager } from './getWalletManager'
import { EventData, MessageManager } from './MessageManager'
import Clipboard from '@react-native-clipboard/clipboard';

export const getMessageManager = once(() => {
  const messageManager = new MessageManager()
  const enableLogging = LOGGING_WEBVIEW !== 'false'

  if (enableLogging) {
    console.log('[App] Injecting console logging JavaScript')
    messageManager.registerInjectedJavaScript(injectedJavaScript)
  }

  const walletManager = getWalletManager()

  messageManager.on('console', onConsole)

  // wallet APIs
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

  // clipboard
  messageManager.on('setClipboard', evt => Clipboard.setString(evt.key));

  return messageManager
})
