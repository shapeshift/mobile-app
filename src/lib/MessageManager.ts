import { WebViewMessageEvent } from 'react-native-webview'

export type MessageCallback = (e: EventData) => void

export type EventData = {
  cmd: string
  [k: string]: unknown
}

export class MessageManager {
  #handlers = new Map<string, MessageCallback[]>()
  #js = ['globalThis.isShapeShiftMobile = true;']

  get injectedJavaScript() {
    return this.#js.join('\n\n')
  }

  register(cmd: string, callback: MessageCallback) {
    const callbacks = this.#handlers.get(cmd) ?? []
    callbacks.push(callback)
    this.#handlers.set(cmd, callbacks)
  }

  injectJavaScript(js: string) {
    this.#js.push(js)
  }

  onMessage(evt: WebViewMessageEvent) {
    try {
      const data: EventData = JSON.parse(evt.nativeEvent.data)
      const list = this.#handlers.get(data.cmd) ?? []
      list.forEach(h => h(data))
    } catch (e) {
      console.error('[MessageManager] Invalid event data', e)
    }
  }
}
