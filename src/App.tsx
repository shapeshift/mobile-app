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
import { Gyroscope } from 'expo-sensors'

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
  const [subscription, setSubscription] = useState<ReturnType<typeof Gyroscope.addListener> | null>(
    null,
  )

  useKeepAlive()
  const { startImport } = useImportWallet()

  useEffect(() => {
    messageManager.on('showDeveloperModal', evt => setIsDebugModalVisible(Boolean(evt.key)))
  }, [messageManager])

  useEffect(() => {
    const SHAKE_THRESHOLD = 10.0
    const SHAKE_TIMEOUT = 250
    let lastShake = 0

    const handleShake = (data: { x: number; y: number; z: number }) => {
      const now = Date.now()
      if (now - lastShake < SHAKE_TIMEOUT) return

      const rotationRate = Math.sqrt(
        Math.pow(data.x, 2) + Math.pow(data.y, 2) + Math.pow(data.z, 2),
      )

      if (rotationRate > SHAKE_THRESHOLD) {
        lastShake = now
        messageManager.postMessage({ cmd: 'shakeEvent' })
      }
    }

    ;(async () => {
      try {
        await Gyroscope.requestPermissionsAsync()
        await Gyroscope.setUpdateInterval(100)

        const subscription = Gyroscope.addListener(handleShake)
        setSubscription(subscription)
      } catch (error) {
        console.error('Failed to set up gyroscope:', error)
      }
    })()

    return () => {
      if (subscription) {
        subscription.remove()
      }
    }
  }, [messageManager, subscription])

  // https://reactnative.dev/docs/linking?syntax=android#handling-deep-links
  useEffect(() => {
    if (!settings) return

    // shared link handler
    const deepLinkHandler = ({ url }: { url: string }) => {
      // "shouldn't" happen, but did in testing
      if (!url) return
      // e.g. shapeshift://yat/🦊🚀🌈
      // url escaped http://192.168.1.22:3000/#/yat/%F0%9F%A6%8A%F0%9F%9A%80%F0%9F%8C%88
      // to test this, run:
      // npx uri-scheme open "shapeshift://yat/%F0%9F%A6%8A%F0%9F%9A%80%F0%9F%8C%88" --ios
      // npx uri-scheme open "shapeshift://yat/%F0%9F%A6%8A%F0%9F%9A%80%F0%9F%8C%88" --android
      const URL_DELIMITER = 'shapeshift://'
      const path = url.split(URL_DELIMITER)[1]
      /**
       * ?Date.now() tricks the webview into navigating to a different url.
       * without it, the urls are the same, even if the webview has routed
       * to some other page within the webview.
       */
      const newUri = `${settings?.SHAPESHIFT_URI}/#/${path}?${Date.now()}`
      setUri(newUri)
    }

    if (isRunningInExpoGo) return

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
    return `${settings.SHAPESHIFT_URI}`
  }, [settings])

  useEffect(() => {
    if (!defaultUrl) return
    setUri(defaultUrl)
  }, [defaultUrl])

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
