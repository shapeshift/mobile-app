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
  if (request.url.startsWith('https://app.shapeshift.com')) {
    return true
  }
  // External navigation
  openBrowser(request.url).catch(r => {
    console.error(`rejection opening in browser url "${request.url}": `, r)
  })
  return false
}
