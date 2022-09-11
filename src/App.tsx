import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, View } from 'react-native'
import { LOGGING_WEBVIEW, SHAPESHIFT_URI } from 'react-native-dotenv'
import ErrorBoundary from 'react-native-error-boundary'
import RNShake from 'react-native-shake'
import { WebView } from 'react-native-webview'
import { DeveloperModeModal } from './components/DeveloperModeModal'
import ErrorPage from './components/ErrorPage'
import { injectedJavaScript, onConsole } from './lib/console'
import { EventData, MessageManager } from './lib/MessageManager'
import { shouldLoadFilter } from './lib/navigationFilter'
import { WalletManager } from './lib/WalletManager'
import { styles } from './styles'

const walletManager = new WalletManager()
walletManager
  .initialize()
  .catch(e =>
    console.error('[WalletManager.initialize] Error loading wallet index from storage', e),
  )

/* Register message handlers and injected JavaScript */
const messageManager = new MessageManager()
if (LOGGING_WEBVIEW !== 'false') {
  console.log('[App] Injecting console logging JavaScript')
  messageManager.registerInjectedJavaScript(injectedJavaScript)
}

messageManager.on('console', onConsole)
messageManager.on('listWallets', () => walletManager.list())
messageManager.on('hasWallets', () => walletManager.size > 0)
messageManager.on('getWalletCount', () => walletManager.size)
messageManager.on('deleteWallet', evt => walletManager.delete(evt.key))
messageManager.on('getWallet', async evt => walletManager.get(evt.key))
messageManager.on('hasWallet', evt => walletManager.has(evt.key))
messageManager.on('updateWallet', (evt: EventData) =>
  walletManager.update(evt.key, { label: String(evt.label) }),
)
messageManager.on('addWallet', evt =>
  walletManager.add({
    label: String(evt.label),
    mnemonic: String(evt.mnemonic),
  }),
)

const App = () => {
  const [loading, setLoading] = useState(true)
  const [ssUrl, setSsUrl] = useState(SHAPESHIFT_URI)
  const [error, setError] = useState(false)
  const [isDebugModalVisible, setIsDebugModalVisible] = useState(false)
  const webviewRef = useRef<WebView>(null)
  messageManager.setWebViewRef(webviewRef)

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
