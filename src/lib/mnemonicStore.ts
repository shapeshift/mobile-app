import { deleteItemAsync, getItemAsync, setItemAsync, WHEN_UNLOCKED } from 'expo-secure-store'
import { EventData } from './MessageManager'

export const getMnemonic = async () => {
  console.debug('Getting mnemonic...')
  let mnemonic: string | null = null
  try {
    mnemonic = await getItemAsync('mnemonic')
    console.debug('got it', mnemonic)
    return mnemonic?.split(' ').length === 12 ? mnemonic : null
  } catch (error) {
    console.error('[getMnemonic] Invalid stored mnemonic', mnemonic)
    return null
  }
}

export const hasMnemonic = async () => {
  try {
    return Boolean(await getItemAsync('mnemonic'))
  } catch (e) {
    console.error('[hasMnemonic] Error checking secure store', e)
    return false
  }
}

export const setMnemonic = async (evt: EventData) => {
  console.debug('Setting mnemonic...')
  try {
    const mnemonic = evt.key
    if (typeof mnemonic === 'string') {
      await setItemAsync('mnemonic', mnemonic, { keychainAccessible: WHEN_UNLOCKED })
      console.debug('Saved mnemonic: ', await getMnemonic())
      return true
    }
  } catch (e) {
    console.error('[setMnemonic] Unable to set mnemonic', e)
    return false
  }

  return false
}

export const clearMnemonic = async () => {
  console.debug('Clearing mnemonic...')
  try {
    await deleteItemAsync('mnemonic')
    return true
  } catch (e) {
    console.error('[clearMnemonic] Unable to delete mnemonic', e)
    return false
  }
}
