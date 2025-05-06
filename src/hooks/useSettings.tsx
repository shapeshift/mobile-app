import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { isValidUrl, shouldLoadFilter } from '../lib/navigationFilter'

const SETTINGS_KEY = 'settings'

const fetchSettings = async () => {
  const data = await AsyncStorage.getItem(SETTINGS_KEY)
  if (data) {
    const parsed = JSON.parse(data)

    if (parsed.EXPO_PUBLIC_SHAPESHIFT_URI && isValidUrl(parsed.EXPO_PUBLIC_SHAPESHIFT_URI)) {
      try {
        return JSON.parse(data)
      } catch (e) {
        console.error('error parsing settings data: ', e)
        return {}
      }
    }

    const initial = { EXPO_PUBLIC_SHAPESHIFT_URI: process.env.EXPO_PUBLIC_SHAPESHIFT_URI }
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(initial))
    return initial
  }

  if (!data) {
    const initial = { EXPO_PUBLIC_SHAPESHIFT_URI: process.env.EXPO_PUBLIC_SHAPESHIFT_URI }
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(initial))
    return initial
  }
}

const updateSettings = async (newSettings: Record<string, unknown>) => {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
  return newSettings
}

export const useSettings = () => {
  const queryClient = useQueryClient()

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: [SETTINGS_KEY],
    queryFn: fetchSettings,
  })

  const mutation = useMutation({
    mutationFn: async ({ name, value }: { name: string; value: unknown }) => {
      const current = (await fetchSettings()) || {}
      const updated = { ...current, [name]: value }
      return updateSettings(updated)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] })
    },
  })

  const setSetting = (name: string, value: unknown) => mutation.mutate({ name, value })

  return { settings, setSetting, isLoading, error }
}
