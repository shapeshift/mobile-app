import type { EventData } from './MessageManager'

export const onConsole = (e: EventData) => {
  console.log(JSON.stringify(e));
  // console messages have a "fn" and "data" property
  if (typeof e.fn === 'string' && typeof e.data === 'string') {
    // @ts-expect-error - adding typing to e.fn won't solve the need for runtime checking
    console[e.fn || 'info']?.(`[WebView] ${e.data}`)
  }
}
