/**
 * Enables us to use react native clipboard instead of navigator to correctly set the clipboard on android devices.
 */

export const injectedJavaScript = `
if (!globalThis.navigator.clipboard) {
  globalThis.navigator.clipboard = {};
};
globalThis.navigator.clipboard.writeText = function(s) {
  window.ReactNativeWebView.postMessage(JSON.stringify({cmd: 'setClipboard', key: s }));
};
`
