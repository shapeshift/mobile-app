import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { getAttributionToken as getAppleAdsToken } from '../../modules/expo-apple-ads/src'

export async function getAttributionToken(): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    return null
  }

  // Native modules are not available in Expo Go
  const isRunningInExpoGo = Constants.appOwnership === 'expo'
  if (isRunningInExpoGo) {
    return null
  }

  const token = await getAppleAdsToken()
  return token
}

export async function getAppleAttributionData(
  token: string,
): Promise<AppleSearchAdsAttributionData | null> {
  if (!token) throw new Error('No Apple Search Ads attribution token provided')

  try {
    const response = await fetch('https://api-adservices.apple.com/api/v1/', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: token,
    })

    if (!response.ok) {
      throw new Error(
        `Failed to exchange Apple Search Ads token: ${response.status} ${response.statusText}`,
      )
    }

    const data = await response.json()
    return data as AppleSearchAdsAttributionData
  } catch (error) {
    throw new Error(`Failed to exchange Apple Search Ads token: ${error}`)
  }
}

export type AppleSearchAdsAttributionData = {
  attribution?: boolean
  orgId?: number
  campaignId?: number
  conversionType?: 'Download' | 'Redownload'
  clickDate?: string
  adGroupId?: number
  countryOrRegion?: string
  keywordId?: number
  adId?: number
  claimType?: 'Click' | 'View'
}
