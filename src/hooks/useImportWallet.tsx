import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { deleteItemAsync, getItemAsync } from 'expo-secure-store'
import { useCallback, useEffect, useState } from 'react'
import { getMessageManager } from '../lib/getMessageManager'
import { getWalletManager } from '../lib/getWalletManager'
import memoize from 'lodash.memoize'
import { StoredWallet } from '../lib/Wallet'

/**
 * Send a message to the webview that the wallet was imported
 *
 * memoize it by deviceId to avoid accidentally sending multiple events
 */
const raiseImportEvent = memoize((deviceId: string) =>
  getMessageManager().postMessage({ id: Date.now(), cmd: 'walletImported', deviceId }),
)

const WALLET_KEY = 'wallet'

const fetchWallet = async () => {
  const data = await AsyncStorage.getItem(WALLET_KEY)
  return data ? JSON.parse(data) : null
}

const updateWallet = async (wallet: StoredWallet) => {
  await AsyncStorage.setItem(WALLET_KEY, JSON.stringify(wallet))
  return wallet
}

export const useImportWallet = () => {
  const queryClient = useQueryClient()

  const {
    data: wallet,
    isLoading,
    error,
  } = useQuery({
    queryKey: [WALLET_KEY],
    queryFn: fetchWallet,
  })

  const mutation = useMutation({
    mutationFn: async (wallet: StoredWallet) => updateWallet(wallet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WALLET_KEY] })
    },
  })

  const importWallet = (wallet: StoredWallet) => mutation.mutate(wallet)

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
            const gotWallet = await walletManager.getWalletWithMnemonic(newWallet.id, true)
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

  const startImport = useCallback(() => {
    setStarted(true)
  }, [])

  return { wallet, importWallet, isLoading, error, startImport }
}
