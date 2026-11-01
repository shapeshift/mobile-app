import { URL } from 'react-native-url-polyfill'
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import { Linking } from 'react-native'

export const getTrustedOrigin = (value: string | undefined): string | undefined => {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.username || url.password) return undefined
    if (
      url.protocol !== 'https:' &&
      !(__DEV__ && url.protocol === 'http:' && url.hostname === 'localhost')
    )
      return undefined
    if (url.protocol === 'https:' && url.port) return undefined
    return url.origin
  } catch {
    return undefined
  }
}

export const isValidUrl = (value: string): boolean => {
  const origin = getTrustedOrigin(value)
  if (!origin) return false
  const allowed = [process.env.EXPO_PUBLIC_SHAPESHIFT_URI]
  if (__DEV__)
    allowed.push(
      process.env.EXPO_PUBLIC_SHAPESHIFT_PRIVATE_URI,
      process.env.EXPO_PUBLIC_RELEASE_URI,
      process.env.EXPO_PUBLIC_DEVELOP_URI,
      process.env.EXPO_PUBLIC_YEET_URI,
      process.env.EXPO_PUBLIC_BEARD_URI,
      process.env.EXPO_PUBLIC_CAFE_URI,
      process.env.EXPO_PUBLIC_GOME_URI,
      process.env.EXPO_PUBLIC_JUICE_URI,
      process.env.EXPO_PUBLIC_WOOD_URI,
      process.env.EXPO_PUBLIC_NEO_URI,
      process.env.EXPO_PUBLIC_LOCAL_URI,
    )
  return allowed.some(url => getTrustedOrigin(url) === origin)
}

export const shouldLoadFilter = (request: ShouldStartLoadRequest, appUrl?: string): boolean => {
  if (isValidUrl(request.url) && getTrustedOrigin(request.url) === getTrustedOrigin(appUrl))
    return true
  if (request.isTopFrame === false) return false
  try {
    const url = new URL(request.url)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return false
    Linking.openURL(request.url).catch(error => console.error('Unable to open external URL', error))
  } catch {
    return false
  }
  return false
}
