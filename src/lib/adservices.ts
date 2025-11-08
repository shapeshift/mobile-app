import { Alert, Platform } from 'react-native'
import Constants from 'expo-constants'
import { getAttributionToken as getAppleAdsToken, getCampaignData as getAppleCampaignData, type CampaignData } from '../../modules/expo-apple-ads/src'

export async function getAttributionToken(): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    return null
  }

  // Native modules are not available in Expo Go
  const isRunningInExpoGo = Constants.appOwnership === 'expo'
  if (isRunningInExpoGo) {
    return null
  }

  try {
    const token = await getAppleAdsToken()
    return token
  } catch (error) {
    console.error('Error getting Apple Ads attribution token:', error)
    return null
  }
}
