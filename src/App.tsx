import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, View } from 'react-native'
import { SHAPESHIFT_URI } from 'react-native-dotenv'
import ErrorBoundary from 'react-native-error-boundary'
import RNShake from 'react-native-shake'
import { WebView } from 'react-native-webview'
import { DeveloperModeModal } from './components/DeveloperModeModal'
import ErrorPage from './components/ErrorPage'
import { useImportWallet } from './hooks/useImportWallet'
import { getMessageManager } from './lib/getMessageManager'
import { shouldLoadFilter } from './lib/navigationFilter'
import { styles } from './styles'

const App = () => {
  const [loading, setLoading] = useState(true)
  const [ssUrl, setSsUrl] = useState(SHAPESHIFT_URI)
  const [error, setError] = useState(false)
  const [isDebugModalVisible, setIsDebugModalVisible] = useState(false)
  const webviewRef = useRef<WebView>(null)
  const messageManager = getMessageManager()
  messageManager.setWebViewRef(webviewRef)

  const { startImport } = useImportWallet()

  useEffect(() => {
    const subscription = RNShake.addListener(() => setIsDebugModalVisible(true))

    return () => {
      subscription.remove()
    }
  }, [])

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

  return (
    <View style={styles.container}>
      <DeveloperModeModal
        visible={isDebugModalVisible}
        onClose={() => setIsDebugModalVisible(false)}
        onSelect={url => (setSsUrl(url), setError(false))}
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
            // eslint-disable-next-line react-native/no-inline-styles
            style={[styles.container, { display: loading ? 'none' : 'flex' }]}
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
            onLoad={() => setLoading(false)}
            onNavigationStateChange={e => console.log('Navigation Start', e.url)}
            onShouldStartLoadWithRequest={shouldLoadFilter}
            source={{ uri: `${ssUrl}/#/dashboard` }}
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
