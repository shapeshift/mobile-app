import { useRef } from 'react'
import { WebView } from 'react-native-webview'
import { singletonHook } from 'react-singleton-hook'

const useWebViewRefImpl = () => {
  return useRef<WebView>(null)
}

export const useWebViewRef = singletonHook(null, useWebViewRefImpl)
