import React, { useState } from 'react'
import { ActivityIndicator, SafeAreaView } from 'react-native'
import WebView from 'react-native-webview'

const backgroundColor = '#181c27'

const backgroundStyle = {
  backgroundColor,
  flex: 1
}

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
        injectedJavaScriptBeforeContentLoaded={'globalThis.isShapeShiftMobile = true'}
        onLoad={() => setLoading(false)}
        onNavigationStateChange={e => console.log('Navigation Start', e.url)}
        onShouldStartLoadWithRequest={request => {
          // Only allow navigating within this website
          return request.url.startsWith('https://app.shapeshift.com')
        }}
        source={{ uri: 'https://app.shapeshift.com/#/dashboard' }}
        // @TODO: Show an error screen
        onError={e => console.error(e)}
      />
    </SafeAreaView>
  )
}

export default App
