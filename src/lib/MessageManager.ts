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
  #handlers = new Map<string, MessageCallback[]>()
  #js = ['globalThis.isShapeShiftMobile = true;']
  #webview: RefObject<WebView> | null = null

  /**
   * Get a string of JavaScript to be inserted into the WebView
   *
   * Use `registerInjectedJavaScript` to add more JavaScript
   */
  get injectedJavaScript() {
    return this.#js.join('\n')
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
   * Multiple event handlers per command are supported
   */
  on(cmd: string, callback: MessageCallback) {
    const callbacks = this.#handlers.get(cmd) ?? []
    callbacks.push(callback)
    this.#handlers.set(cmd, callbacks)
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
      const handlers = this.#handlers.get(data.cmd) ?? []
      for (const h of handlers) {
        let result
        try {
          result = await h(data)
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
