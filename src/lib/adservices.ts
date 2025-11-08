import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { getAttributionToken as getNativeAttributionToken } from 'react-native-attribution-token'

export async function getAttributionToken(): Promise<string | null> {
  // AdServices is only available on iOS 14.3+
  if (Platform.OS !== 'ios') {
    return null
  }

  // Native modules are not available in Expo Go
  const isRunningInExpoGo = Constants.appOwnership === 'expo'
  if (isRunningInExpoGo) {
    return null
  }

  try {
    const token = await getNativeAttributionToken()
    return token
  } catch (error) {
    console.error('Error getting Apple Ads attribution token:', error)
    return null
  }
}
