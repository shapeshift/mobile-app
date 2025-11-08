import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { getAttributionToken as getNativeAttributionToken } from 'react-native-attribution-token'

export async function getAttributionToken(): Promise<string | null> {
  // AdServices is only available on iOS 14.3+
  if (Platform.OS !== 'ios') {
    console.log('Not on iOS')
    return null
  }

  // Native modules are not available in Expo Go
  const isRunningInExpoGo = Constants.appOwnership === 'expo'
  if (isRunningInExpoGo) {
    console.log('in expo go')
    return null
  }

  try {
    const token = await getNativeAttributionToken()
    return token
  } catch (error: any) {
    // This is expected if:
    // - Running in simulator
    // - App wasn't installed from an ad campaign
    // - User hasn't clicked an Apple Search Ad
    if (error?.code === 'ERROR_FETCHING_TOKEN') {
      console.log('No attribution token available (expected if not installed via ad)')
      return null
    }
    console.error('Error getting Apple Ads attribution token:', error)
    return null
  }
}
