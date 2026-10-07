import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { rememberPushVerification } from './pushVerification'

Notifications.addNotificationReceivedListener(notification => {
  rememberPushVerification(notification.request.content.data)
})

Notifications.setNotificationHandler({
  handleNotification: async notification => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: !rememberPushVerification(notification.request.content.data),
    shouldShowList: notification.request.content.data.type !== 'DEVICE_VERIFICATION',
  }),
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
