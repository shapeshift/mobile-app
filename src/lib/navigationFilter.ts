import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import { Linking } from 'react-native'
import {
  SHAPESHIFT_URI,
  SHAPESHIFT_PRIVATE_URI,
  RELEASE_URI,
  DEVELOP_URI,
  CHATWOOT_URI,
  YEET_URI,
  BEARD_URI,
  CAFE_URI,
  GOME_URI,
  JUICE_URI,
  WOOD_URI,
  NEO_URI,
  WALLETCONNECT_VERIFY_SERVER,
  WALLETCONNECT_VERIFY_FALLBACK_SERVER,
} from 'react-native-dotenv'

const openBrowser = async (url: string) => {
  if (!(await Linking.canOpenURL(url))) {
    return
  }
  await Linking.openURL(url)
}

export const shouldLoadFilter = (request: ShouldStartLoadRequest) => {
  // Navigation within wrapped web app
  if (
    request.url.startsWith(SHAPESHIFT_URI) ||
    request.url.startsWith(SHAPESHIFT_PRIVATE_URI) ||
    request.url.startsWith(RELEASE_URI) ||
    request.url.startsWith(DEVELOP_URI) ||
    request.url.startsWith(YEET_URI) ||
    request.url.startsWith(BEARD_URI) ||
    request.url.startsWith(CAFE_URI) ||
    request.url.startsWith(GOME_URI) ||
    request.url.startsWith(JUICE_URI) ||
    request.url.startsWith(WOOD_URI) ||
    request.url.startsWith(NEO_URI) ||
    request.url.startsWith(CHATWOOT_URI) ||
    request.url.startsWith(WALLETCONNECT_VERIFY_SERVER) ||
    request.url.startsWith(WALLETCONNECT_VERIFY_FALLBACK_SERVER)
  ) {
    return true
  }

  // External navigation
  openBrowser(request.url).catch(r => {
    console.error(`rejection opening in browser url "${request.url}": `, r)
  })
  return false
}
