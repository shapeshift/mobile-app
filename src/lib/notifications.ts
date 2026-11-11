import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import * as TaskManager from 'expo-task-manager'
import { rememberPushVerification, rememberPushVerificationTask } from './pushVerification'

const PUSH_VERIFICATION_TASK = 'push-verification'

// iOS delivers the silent (content-available) proof only to background notification tasks,
// even while the app is in the foreground. Android also reaches the listeners below.
TaskManager.defineTask<Notifications.NotificationTaskPayload>(
  PUSH_VERIFICATION_TASK,
  ({ data }) => {
    rememberPushVerificationTask(data)
    return Promise.resolve()
  },
)
Notifications.registerTaskAsync(PUSH_VERIFICATION_TASK).catch(error =>
  console.error('[notifications] Unable to register push verification task', error),
)

Notifications.addNotificationReceivedListener(notification => {
  rememberPushVerification(notification.request.content.data ?? {})
})

Notifications.setNotificationHandler({
  handleNotification: async notification => {
    const data = notification.request.content.data ?? {}
    const isVerification = rememberPushVerification(data)
    return {
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: !isVerification,
      shouldShowList: !isVerification,
    }
  },
})

export async function getExpoToken() {
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId

  if (!projectId) {
    throw new Error('Project ID not found')
  }

  return (
    await Notifications.getExpoPushTokenAsync({
      projectId,
    })
  ).data
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('shapeshiftAndroidChannel', {
      name: 'A channel is needed for the permissions prompt to appear',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') {
      return
    }
    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    // EAS projectId is used here.
    try {
      const token = await getExpoToken()

      return token
    } catch (e) {
      return
    }
  } else {
    console.log('Must use physical device for Push Notifications')
  }
}
