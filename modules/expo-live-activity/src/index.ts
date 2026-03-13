import { requireNativeModule } from 'expo-modules-core'

export interface LiveActivityResult {
  success: boolean
  activityId?: string
  pushToken?: string  // Token for backend to send push updates
  error?: string
}

/**
 * Start a Live Activity that will appear on the lock screen and Dynamic Island
 * @param message Message to display in the Live Activity
 * @returns Promise with result containing activityId and pushToken if successful
 */
export async function startLiveActivity(message: string): Promise<LiveActivityResult> {
  const ExpoLiveActivityModule = requireNativeModule('ExpoLiveActivity')
  return await ExpoLiveActivityModule.startActivity(message)
}

/**
 * Update a Live Activity with new content (local update from app)
 * @param activityId The activity ID returned from startLiveActivity
 * @param message New message to display
 * @returns Promise with success status
 */
export async function updateLiveActivity(activityId: string, message: string): Promise<LiveActivityResult> {
  const ExpoLiveActivityModule = requireNativeModule('ExpoLiveActivity')
  return await ExpoLiveActivityModule.updateActivity(activityId, message)
}

/**
 * End a Live Activity
 * @param activityId The activity ID returned from startLiveActivity
 * @returns Promise with success status
 */
export async function endLiveActivity(activityId: string): Promise<LiveActivityResult> {
  const ExpoLiveActivityModule = requireNativeModule('ExpoLiveActivity')
  return await ExpoLiveActivityModule.endActivity(activityId)
}
