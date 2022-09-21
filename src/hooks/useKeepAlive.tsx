import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import RNRestart from 'react-native-restart'
import { singletonHook } from 'react-singleton-hook'
import { getMessageManager } from '../lib/getMessageManager'

export const useKeepAliveImpl = () => {
  const [lastPong, setLastPong] = useState(Date.now())
  const [isAlerting, setIsAlerting] = useState(false)

  const messageManager = getMessageManager()
  messageManager.on('pong', evt => setLastPong(evt.id))

  useEffect(() => {
    const intervalPing = setInterval(() => {
      messageManager.postMessage({ id: Date.now(), cmd: 'ping' })
    }, 1000)

    // Check page status
    const intervalPong = setInterval(() => {
      if (isAlerting) return
      const ago = Date.now() - lastPong

      if (ago > 30000) {
        setIsAlerting(true)
        console.warn(
          isAlerting,
          `WebView is not responding to pings. Last ping: ${Math.round(ago / 1000)} seconds ago`,
        )

        messageManager.webviewRef?.reload()
      }
    }, 5000)

    return () => {
      clearInterval(intervalPing)
      clearInterval(intervalPong)
    }
    // No deps because we don't want to re-render the "setInterval"
  }, [isAlerting, lastPong, messageManager])
}

export const useKeepAlive = singletonHook(null, useKeepAliveImpl)
