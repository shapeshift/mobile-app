/**
 * This code forwards all calls to `console` to ReactNative
 * so that we can monitor the logs of the app inside the WebView
 */
import type { EventData } from './MessageManager'

export const onConsole = (e: EventData) => {
  // console messages have a "fn" and "data" property
  if (typeof e.fn === 'string' && typeof e.data === 'string') {
    // @ts-expect-error - adding typing to e.fn won't solve the need for runtime checking
    console[e.fn || 'info']?.(`[WebView] ${e.data}`)
  }
}
