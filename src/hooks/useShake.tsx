import { useEffect } from 'react'
import RNShake from 'react-native-shake'
import { singletonHook } from 'react-singleton-hook'
import { getMessageManager } from '../lib/getMessageManager'

const useShakeImpl = () => {
  const messageManager = getMessageManager()

  useEffect(() => {
    const subscription = RNShake.addListener(() => {
      console.debug('[useShake] Shake event detected')
      messageManager.postMessage({ cmd: 'shakeEvent' })
    })

    return () => subscription.remove()
  }, [messageManager])

  return RNShake
}

export const useShake = singletonHook(RNShake, useShakeImpl)
