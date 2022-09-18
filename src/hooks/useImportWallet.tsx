import { deleteItemAsync, getItemAsync } from 'expo-secure-store'
import { useEffect, useState } from 'react'
import { singletonHook } from 'react-singleton-hook'
import { getMessageManager } from '../lib/getMessageManager'
import { getWalletManager } from '../lib/getWalletManager'
import memoize from 'lodash.memoize'

/**
 * Send a message to the webview that the wallet was imported
 *
 * memoize it by deviceId to avoid accidentally sending multiple events
 */
const raiseImportEvent = memoize((deviceId: string) =>
  getMessageManager().postMessage({ id: Date.now(), cmd: 'walletImported', deviceId }),
)

const initialState = Object.freeze({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  startImport: () => {},
})

export const useImportWalletImpl = () => {
  const [started, setStarted] = useState(false)
  const [status, setStatus] = useState<string | false | null>(null)

  useEffect(() => {
    if (!started) return

    console.debug('[useImportWallet] Checking for an existing wallet...')
    void (async () => {
      try {
        const prevWallet = await getItemAsync('mnemonic')
        // It's time to convert it to a new wallet
        if (prevWallet) {
          const walletManager = getWalletManager()
          const newWallet = await walletManager.add({
            label: 'Imported Wallet',
            mnemonic: prevWallet,
          })
          if (newWallet) {
            // We need to double-check that the mnemonic got imported correctly before deleting it
            const gotWallet = await walletManager.get(newWallet.id)
            if (gotWallet?.mnemonic === prevWallet) {
              console.info('\x1b[7m [useImportWallet] Imported a wallet \x1b[0m')
              await deleteItemAsync('mnemonic')
              return setStatus(gotWallet.id)
            }
          }
        }

        setStatus(false)
      } catch (e) {
        console.error('[useImportWallet] Error', e)
      }
    })()
  }, [started])

  useEffect(() => {
    if (typeof status === 'string') {
      raiseImportEvent(status)
    }
  }, [status])

  return {
    startImport: () => setStarted(true),
  }
}

export const useImportWallet = singletonHook(initialState, useImportWalletImpl)
