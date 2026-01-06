import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import { Linking } from 'react-native'

const openBrowser = async (url: string) => {
  if (!(await Linking.canOpenURL(url))) {
    return
  }
  await Linking.openURL(url)
}

export const isValidUrl = (url: string) => {
  if (
    url.startsWith(process.env.EXPO_PUBLIC_SHAPESHIFT_URI) ||
    url.startsWith(process.env.EXPO_PUBLIC_SHAPESHIFT_PRIVATE_URI) ||
    url.startsWith(process.env.EXPO_PUBLIC_RELEASE_URI) ||
    url.startsWith(process.env.EXPO_PUBLIC_DEVELOP_URI) ||
    url.startsWith(process.env.EXPO_PUBLIC_YEET_URI) ||
    url.startsWith(process.env.EXPO_PUBLIC_BEARD_URI) ||
    url.startsWith(process.env.EXPO_PUBLIC_CAFE_URI) ||
    url.startsWith(process.env.EXPO_PUBLIC_GOME_URI) ||
    url.startsWith(process.env.EXPO_PUBLIC_JUICE_URI) ||
    url.startsWith(process.env.EXPO_PUBLIC_WOOD_URI) ||
    url.startsWith(process.env.EXPO_PUBLIC_NEO_URI) ||
    url.startsWith(process.env.EXPO_PUBLIC_CHATWOOT_URI) ||
    url.startsWith(process.env.EXPO_PUBLIC_WALLETCONNECT_VERIFY_SERVER) ||
    url.startsWith(process.env.EXPO_PUBLIC_WALLETCONNECT_VERIFY_FALLBACK_SERVER) ||
    url.startsWith(process.env.EXPO_PUBLIC_LOCAL_URI)
  ) {
    return true
  }

  return false
}

export const shouldLoadFilter = (request: ShouldStartLoadRequest) => {
  // Navigation within wrapped web app
  if (isValidUrl(request.url)) {
    return true
  }

  // Handle blob URLs - these are handled by injected JavaScript in download.ts
  // which intercepts URL.createObjectURL and sends file data via postMessage
  if (request.url.startsWith('blob:')) {
    return false
  }

  // External navigation
  openBrowser(request.url).catch(r => {
    console.error(`rejection opening in browser url "${request.url}": `, r)
  })
  return false
}
