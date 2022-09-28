import Clipboard from '@react-native-clipboard/clipboard'
import { useEffect } from 'react'
import { singletonHook } from 'react-singleton-hook'
import { injectedJavaScript as injectedJavaScriptClipboard } from '../lib/clipboard'
import { injectedJavaScript, onConsole } from '../lib/console'
import { makeKey } from '../lib/crypto/crypto'
import { getMessageManager } from '../lib/getMessageManager'
import { getWalletManager } from '../lib/getWalletManager'
import { EventData } from '../lib/MessageManager'
import { useSettings } from './useSettings'
import { useWebViewRef } from './useWebViewRef'

type EncryptedWalletInfo = {
  [k: string]: string
}

const messageManager = getMessageManager()

const useMessageManagerImpl = () => {
  const { settings } = useSettings()
  const webviewRef = useWebViewRef()

  useEffect(() => {
    const enableLogging = settings?.LOGGING_WEBVIEW ?? true
    console.log('[injectJavascript]', enableLogging)

    if (enableLogging) {
      console.log('[App] Injecting console logging JavaScript')
      messageManager.registerInjectedJavaScript(injectedJavaScript)
    }

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
    messageManager.on('setClipboard', evt => Clipboard.setString(evt.key))
  }, [settings])

  useEffect(() => {
    if (webviewRef) messageManager.setWebViewRef(webviewRef)
  })

  return messageManager
}

export const useMessageManager = singletonHook(messageManager, useMessageManagerImpl)
