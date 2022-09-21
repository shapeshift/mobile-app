import { useEffect } from 'react'
import { BackHandler } from 'react-native'
import { singletonHook } from 'react-singleton-hook'
import { useMessageManager } from './useMessageManager'

const useBackHandlerImpl = () => {
  const messageManager = useMessageManager()

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => (messageManager?.postMessage({ cmd: 'backButtonEvent' }), true),
    )

    return () => backHandler.remove()
  }, [messageManager])

  return BackHandler
}

export const useShake = singletonHook(BackHandler, useBackHandlerImpl)
