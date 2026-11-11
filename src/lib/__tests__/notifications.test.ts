import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import { takePushVerification } from '../pushVerification'

jest.mock('expo-device', () => ({ isDevice: true }))
jest.mock('expo-constants', () => ({}))
jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }))
jest.mock('expo-notifications', () => ({
  addNotificationReceivedListener: jest.fn(),
  registerTaskAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
}))

require('../notifications')

const registrationId = '00000000-0000-4000-8000-000000000002'
const nonce = 'cd'.repeat(32)
const proof = { type: 'DEVICE_VERIFICATION', registrationId, nonce }

test('a silent proof delivered to the background task reaches the bridge (iOS)', async () => {
  const [[name, task]] = (TaskManager.defineTask as jest.Mock).mock.calls
  expect(Notifications.registerTaskAsync).toHaveBeenCalledWith(name)
  await task({ data: { data: { dataString: JSON.stringify(proof) }, notification: null } })
  expect(takePushVerification(registrationId)).toBe(nonce)
})

test('verification pushes are never shown and missing data does not throw', async () => {
  const [[{ handleNotification }]] = (Notifications.setNotificationHandler as jest.Mock).mock.calls
  const notification = (data: unknown) => ({ request: { content: { data } } })
  expect(await handleNotification(notification(proof))).toMatchObject({
    shouldShowBanner: false,
    shouldShowList: false,
  })
  expect(await handleNotification(notification(null))).toMatchObject({
    shouldShowBanner: true,
    shouldShowList: true,
  })
})

// Payload shapes the native modules hand to the task for an Expo push with
// `_contentAvailable: true` and `data` (see BackgroundEventTransformer.swift and
// RemoteMessageSerializer.java in expo-notifications 0.32)
const iosTaskPayload = (data: object) => ({
  data: {
    body: data,
    experienceId: '@shapeshift_dao/mobile-app',
    scopeKey: '@shapeshift_dao/mobile-app',
    dataString: JSON.stringify(data),
  },
  notification: null,
  aps: { 'content-available': 1 },
})
const androidTaskPayload = (data: object) => ({
  collapseKey: 'com.shapeshift.droid_shapeshift',
  data: {
    body: JSON.stringify(data),
    dataString: JSON.stringify(data),
    experienceId: '@shapeshift_dao/mobile-app',
    projectId: '5fc55e72-5e61-41f2-be9b-01a77afc388e',
    scopeKey: '@shapeshift_dao/mobile-app',
  },
  messageId: '0:1',
  notification: null,
  priority: 1,
})

test.each([
  ['iOS', iosTaskPayload],
  ['Android', androidTaskPayload],
])('the %s silent push payload yields a one-use proof', async (_, payload) => {
  const [[, task]] = (TaskManager.defineTask as jest.Mock).mock.calls
  const id = registrationId.replace(/2$/, '3')
  await task({ data: payload({ type: 'DEVICE_VERIFICATION', registrationId: id, nonce }) })
  expect(takePushVerification('00000000-0000-4000-8000-000000000009')).toBeNull()
  expect(takePushVerification(id)).toBe(nonce)
  expect(takePushVerification(id)).toBeNull()
  // A regular push through the task leaves nothing behind
  await task({ data: payload({ type: 'SWAP_COMPLETED', registrationId: id, nonce }) })
  expect(takePushVerification(id)).toBeNull()
})

test('a notification response passed to the task is ignored', async () => {
  const [[, task]] = (TaskManager.defineTask as jest.Mock).mock.calls
  await expect(
    task({ data: { actionIdentifier: 'expo.modules.notifications.actions.DEFAULT' } }),
  ).resolves.toBeUndefined()
})
