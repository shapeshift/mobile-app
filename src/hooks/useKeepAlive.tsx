import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import RNRestart from 'react-native-restart'
import { getMessageManager } from '../lib/getMessageManager'

export const useKeepAlive = () => {
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
        // If we haven't gotten a pong in 1 minute, try to reload the page
        Alert.alert('Not Responding', 'ShapeShift is not responding', [
          {
            text: 'Cancel',
            style: 'cancel',
            // Don't ask again for 5 minutes
            onPress: () => (setIsAlerting(false), setLastPong(Date.now() + 300000)),
          },
          {
            text: 'Restart',
            style: 'destructive',
            onPress: () => RNRestart.Restart(),
          },
        ])
      }
    }, 5000)

    return () => {
      clearInterval(intervalPing)
      clearInterval(intervalPong)
    }
    // No deps because we don't want to re-render the "setInterval"
  }, [isAlerting, lastPong, messageManager])
}
