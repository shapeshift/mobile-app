import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, Linking, View } from 'react-native'
import ErrorBoundary from 'react-native-error-boundary'
import RNShake from 'react-native-shake'
import { WebView } from 'react-native-webview'
import { DeveloperModeModal } from './components/DeveloperModeModal'
import ErrorPage from './components/ErrorPage'
import { useImportWallet } from './hooks/useImportWallet'
import { useKeepAlive } from './hooks/useKeepAlive'
import { useSettings } from './hooks/useSettings'
import { getMessageManager } from './lib/getMessageManager'
import { shouldLoadFilter } from './lib/navigationFilter'
import { styles } from './styles'

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

  useEffect(() => {
    const subscription = RNShake.addListener(() => {
      messageManager.postMessage({ cmd: 'shakeEvent' })
    })

    return () => {
      subscription.remove()
    }
  }, [messageManager])

  // https://reactnative.dev/docs/linking?syntax=android#handling-deep-links
  useEffect(() => {
    // shared link handler
    const deepLinkHandler = ({ url }: { url: string }) => {
      console.log('###### deepLinkHandler')
      console.log(url)
      if (url.includes('y.at')) {
        // TODO(0xdef1cafe): route webview to actual url, not just trade page
        setUri(`${settings?.SHAPESHIFT_URI}/#/trade`)
      }
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

  useEffect(() => {
    if (!settings) return
    const result = `${settings.SHAPESHIFT_URI}/#/dashboard`
    console.log('uri', result)
    setUri(result)
  }, [settings])

  if (!settings?.SHAPESHIFT_URI) return null
  if (!uri) return null

  return (
    <View style={styles.container}>
      <DeveloperModeModal
        visible={isDebugModalVisible}
        onClose={() => setIsDebugModalVisible(false)}
        onSelect={url => setSetting('SHAPESHIFT_URI', url).catch(console.error)}
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
            decelerationRate={'normal'}
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
            onContentProcessDidTerminate={() => webviewRef.current?.reload()}
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
