import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import { Linking } from 'react-native'
import {
  SHAPESHIFT_URI,
  SHAPESHIFT_PRIVATE_URI,
  SHAPESHIFT_SANDBOX_URI,
  RELEASE_URI,
  DEVELOP_URI,
  CHATWOOT_URI,
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
    request.url.startsWith(DEVELOP_URI) ||
    request.url.startsWith(RELEASE_URI) ||
    request.url.startsWith(SHAPESHIFT_PRIVATE_URI) ||
    request.url.startsWith(SHAPESHIFT_SANDBOX_URI) ||
    request.url.startsWith(CHATWOOT_URI)
  ) {
    return true
  }

  // External navigation
  openBrowser(request.url).catch(r => {
    console.error(`rejection opening in browser url "${request.url}": `, r)
  })
  return false
}
