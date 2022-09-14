import { useEffect } from 'react'
import { getMessageManager } from '../lib/getMessageManager'

export const useKeepAlive = () => {
  const messageManager = getMessageManager()

  useEffect(() => {
    const interval = setInterval(() => {
      messageManager.postMessage({ id: Date.now(), cmd: 'ping' })
    }, 10000)

    return () => clearInterval(interval)
  }, [messageManager])
}
