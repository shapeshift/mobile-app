import { requireNativeModule } from 'expo-modules-core'

type RequestPublicKeyResult = {
  publicKey: string
}

export async function requestPublicKey(
  authToken: string,
  derivationPath: string,
): Promise<RequestPublicKeyResult> {
  try {
    const ExpoSeedVaultModule = requireNativeModule('ExpoSeedVault')
    return await ExpoSeedVaultModule.requestPublicKey(authToken, derivationPath)
  } catch (error) {
    console.error('Error requesting public key from Seed Vault:', error)
    throw error
  }
}
