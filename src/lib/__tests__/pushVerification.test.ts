import {
  rememberPushVerification,
  rememberPushVerificationTask,
  takePushVerification,
} from '../pushVerification'

const registrationId = '00000000-0000-4000-8000-000000000001'
const nonce = 'ab'.repeat(32)

test('returns proof only for the requested registration and consumes it once', () => {
  expect(
    rememberPushVerification({ type: 'DEVICE_VERIFICATION', registrationId, nonce }, 1000),
  ).toBe(true)
  expect(takePushVerification('different-registration', 1000)).toBeNull()
  expect(takePushVerification(registrationId, 1000)).toBe(nonce)
  expect(takePushVerification(registrationId, 1000)).toBeNull()
})

test('ignores regular notifications, rejects malformed proofs and expires old ones', () => {
  expect(rememberPushVerification({ type: 'SWAP_COMPLETED' })).toBe(false)
  rememberPushVerification({ type: 'DEVICE_VERIFICATION', registrationId, nonce: 'invalid' }, 1000)
  expect(takePushVerification(registrationId, 1000)).toBeNull()
  rememberPushVerification({ type: 'DEVICE_VERIFICATION', registrationId, nonce }, 1000)
  expect(takePushVerification(registrationId, 301001)).toBeNull()
})

test('reads the silent proof from a background notification task payload', () => {
  const dataString = JSON.stringify({ type: 'DEVICE_VERIFICATION', registrationId, nonce })
  expect(rememberPushVerificationTask({ data: { dataString }, notification: null }, 1000)).toBe(
    true,
  )
  expect(takePushVerification(registrationId, 1000)).toBe(nonce)
  expect(rememberPushVerificationTask({ data: { dataString: '{' } }, 1000)).toBe(false)
  expect(rememberPushVerificationTask({ data: {} }, 1000)).toBe(false)
  expect(
    rememberPushVerificationTask({
      actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
    }),
  ).toBe(false)
})
