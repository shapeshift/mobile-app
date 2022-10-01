import { RefObject } from 'react'
import { WebView, WebViewMessageEvent } from 'react-native-webview'

export type MessageCallback = (e: EventData) => undefined | unknown

export type EventData = {
  cmd: string
  id: number
  key: string
  [k: string]: unknown
}

export class MessageManager {
  #handlers = new Map<string, MessageCallback>()
  #js = ['globalThis.isShapeShiftMobile = true;']
  #webview: RefObject<WebView> | null = null

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
${this.#js.join('\n')}
} catch (e) {}

true;
})()`
  }

  /**
   * Give a reference to a WebView, so we can inject JavaScript
   */
  setWebViewRef(value: RefObject<WebView>) {
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
      const data: EventData = JSON.parse(evt.nativeEvent.data)
      const handler = this.#handlers.get(data.cmd)
      if (handler) {
        let result
        try {
          result = await handler(data)
        } catch (e) {
          result = { error: String(e) }
        }
        this.sendResult(data.id, result)
      }
    } catch (e) {
      console.error('[MessageManager:handleMessage] Invalid event data', e)
    }
  }

  postMessage(data: unknown) {
    try {
      // Yes, a document can post a message to itself
      this.#webview?.current?.injectJavaScript(`window.postMessage(${JSON.stringify(data)})`)
    } catch (e) {
      console.error('[MessageManager:postMessage] Error sending message', { data }, e)
    }
  }

  private sendResult(id: number, result: unknown) {
    // There are better ways to determine if a function result should be sent back
    // to the WebView, but this solution is simple and pragmatic for now
    if (result === undefined) return

    this.postMessage({ id, result })
  }
}
