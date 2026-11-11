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
