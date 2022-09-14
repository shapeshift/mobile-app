import { useAsyncStorage } from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
import { SHAPESHIFT_URI } from 'react-native-dotenv'

export const useSettings = () => {
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const { getItem, setItem, mergeItem } = useAsyncStorage('settings')

  useEffect(() => {
    getItem()
      .then(data => {
        if (!data) {
          setSettings({ SHAPESHIFT_URI })
          return setItem(JSON.stringify({ SHAPESHIFT_URI }))
        }
        setSettings(JSON.parse(data))
      })
      .catch(console.error)
  }, [getItem, setItem])

  return {
    settings,
    setSetting: async (name: string, value: unknown) => {
      try {
        await mergeItem(JSON.stringify({ [name]: value }))
        const storedSettings = await getItem()
        if (storedSettings) setSettings(JSON.parse(storedSettings))
      } catch (e) {
        console.error('[Settings] ', e)
      }
    },
  }
}
