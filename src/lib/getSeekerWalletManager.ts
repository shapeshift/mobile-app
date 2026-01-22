import { SeekerWalletManager } from './SeekerWalletManager'
import once from 'lodash.once'

/**
 * Get the singleton SeekerWalletManager instance
 *
 * Uses lodash.once to ensure only one instance is created
 */
export const getSeekerWalletManager = once(() => {
  const seekerWalletManager = new SeekerWalletManager()
  return seekerWalletManager
})
