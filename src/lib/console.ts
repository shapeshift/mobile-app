/**
 * This code forwards all calls to `console` to ReactNative
 * so that we can monitor the logs of the app inside the WebView
 */
import type { EventData } from './MessageManager'

export const injectedJavaScript = `
console = new Proxy(console, {
  get(target, property) {
    return (...args) => {
      target[property](...args)
      window.ReactNativeWebView.postMessage(JSON.stringify({cmd: 'console', fn: property, data: args.join(' ') }))
    }
  }
});
`

export const onMessage = (e: EventData) => {
  // console messages have a "fn" and "data" property
  if (typeof e.fn === 'string' && typeof e.data === 'string') {
    // @ts-expect-error - adding typing to e.fn won't solve the need for runtime checking
    console[e.fn || 'info']?.(`[Console] ${e.data}`)
  }
}
