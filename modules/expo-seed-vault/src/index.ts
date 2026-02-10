import { requireNativeModule } from 'expo-modules-core'

type RequestPublicKeyResult = {
  publicKey: string
  authToken?: string | null
}

type SignMessageResult = {
  signature: string
  authToken?: string | null
}

export const PURPOSE_SIGN_SOLANA_TRANSACTION = 0

export async function authorizeSeed(purpose: number = PURPOSE_SIGN_SOLANA_TRANSACTION): Promise<string> {
  try {
    const ExpoSeedVaultModule = requireNativeModule('ExpoSeedVault')
    return await ExpoSeedVaultModule.authorizeSeed(purpose)
  } catch (error) {
    console.error('Error authorizing seed:', error)
    throw error
  }
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

export async function signMessage(
  authToken: string,
  message: string,
  derivationPath: string,
): Promise<SignMessageResult> {
  try {
    const ExpoSeedVaultModule = requireNativeModule('ExpoSeedVault')
    return await ExpoSeedVaultModule.signMessage(authToken, message, derivationPath)
  } catch (error) {
    console.error('Error signing message with Seed Vault:', error)
    throw error
  }
}

export async function deauthorizeSeed(authToken: string): Promise<void> {
  try {
    const ExpoSeedVaultModule = requireNativeModule('ExpoSeedVault')
    return await ExpoSeedVaultModule.deauthorizeSeed(authToken)
  } catch (error) {
    console.error('Error deauthorizing seed:', error)
    throw error
  }
}

export type AuthorizedSeed = {
  authToken: string
  name: string | null
  purpose: number
}

export async function getAuthorizedSeeds(purpose: number = PURPOSE_SIGN_SOLANA_TRANSACTION): Promise<AuthorizedSeed[]> {
  try {
    const ExpoSeedVaultModule = requireNativeModule('ExpoSeedVault')
    return await ExpoSeedVaultModule.getAuthorizedSeeds(purpose)
  } catch (error) {
    console.error('Error getting authorized seeds:', error)
    throw error
  }
}
