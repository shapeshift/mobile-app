import React, { useRef, useState } from 'react'
import { ActivityIndicator, SafeAreaView } from 'react-native'
import { WebView } from 'react-native-webview'
import ErrorBoundary from 'react-native-error-boundary'
import ErrorPage from './ErrorPage'
import { styles } from './styles'
import { injectedJavaScript, onMessage } from './lib/console'
import { MessageManager } from './lib/MessageManager'
import { clearMnemonic, getMnemonic, hasMnemonic, setMnemonic } from './lib/mnemonicStore'
import { shouldLoadFilter } from './lib/navigationFilter'
import { SHAPESHIFT_URI, DEVELOP_URI } from 'react-native-dotenv'
import SelectDropdown from 'react-native-select-dropdown'

const uris = [SHAPESHIFT_URI, DEVELOP_URI]

/* Register message handlers and injected JavaScript */
const messageManager = new MessageManager()
messageManager.registerInjectedJavaScript(injectedJavaScript)

messageManager.on('console', onMessage)
messageManager.on('deleteKey', clearMnemonic)
messageManager.on('getKey', getMnemonic)
messageManager.on('hasKey', hasMnemonic)
messageManager.on('setKey', setMnemonic)

const App = () => {
  const [loading, setLoading] = useState(true)
  const [ssUrl, setSsUrl] = useState(SHAPESHIFT_URI)
  const [error, setError] = useState(false)
  const webviewRef = useRef<WebView>(null)
  messageManager.setWebViewRef(webviewRef)

  if (error) {
    return <ErrorPage onTryAgain={() => setError(false)} />
  }

  return (
    <SafeAreaView style={styles.container}>
      <ErrorBoundary
        onError={(e: Error) => {
          console.error(`ErrorBoundary onError: `, e)
          setError(true)
        }}
      >
        <WebView
          ref={webviewRef}
          // Hide the webview until the page is loaded
          style={[styles.container, { display: loading ? 'none' : 'flex' }]}
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
      <SelectDropdown
        data={uris}
        defaultValue={SHAPESHIFT_URI}
        onSelect={selectedItem => {
          setSsUrl(selectedItem)
        }}
        buttonTextAfterSelection={selectedItem => selectedItem}
        rowTextForSelection={item => item}
      />
    </SafeAreaView>
  )
}

export default App
