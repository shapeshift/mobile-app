import { URL } from 'react-native-url-polyfill/js/URL'
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import { Linking } from 'react-native'
import * as Updates from 'expo-updates'
import { WALLET_SCHEMES } from './WalletDetector'

export const getTrustedOrigin = (value: string | undefined): string | undefined => {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.username || url.password) return undefined
    if (
      url.protocol !== 'https:' &&
      !(__DEV__ && url.protocol === 'http:' && url.hostname === 'localhost')
    )
      return undefined
    if (url.protocol === 'https:' && url.port) return undefined
    return url.origin
  } catch {
    return undefined
  }
}

/**
 * Internal and preview builds may switch to non-production web environments.
 * EXPO_PUBLIC_ALLOW_INTERNAL_ENVIRONMENTS is set per EAS build profile in eas.json and
 * inlined into the bundle. The native update channel also has to be non-production, so an
 * OTA update bundled with the flag cannot open internal environments in a store build.
 */
export const allowsInternalEnvironments = (): boolean =>
  process.env.EXPO_PUBLIC_ALLOW_INTERNAL_ENVIRONMENTS === 'true' && Updates.channel !== 'production'

export const isValidUrl = (value: string): boolean => {
  const origin = getTrustedOrigin(value)
  if (!origin) return false
  const allowed = [process.env.EXPO_PUBLIC_SHAPESHIFT_URI]
  if (allowsInternalEnvironments())
    allowed.push(
      process.env.EXPO_PUBLIC_SHAPESHIFT_PRIVATE_URI,
      process.env.EXPO_PUBLIC_RELEASE_URI,
      process.env.EXPO_PUBLIC_DEVELOP_URI,
      process.env.EXPO_PUBLIC_YEET_URI,
      process.env.EXPO_PUBLIC_BEARD_URI,
      process.env.EXPO_PUBLIC_CAFE_URI,
      process.env.EXPO_PUBLIC_GOME_URI,
      process.env.EXPO_PUBLIC_JUICE_URI,
      process.env.EXPO_PUBLIC_WOOD_URI,
      process.env.EXPO_PUBLIC_NEO_URI,
      process.env.EXPO_PUBLIC_LOCAL_URI,
    )
  return allowed.some(url => getTrustedOrigin(url) === origin)
}

// Third-party frames the web app embeds (support widget, WalletConnect verify)
const isEmbeddableUrl = (value: string): boolean => {
  const origin = getTrustedOrigin(value)
  return (
    Boolean(origin) &&
    [
      process.env.EXPO_PUBLIC_CHATWOOT_URI,
      process.env.EXPO_PUBLIC_WALLETCONNECT_VERIFY_SERVER,
      process.env.EXPO_PUBLIC_WALLETCONNECT_VERIFY_FALLBACK_SERVER,
    ].some(url => getTrustedOrigin(url) === origin)
  )
}

// Wallet deep links opened by WalletConnect direct connect, e.g. metamask://wc?uri=...
const externalProtocols = [
  'https:',
  'http:',
  'mailto:',
  'tel:',
  'wc:',
  ...WALLET_SCHEMES.map(({ scheme }) => `${scheme}:`),
]

export const shouldLoadFilter = (request: ShouldStartLoadRequest, appUrl?: string): boolean => {
  if (isValidUrl(request.url) && getTrustedOrigin(request.url) === getTrustedOrigin(appUrl))
    return true
  // Android does not report isTopFrame
  if (request.isTopFrame !== true && isEmbeddableUrl(request.url)) return true
  if (request.isTopFrame === false) return false
  try {
    const url = new URL(request.url)
    if (!externalProtocols.includes(url.protocol) || url.username || url.password) return false
    Linking.openURL(request.url).catch(error => console.error('Unable to open external URL', error))
  } catch {
    return false
  }
  return false
}
