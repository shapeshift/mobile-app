import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import { Linking } from 'react-native'
import { SHAPESHIFT_URI, DEVELOP_URI } from 'react-native-dotenv'

const openBrowser = async (url: string) => {
  if (!(await Linking.canOpenURL(url))) {
    return
  }
  await Linking.openURL(url)
}

export const shouldLoadFilter = (request: ShouldStartLoadRequest) => {
  // Navigation within wrapped web app
  if (request.url.startsWith(SHAPESHIFT_URI) || request.url.startsWith(DEVELOP_URI)) {
    return true
  }

  // External navigation
  openBrowser(request.url).catch(r => {
    console.error(`rejection opening in browser url "${request.url}": `, r)
  })
  return false
}
