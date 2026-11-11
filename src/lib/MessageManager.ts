import { getRandomValues } from 'expo-crypto'
import { RefObject } from 'react'
import { getTrustedOrigin, isValidUrl } from './navigationFilter'
import { WebView, WebViewMessageEvent } from 'react-native-webview'

export type MessageCallback = (e: EventData) => undefined | unknown

export type EventData = {
  cmd: string
  id?: string | number
  key: string
  [k: string]: unknown
}

export type BridgeSession = { generation: number; document: string | undefined }

export class MessageManager {
  #bridgeToken = Array.from(getRandomValues(new Uint32Array(8)), value => value.toString(16)).join(
    '-',
  )
  #generation = 0
  #document: string | undefined
  #origin: string | undefined
  #appOrigin: string | undefined
  #handlers = new Map<string, MessageCallback>()
  #js = ['globalThis.isShapeShiftMobile = true;']
  #webview: RefObject<WebView | null> | null = null

  /**
   * Get a string of JavaScript to be inserted into the WebView
   *
   * Use `registerInjectedJavaScript` to add more JavaScript
   */
  get injectedJavaScript() {
    // @see https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#injectedjavascriptbeforecontentloaded
    // The injected JavaScript is supposed to return a valid type
    return `;(function () {
try {
if (window.top !== window.self || window.location.origin !== ${JSON.stringify(
      this.#appOrigin,
    )}) return;
const bridgeDocument = Array.from(crypto.getRandomValues(new Uint32Array(4)), value => value.toString(16)).join('-');
Object.defineProperty(window, '__shapeshiftBridgeDocument', { value: bridgeDocument });
const nativePostMessage = window.ReactNativeWebView.postMessage.bind(window.ReactNativeWebView);
window.ReactNativeWebView.postMessage = data => nativePostMessage(JSON.stringify({
  bridgeToken: ${JSON.stringify(this.#bridgeToken)}, bridgeDocument, data
}));
${this.#js.join('\n')}
} catch (e) {}
})();

true;`
  }

  setAppUrl(appUrl: string | undefined) {
    const origin = appUrl && isValidUrl(appUrl) ? getTrustedOrigin(appUrl) : undefined
    if (origin === this.#appOrigin) return
    this.invalidate()
    this.#appOrigin = origin
    this.#bridgeToken = Array.from(getRandomValues(new Uint32Array(8)), value =>
      value.toString(16),
    ).join('-')
  }

  /**
   * Android also reports history.pushState() as a load start, so only an origin change
   * invalidates the session. Replies are bound to the requesting document instead.
   */
  beginNavigation(url: string, appUrl: string | undefined) {
    this.setAppUrl(appUrl)
    const origin =
      isValidUrl(url) && getTrustedOrigin(url) === getTrustedOrigin(appUrl)
        ? getTrustedOrigin(url)
        : undefined
    if (origin !== this.#origin) this.invalidate()
    this.#origin = origin
    this.#document = undefined
  }

  invalidate() {
    this.#generation++
    this.#origin = undefined
    this.#document = undefined
  }

  get sessionGeneration() {
    return this.#generation
  }

  get session(): BridgeSession {
    return { generation: this.#generation, document: this.#document }
  }

  /**
   * Give a reference to a WebView, so we can inject JavaScript
   */
  setWebViewRef(value: RefObject<WebView | null>) {
    this.#webview = value
  }

  /**
   * Get a reference to webview
   *
   * Useful for injecting JavaScript
   */
  get webviewRef() {
    return this.#webview?.current
  }

  /**
   * Add an event handler for a specific command
   * If the function returns a value, the result will be sent to the WebView
   *
   * Only one handler per event is allowed
   * We don't want React re-renders to add duplicate handlers, and we don't
   * have a need for multiple handlers.
   */
  on(cmd: string, callback: MessageCallback) {
    this.#handlers.set(cmd, callback)
  }

  /**
   * Add a chunk of JavaScript code to be injected into the WebView
   */
  registerInjectedJavaScript(js: string) {
    this.#js.push(js)
  }

  /**
   * Process WebViewMessageEvents by checking for registered callbacks
   *
   * Values returned by callbacks will be sent to the WebView
   */
  async handleMessage(evt: WebViewMessageEvent) {
    try {
      if (!this.#origin || getTrustedOrigin(evt.nativeEvent.url) !== this.#origin) return
      const envelope = JSON.parse(evt.nativeEvent.data)
      if (
        envelope?.bridgeToken !== this.#bridgeToken ||
        typeof envelope.bridgeDocument !== 'string' ||
        typeof envelope.data !== 'string'
      )
        return
      const data: EventData = JSON.parse(envelope.data)
      // The web app uses string IDs; injected helpers such as the clipboard send none
      if (
        !data ||
        typeof data.cmd !== 'string' ||
        !['string', 'number', 'undefined'].includes(typeof data.id)
      )
        return
      this.#document = envelope.bridgeDocument
      const session = this.session
      const handler = this.#handlers.get(data.cmd)
      if (handler) {
        let result
        try {
          result = await handler(data)
        } catch (e) {
          result = { error: String(e) }
        }
        this.sendResult(data.id, result, session)
      }
    } catch {
      console.error('[MessageManager:handleMessage] Invalid event data')
    }
  }

  /**
   * Send a message to the current trusted document, or only to the document of `session`
   */
  postMessage(data: unknown, session?: BridgeSession) {
    if (!this.#origin || (session && session.generation !== this.#generation)) return
    const document = session?.document
      ? ` && window.__shapeshiftBridgeDocument === ${JSON.stringify(session.document)}`
      : ''
    try {
      // Yes, a document can post a message to itself
      this.#webview?.current?.injectJavaScript(
        `if (window.location.origin === ${JSON.stringify(
          this.#origin,
        )}${document}) window.postMessage(${JSON.stringify(data)}, ${JSON.stringify(
          this.#origin,
        )})`,
      )
    } catch {
      console.error('[MessageManager:postMessage] Error sending message')
    }
  }

  private sendResult(id: EventData['id'], result: unknown, session: BridgeSession) {
    // There are better ways to determine if a function result should be sent back
    // to the WebView, but this solution is simple and pragmatic for now
    if (result === undefined) return

    this.postMessage({ id, result }, session)
  }
}
