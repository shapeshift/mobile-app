/* Register message handlers and injected JavaScript */
import * as Clipboard from 'expo-clipboard'
import once from 'lodash.once'
import { injectedJavaScript as injectedJavaScriptClipboard } from './clipboard'

import { onConsole } from './console'
import { makeKey } from './crypto/crypto'
import { getWalletManager } from './getWalletManager'
import { EventData, MessageManager } from './MessageManager'

type EncryptedWalletInfo = {
  [k: string]: string
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
  messageManager.on('hashPassword', async evt => {
    const { email, password } = evt as EncryptedWalletInfo
    try {
      const key = await makeKey(password, email)
      return key.hashKeyB64
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

  // clipboard
  messageManager.on('setClipboard', evt => Clipboard.setStringAsync(evt.key))

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

  return messageManager
})
