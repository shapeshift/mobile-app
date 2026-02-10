import { PermissionsAndroid, Platform } from 'react-native'

const SEED_VAULT_PERMISSION = 'com.solanamobile.seedvault.ACCESS_SEED_VAULT'

export async function requestSeedVaultPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true
  }

  try {
    const granted = await PermissionsAndroid.request(SEED_VAULT_PERMISSION as any, {
      title: 'Seed Vault Access',
      message: 'This app needs access to Seed Vault to support NEAR and other blockchains.',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    })

    return granted === PermissionsAndroid.RESULTS.GRANTED
  } catch (error) {
    console.error('[requestSeedVaultPermission] Error requesting permission:', error)
    return false
  }
}

export async function checkSeedVaultPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true
  }

  try {
    const result = await PermissionsAndroid.check(SEED_VAULT_PERMISSION as any)
    return result
  } catch (error) {
    console.error('[checkSeedVaultPermission] Error checking permission:', error)
    return false
  }
}
