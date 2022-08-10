import React, { useState } from 'react'
import { ActivityIndicator, SafeAreaView } from 'react-native'
import WebView from 'react-native-webview'
import { injectedJavaScript, onMessage } from './lib/console'
import { MessageManager } from './lib/MessageManager'
import { shouldLoadFilter } from './lib/navigationFilter'

const backgroundColor = '#181c27'

const backgroundStyle = {
  backgroundColor,
  flex: 1,
}

/* Register message handlers and injected JavaScript */
const messageManager = new MessageManager()
messageManager.register('console', onMessage)
messageManager.injectJavaScript(injectedJavaScript)

const App = () => {
  const [loading, setLoading] = useState(true)

  return (
    <SafeAreaView style={backgroundStyle}>
      <WebView
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
        onMessage={messageManager.onMessage.bind(messageManager)}
        onLoad={() => setLoading(false)}
        onNavigationStateChange={e => console.log('Navigation Start', e.url)}
        onShouldStartLoadWithRequest={shouldLoadFilter}
        source={{ uri: 'https://app.shapeshift.com/#/dashboard' }}
        // @TODO: Show an error screen
        onError={e => console.error(e)}
      />
    </SafeAreaView>
  )
}

export default App
