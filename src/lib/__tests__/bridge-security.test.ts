import { Linking } from 'react-native'
import { MessageManager } from '../MessageManager'
import { isValidUrl, shouldLoadFilter } from '../navigationFilter'

// The app does not compile against Node typings, so type the Node built-ins used here
type NodeCrypto = { webcrypto: { getRandomValues: <T extends Uint32Array>(value: T) => T } }
const { webcrypto } = jest.requireActual<NodeCrypto>('crypto')
const { runInNewContext } = jest.requireActual<{
  runInNewContext: (code: string, context: object) => unknown
}>('vm')

jest.mock('expo-crypto', () => ({
  getRandomValues: (value: Uint32Array) =>
    jest.requireActual<NodeCrypto>('crypto').webcrypto.getRandomValues(value),
}))

const origin = 'https://app.shapeshift.com'
const event = (
  manager: MessageManager,
  url: string,
  token = true,
  message: Record<string, unknown> = {
    id: '1700000000000-getWallet',
    cmd: 'getWallet',
    key: 'test',
  },
  bridgeDocument = 'document-a',
) =>
  ({
    nativeEvent: {
      url,
      data: JSON.stringify({
        bridgeToken: token
          ? /bridgeToken: "([^"]+)"/.exec(manager.injectedJavaScript)?.[1]
          : 'forged',
        bridgeDocument,
        data: JSON.stringify(message),
      }),
    },
  } as Parameters<MessageManager['handleMessage']>[0])

const withInjectedJavaScript = (manager: MessageManager) => {
  const injectJavaScript = jest.fn()
  manager.setWebViewRef({ current: { injectJavaScript } } as unknown as Parameters<
    MessageManager['setWebViewRef']
  >[0])
  return injectJavaScript
}

// Evaluate an injected reply in a page and return what the page received
const deliver = (script: string, pageOrigin: string, bridgeDocument: string) => {
  const postMessage = jest.fn()
  runInNewContext(script, {
    window: {
      location: { origin: pageOrigin },
      __shapeshiftBridgeDocument: bridgeDocument,
      postMessage,
    },
  })
  return postMessage
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_SHAPESHIFT_URI = origin
})

test.each([
  'https://app.shapeshift.com.attacker.invalid',
  'https://app.shapeshift.com@attacker.invalid',
  'https://user:pass@app.shapeshift.com',
  'http://app.shapeshift.com',
  'https://app.shapeshift.com:8443',
  'javascript:alert(1)',
  'about:blank',
  '',
])('rejects foreign or malformed navigation: %s', url => {
  expect(isValidUrl(url)).toBe(false)
})

test('accepts only exact configured origins', () => {
  expect(isValidUrl(`${origin}/#/wallet`)).toBe(true)
  delete process.env.EXPO_PUBLIC_SHAPESHIFT_URI
  expect(isValidUrl(origin)).toBe(false)
})

test('rejects foreign frames and forged bridge envelopes before dispatch', async () => {
  const manager = new MessageManager()
  manager.beginNavigation(origin, origin)
  const handler = jest.fn(() => 'secret')
  manager.on('getWallet', handler)
  await manager.handleMessage(event(manager, 'https://attacker.invalid'))
  await manager.handleMessage(event(manager, origin, false))
  expect(handler).not.toHaveBeenCalled()
  await manager.handleMessage(event(manager, origin))
  expect(handler).toHaveBeenCalledTimes(1)
})

test('dispatches the web app string IDs and ID-less injected helpers', async () => {
  const manager = new MessageManager()
  const injectJavaScript = withInjectedJavaScript(manager)
  manager.beginNavigation(origin, origin)
  const handler = jest.fn(() => 'result')
  manager.on('getWallet', handler)
  manager.on('setClipboard', handler)
  await manager.handleMessage(event(manager, origin))
  await manager.handleMessage(event(manager, origin, true, { cmd: 'setClipboard', key: 'address' }))
  await manager.handleMessage(event(manager, origin, true, { id: {}, cmd: 'getWallet' }))
  expect(handler).toHaveBeenCalledTimes(2)
  const reply = deliver(injectJavaScript.mock.calls[0][0], origin, 'document-a')
  expect(reply).toHaveBeenCalledWith({ id: '1700000000000-getWallet', result: 'result' }, origin)
})

test('a reply reaches only the requesting document', async () => {
  const manager = new MessageManager()
  const injectJavaScript = withInjectedJavaScript(manager)
  manager.beginNavigation(origin, origin)
  manager.on('getWallet', () => 'dummy mnemonic')
  await manager.handleMessage(event(manager, origin))
  // Android reports history.pushState() as a load start; it must not drop the reply
  manager.beginNavigation(origin + '/#/trade', origin)
  await manager.handleMessage(event(manager, origin))
  expect(injectJavaScript).toHaveBeenCalledTimes(2)
  const script = injectJavaScript.mock.calls[1][0]
  expect(deliver(script, origin, 'document-a')).toHaveBeenCalled()
  expect(deliver(script, origin, 'document-b')).not.toHaveBeenCalled()
  expect(deliver(script, 'https://attacker.invalid', 'document-a')).not.toHaveBeenCalled()
})

test('navigation away from the app invalidates a pending secret response', async () => {
  const manager = new MessageManager()
  const injectJavaScript = withInjectedJavaScript(manager)
  manager.beginNavigation(origin, origin)
  let resolve: (value: string) => void = () => undefined
  manager.on(
    'getWallet',
    () =>
      new Promise<string>(done => {
        resolve = done
      }),
  )
  const pending = manager.handleMessage(event(manager, origin))
  manager.beginNavigation('https://attacker.invalid', origin)
  manager.beginNavigation(origin, origin)
  resolve('dummy mnemonic')
  await pending
  expect(injectJavaScript).not.toHaveBeenCalled()
  manager.beginNavigation('https://attacker.invalid', origin)
  manager.postMessage('dummy mnemonic')
  expect(injectJavaScript).not.toHaveBeenCalled()
})

test('opens wallet deep links and loads embedded support frames', () => {
  process.env.EXPO_PUBLIC_CHATWOOT_URI = 'https://app.chatwoot.com'
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)
  const request = (url: string, isTopFrame?: boolean) =>
    ({ url, isTopFrame } as Parameters<typeof shouldLoadFilter>[0])
  expect(shouldLoadFilter(request('metamask://wc?uri=wc%3Aabc%402', true), origin)).toBe(false)
  expect(openURL).toHaveBeenCalledWith('metamask://wc?uri=wc%3Aabc%402')
  openURL.mockClear()
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'file:///etc/hosts', 'blob:x'])
    expect(shouldLoadFilter(request(url, true), origin)).toBe(false)
  expect(openURL).not.toHaveBeenCalled()
  expect(shouldLoadFilter(request('https://app.chatwoot.com/widget', false), origin)).toBe(true)
  expect(shouldLoadFilter(request('https://app.chatwoot.com/widget'), origin)).toBe(true)
  expect(
    shouldLoadFilter(request('https://app.chatwoot.com.attacker.invalid', false), origin),
  ).toBe(false)
})

test('foreign frames do not open an external browser', () => {
  expect(
    shouldLoadFilter(
      { url: 'https://attacker.invalid', isTopFrame: false } as Parameters<
        typeof shouldLoadFilter
      >[0],
      origin,
    ),
  ).toBe(false)
})

const injectedPage = (manager: MessageManager, pageOrigin: string, isTop: boolean) => {
  const postMessage = jest.fn()
  const page = {
    location: { origin: pageOrigin },
    ReactNativeWebView: { postMessage },
    self: undefined as unknown,
    top: undefined as unknown,
  }
  page.self = page
  page.top = isTop ? page : {}
  runInNewContext(manager.injectedJavaScript, { window: page, globalThis: page, crypto: webcrypto })
  page.ReactNativeWebView.postMessage('test')
  return postMessage
}

test.each([
  ['https://attacker.invalid', true],
  [origin, false],
] as const)('injection does not grant a token to %s (top frame: %s)', (url, isTop) => {
  const manager = new MessageManager()
  manager.setAppUrl(origin)
  expect(injectedPage(manager, url, isTop)).toHaveBeenCalledWith('test')
})

test('injection grants a token to the configured top-level origin', () => {
  const manager = new MessageManager()
  manager.setAppUrl(origin)
  const postMessage = injectedPage(manager, origin, true)
  expect(JSON.parse(postMessage.mock.calls[0][0]).bridgeToken).toBeDefined()
})
