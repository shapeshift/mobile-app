import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import { Linking } from 'react-native'

const openBrowser = async (url: string) => {
  if (!(await Linking.canOpenURL(url))) {
    return
  }
  await Linking.openURL(url)
}

export const shouldLoadFilter = (request: ShouldStartLoadRequest) => {
  // Navigation within wrapped web app
  if (
    request.url.startsWith(process.env.EXPO_PUBLIC_SHAPESHIFT_URI) ||
    request.url.startsWith(process.env.EXPO_PUBLIC_SHAPESHIFT_PRIVATE_URI) ||
    request.url.startsWith(process.env.EXPO_PUBLIC_RELEASE_URI) ||
    request.url.startsWith(process.env.EXPO_PUBLIC_DEVELOP_URI) ||
    request.url.startsWith(process.env.EXPO_PUBLIC_YEET_URI) ||
    request.url.startsWith(process.env.EXPO_PUBLIC_BEARD_URI) ||
    request.url.startsWith(process.env.EXPO_PUBLIC_CAFE_URI) ||
    request.url.startsWith(process.env.EXPO_PUBLIC_GOME_URI) ||
    request.url.startsWith(process.env.EXPO_PUBLIC_JUICE_URI) ||
    request.url.startsWith(process.env.EXPO_PUBLIC_WOOD_URI) ||
    request.url.startsWith(process.env.EXPO_PUBLIC_NEO_URI) ||
    request.url.startsWith(process.env.EXPO_PUBLIC_CHATWOOT_URI) ||
    request.url.startsWith(process.env.EXPO_PUBLIC_WALLETCONNECT_VERIFY_SERVER) ||
    request.url.startsWith(process.env.EXPO_PUBLIC_WALLETCONNECT_VERIFY_FALLBACK_SERVER) ||
    request.url.startsWith(process.env.EXPO_PUBLIC_LOCAL_URI)
  ) {
    return true
  }

  // External navigation
  openBrowser(request.url).catch(r => {
    console.error(`rejection opening in browser url "${request.url}": `, r)
  })
  return false
}
