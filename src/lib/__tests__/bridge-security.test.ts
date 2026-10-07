import { runInNewContext } from 'vm'
import { MessageManager } from '../MessageManager'
import { isValidUrl, shouldLoadFilter } from '../navigationFilter'

jest.mock('expo-crypto', () => ({
  getRandomValues: (value: Uint32Array) =>
    jest.requireActual<typeof import('crypto')>('crypto').webcrypto.getRandomValues(value),
}))

const origin = 'https://app.shapeshift.com'
const event = (manager: MessageManager, url: string, token = true) =>
  ({
    nativeEvent: {
      url,
      data: JSON.stringify({
        bridgeToken: token
          ? /bridgeToken: "([^"]+)"/.exec(manager.injectedJavaScript)?.[1]
          : 'forged',
        data: JSON.stringify({ id: 1, cmd: 'getWallet', key: 'test' }),
      }),
    },
  } as Parameters<MessageManager['handleMessage']>[0])

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

test('navigation invalidates a pending secret response', async () => {
  const manager = new MessageManager()
  const injectJavaScript = jest.fn()
  manager.setWebViewRef({ current: { injectJavaScript } } as unknown as Parameters<
    MessageManager['setWebViewRef']
  >[0])
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
  manager.beginNavigation(origin + '/reloaded', origin)
  resolve('dummy mnemonic')
  await pending
  expect(injectJavaScript).not.toHaveBeenCalled()
  manager.beginNavigation('https://attacker.invalid', origin)
  manager.postMessage('dummy mnemonic')
  expect(injectJavaScript).not.toHaveBeenCalled()
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
  runInNewContext(manager.injectedJavaScript, { window: page, globalThis: page })
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
