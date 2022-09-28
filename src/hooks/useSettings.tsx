import { useAsyncStorage } from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'
import { LOGGING_WEBVIEW, SHAPESHIFT_URI } from 'react-native-dotenv'
import { singletonHook } from 'react-singleton-hook'

export interface Settings {
  SHAPESHIFT_URI: string
  LOGGING_WEBVIEW: boolean
  KEEP_ALIVE: number
  [k: string]: unknown
}

const useSettingsImpl = () => {
  const [settings, setSettings] = useState<Settings | null>(null)
  const { getItem, setItem, mergeItem } = useAsyncStorage('settings')

  useEffect(() => {
    if (!settings) {
      const defaultSettings = {
        SHAPESHIFT_URI,
        LOGGING_WEBVIEW: LOGGING_WEBVIEW !== 'false',
        KEEP_ALIVE: 30000,
      }

      getItem()
        .then(data => {
          if (!data) {
            setSettings(defaultSettings)
            return setItem(JSON.stringify(defaultSettings))
          }
          const newSettings = { ...defaultSettings, ...JSON.parse(data) }
          console.debug('[useSettings.get]', newSettings)
          setSettings(newSettings)
        })
        .catch(console.error)
    }
  }, [settings, getItem, setItem])

  const setSetting = useCallback(
    async (name: string, value: unknown) => {
      try {
        await mergeItem(JSON.stringify({ [name]: value }))
        const storedSettings = await getItem()
        if (storedSettings) setSettings(JSON.parse(storedSettings))
      } catch (e) {
        console.error('[Settings] ', e)
      }
    },
    [getItem, mergeItem],
  )

  return {
    settings,
    setSetting,
  }
}

export const useSettings = singletonHook(
  {
    settings: null,
    setSetting: (_name: string, _value: unknown) => Promise.resolve(),
  },
  useSettingsImpl,
)
