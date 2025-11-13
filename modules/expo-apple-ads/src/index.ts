import { requireNativeModule } from 'expo-modules-core'

const ExpoAppleAdsModule = requireNativeModule('ExpoAppleAds')

export async function getAttributionToken(): Promise<string | null> {
  try {
    const token = await ExpoAppleAdsModule.getAttributionToken()
    return token
  } catch (error) {
    console.error('Error getting attribution token:', error)
    return null
  }
}
