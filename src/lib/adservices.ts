import { Alert, Platform } from 'react-native'
import Constants from 'expo-constants'
import { getAttributionToken as getAppleAdsToken, getCampaignData as getAppleCampaignData, type CampaignData } from '../../modules/expo-apple-ads/src'

export async function getAttributionToken(): Promise<string | null> {
  // AdServices is only available on iOS 14.3+
  if (Platform.OS !== 'ios') {
    console.log('Not on iOS')
    return null
  }

  // Native modules are not available in Expo Go
  const isRunningInExpoGo = Constants.appOwnership === 'expo'
  if (isRunningInExpoGo) {
    console.log('Not running in development build')
    return null
  }

  try {
    const token = await getAppleAdsToken()
    Alert.alert(JSON.stringify({token}))
    return token
  } catch (error) {
    console.error('Error getting Apple Ads attribution token:', error)
    return null
  }
}
