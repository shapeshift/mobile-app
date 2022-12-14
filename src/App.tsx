import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, View } from 'react-native'
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

const App = () => {
  const { settings, setSetting } = useSettings()
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

  if (!settings?.SHAPESHIFT_URI) return null

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
            source={{ uri: `${settings.SHAPESHIFT_URI}/#/dashboard` }}
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
