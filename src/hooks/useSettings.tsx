import { useAsyncStorage } from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'
import { SHAPESHIFT_URI } from 'react-native-dotenv'
import { singletonHook } from 'react-singleton-hook'

const useSettingsImpl = () => {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null)
  const { getItem, setItem, mergeItem } = useAsyncStorage('settings')

  useEffect(() => {
    if (!settings)
      getItem()
        .then(data => {
          if (!data) {
            setSettings({ SHAPESHIFT_URI })
            return setItem(JSON.stringify({ SHAPESHIFT_URI }))
          }
          setSettings(JSON.parse(data))
        })
        .catch(console.error)
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
