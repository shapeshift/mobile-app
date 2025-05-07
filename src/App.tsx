import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, Linking, View } from 'react-native'
import ErrorBoundary from 'react-native-error-boundary'
import { WebView } from 'react-native-webview'
import { DeveloperModeModal } from './components/DeveloperModeModal'
import ErrorPage from './components/ErrorPage'
import { useImportWallet } from './hooks/useImportWallet'
import { useKeepAlive } from './hooks/useKeepAlive'
import { useSettings } from './hooks/useSettings'
import { getMessageManager } from './lib/getMessageManager'
import { shouldLoadFilter } from './lib/navigationFilter'
import { styles } from './styles'
import Constants from 'expo-constants'

const isRunningInExpoGo = Constants.appOwnership === 'expo'

import { LogBox } from 'react-native'

// disable bottom toast in app simulators - read the console instead
LogBox.ignoreAllLogs()

const App = () => {
  const { settings, setSetting } = useSettings()
  const [uri, setUri] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isDebugModalVisible, setIsDebugModalVisible] = useState(false)
  const webviewRef = useRef<WebView>(null)
  const messageManager = getMessageManager()
  messageManager.setWebViewRef(webviewRef)

  useKeepAlive()
  const { startImport } = useImportWallet()

  useEffect(() => {
    messageManager.on('showDeveloperModal', evt => setIsDebugModalVisible(Boolean(evt.key)))
  }, [messageManager])

  // https://reactnative.dev/docs/linking?syntax=android#handling-deep-links
  useEffect(() => {
    if (!settings) return

    // shared link handler
    const deepLinkHandler = ({ url }: { url: string }) => {
      // if no url, return but if we are using some deep linking, parse the url
      // and update the webview uri to redirect the correct web page
      if (!url) return

      // Expo Go uses exp://, so we need to handle it differently
      const URL_DELIMITER = isRunningInExpoGo ? 'exp://' : 'shapeshift://'

      const path = url.split(URL_DELIMITER)[1]

      /**
       * ?Date.now() tricks the webview into navigating to a different url.
       * without it, the urls are the same, even if the webview has routed
       * to some other page within the webview.
       */
      const newUri = `${settings?.EXPO_PUBLIC_SHAPESHIFT_URI}/#/${path}?${Date.now()}`
      console.log('newUri', newUri, URL_DELIMITER, url)
      setUri(newUri)
    }

    // case where the app is backgrounded/not yet opened
    Linking.getInitialURL().then(url => url && deepLinkHandler({ url }))

    // case where the app is foregrounded/currently open
    Linking.addEventListener('url', deepLinkHandler)
  }, [settings, webviewRef])

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => (webviewRef.current?.goBack(), true),
    )

    return () => backHandler.remove()
  }, [])

  useEffect(() => {
    if (!loading) {
      startImport()
    }
  }, [startImport, loading])

  const defaultUrl = useMemo(() => {
    if (!settings) return
    return `${settings.EXPO_PUBLIC_SHAPESHIFT_URI}`
  }, [settings])

  useEffect(() => {
    if (!defaultUrl) return
    setUri(defaultUrl)
  }, [defaultUrl])

  if (!settings?.EXPO_PUBLIC_SHAPESHIFT_URI)
    return (
      <View style={styles.container}>
        <ActivityIndicator color='#FFFFFF' size='large' />
      </View>
    )
  if (!uri)
    return (
      <View style={styles.container}>
        <ActivityIndicator color='#FFFFFF' size='large' />
      </View>
    )

  return (
    <View style={styles.container}>
      <DeveloperModeModal
        visible={isDebugModalVisible}
        onClose={() => setIsDebugModalVisible(false)}
        onSelect={url => setSetting('EXPO_PUBLIC_SHAPESHIFT_URI', url)}
      />
      {error ? (
        <ErrorPage onTryAgain={() => setError(false)} />
      ) : (
        <ErrorBoundary
          onError={(e: Error) => {
            console.error(`ErrorBoundary onError: `, e)
            if (!isDebugModalVisible) setError(true)
          }}
        >
          <WebView
            ref={webviewRef}
            // Hide the webview until the page is loaded
            style={loading ? styles.containerLoading : styles.container}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            pullToRefreshEnabled
            decelerationRate={0.998}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            scalesPageToFit
            originWhitelist={['*']}
            renderLoading={() => (
              <ActivityIndicator color='#FFFFFF' size='large' style={styles.container} />
            )}
            injectedJavaScriptBeforeContentLoaded={messageManager.injectedJavaScript}
            onMessage={msg => messageManager.handleMessage(msg)}
            onNavigationStateChange={e => {
              console.debug('\x1b[7m onNavigationStateChange', e, '\x1b[0m')

              if (loading) setLoading(e.loading)
            }}
            onContentProcessDidTerminate={() => {
              setUri(defaultUrl)
              webviewRef.current?.reload()
            }}
            onShouldStartLoadWithRequest={shouldLoadFilter}
            source={{ uri }}
            onError={syntheticEvent => {
              const { nativeEvent } = syntheticEvent
              console.error('WebView onError: ', nativeEvent)
              syntheticEvent.preventDefault()
              setError(true)
            }}
          />
        </ErrorBoundary>
      )}
    </View>
  )
}

export default App
