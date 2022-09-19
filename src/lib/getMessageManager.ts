/* Register message handlers and injected JavaScript */
import once from 'lodash.once'
import { LOGGING_WEBVIEW } from 'react-native-dotenv'

import { injectedJavaScript, onConsole } from './console'
import { hashPassword, makeKey } from './crypto/crypto'
import { getWalletManager } from './getWalletManager'
import { EventData, MessageManager } from './MessageManager'

type EncryptedWalletInfo = {
  [k: string]: string
}

export const getMessageManager = once(() => {
  const messageManager = new MessageManager()
  const enableLogging = LOGGING_WEBVIEW !== 'false'

  if (enableLogging) {
    console.log('[App] Injecting console logging JavaScript')
    messageManager.registerInjectedJavaScript(injectedJavaScript)
  }

  const walletManager = getWalletManager()

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
  messageManager.on('hashPassword', async evt => {
    const { email, password } = evt as EncryptedWalletInfo
    try {
      const key = await makeKey(password, email)
      return hashPassword(password, key)
    } catch (e) {
      console.error('[hashPassword:Error]', e)
      return null
    }
  })
  messageManager.on('decryptWallet', evt => {
    const { email, password, encryptedWallet } = evt as EncryptedWalletInfo
    try {
      return walletManager.decryptWallet({ email, password, encryptedWallet })
    } catch (e) {
      console.error('[decryptWallet:Error]', e)
      return null
    }
  })

  return messageManager
})
