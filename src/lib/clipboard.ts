/**
 * Enables us to use react native clipboard instead of navigator to correctly set the clipboard on andorid devices.
 */

export const injectedJavaScript = `
globalThis.navigator.clipboard.writeText = function(s) {
  window.ReactNativeWebView.postMessage(JSON.stringify({cmd: 'setClipboard', key: s }))
}
`
