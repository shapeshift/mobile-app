import React, { useRef, useState } from 'react'
import { ActivityIndicator, SafeAreaView } from 'react-native'
import { WebView } from 'react-native-webview'
import { injectedJavaScript, onMessage } from './lib/console'
import { MessageManager } from './lib/MessageManager'
import { clearMnemonic, getMnemonic, hasMnemonic, setMnemonic } from './lib/mnemonicStore'
import { shouldLoadFilter } from './lib/navigationFilter'
import { SHAPESHIFT_URI } from 'react-native-dotenv'

const backgroundColor = '#181c27'

const backgroundStyle = {
  backgroundColor,
  flex: 1,
}

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
  const webviewRef = useRef<WebView>(null)
  messageManager.setWebViewRef(webviewRef)

  return (
    <SafeAreaView style={backgroundStyle}>
      <WebView
        ref={webviewRef}
        // Hide the webview until the page is loaded
        style={[backgroundStyle, { display: loading ? 'none' : 'flex' }]}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit
        originWhitelist={['*']}
        renderLoading={() => (
          <ActivityIndicator color='#FFFFFF' size='large' style={backgroundStyle} />
        )}
        injectedJavaScriptBeforeContentLoaded={messageManager.injectedJavaScript}
        onMessage={msg => messageManager.handleMessage(msg)}
        onLoad={() => setLoading(false)}
        onNavigationStateChange={e => console.log('Navigation Start', e.url)}
        onShouldStartLoadWithRequest={shouldLoadFilter}
        source={{ uri: `${SHAPESHIFT_URI}/#/dashboard` }}
        // @TODO: Show an error screen
        onError={e => console.error(e)}
      />
    </SafeAreaView>
  )
}

export default App
