import { requireNativeModule } from 'expo-modules-core'


export async function getAttributionToken(): Promise<string | null> {
  try {
    const ExpoAppleAdsModule = requireNativeModule('ExpoAppleAds')
    const token = await ExpoAppleAdsModule.getAttributionToken()
    return token
  } catch (error) {
    console.error('Error getting attribution token:', error)
    return null
  }
}
