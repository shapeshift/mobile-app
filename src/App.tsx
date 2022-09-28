import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import ErrorBoundary from 'react-native-error-boundary'
import { WebView } from 'react-native-webview'
import { DeveloperModeModal } from './components/DeveloperModeModal'
import ErrorPage from './components/ErrorPage'
import { useImportWallet } from './hooks/useImportWallet'
import { useKeepAlive } from './hooks/useKeepAlive'
import { useMessageManager } from './hooks/useMessageManager'
import { useSettings } from './hooks/useSettings'
import { useShake } from './hooks/useShake'
import { useWebViewRef } from './hooks/useWebViewRef'
import { ENVIRONMENTS } from './lib/environments'
import { shouldLoadFilter } from './lib/navigationFilter'
import { styles } from './styles'

const App = () => {
  const { settings, setSetting } = useSettings()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isDeveloperModalVisible, setIsDeveloperModalVisible] = useState(false)
  const webviewRef = useWebViewRef()
  const messageManager = useMessageManager()

  useKeepAlive()
  useShake()
  const importWallet = useImportWallet()

  useEffect(() => {
    if (webviewRef && messageManager) {
      messageManager.on('showDeveloperModal', () => setIsDeveloperModalVisible(true))
      messageManager.on('setEnvironment', async evt => {
        console.debug('[setEnvironment', evt.key)
        const env = ENVIRONMENTS.find(e => e.key === evt.key)
        if (env) {
          try {
            await setSetting('SHAPESHIFT_URI', env.url)
            return true
          } catch (e) {
            console.error('[setEnvironment]', e)
          }
        }

        return false
      })
      messageManager.on('setError', evt => setError(Boolean(evt.key)))
    }
  }, [messageManager, setSetting, webviewRef])

  useEffect(() => {
    if (!loading && importWallet) {
      importWallet.startImport()
    }
  }, [importWallet, loading])

  if (!settings?.SHAPESHIFT_URI || !webviewRef || !messageManager) return null

  return (
    <View style={styles.container}>
      <DeveloperModeModal
        visible={isDeveloperModalVisible}
        onClose={() => setIsDeveloperModalVisible(false)}
        onSelect={url => setSetting('SHAPESHIFT_URI', url).catch(console.error)}
      />
      {error ? (
        <ErrorPage onTryAgain={() => setError(false)} />
      ) : (
        <ErrorBoundary
          onError={(e: Error) => {
            console.error(`ErrorBoundary onError: `, e)
            if (!isDeveloperModalVisible) setError(true)
          }}
        >
          <WebView
            ref={webviewRef}
            // Hide the webview until the page is loaded
            // eslint-disable-next-line react-native/no-inline-styles
            style={[styles.container, { display: loading ? 'none' : 'flex' }]}
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
