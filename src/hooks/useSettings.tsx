import { useAsyncStorage } from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'
import { singletonHook } from 'react-singleton-hook'

const useSettingsImpl = () => {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null)
  const { getItem, setItem, mergeItem } = useAsyncStorage('settings')

  useEffect(() => {
    if (!settings)
      getItem()
        .then(data => {
          if (!data) {
            setSettings({ EXPO_PUBLIC_SHAPESHIFT_URI: process.env.EXPO_PUBLIC_SHAPESHIFT_URI })
            return setItem(
              JSON.stringify({
                EXPO_PUBLIC_SHAPESHIFT_URI: process.env.EXPO_PUBLIC_SHAPESHIFT_URI,
              }),
            )
          }
          let parsed: Record<string, unknown> | null
          try {
            parsed = JSON.parse(data)
          } catch (e) {
            console.error('error parsing settings data: ', e)
            parsed = {}
          }
          setSettings({
            ...parsed,
            EXPO_PUBLIC_SHAPESHIFT_URI: process.env.EXPO_PUBLIC_SHAPESHIFT_URI,
          })
          return
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
