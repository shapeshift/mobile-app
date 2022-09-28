/* Register message handlers and injected JavaScript */
import once from 'lodash.once'
import { MessageManager } from './MessageManager'

export const getMessageManager = once(() => {
  return new MessageManager()
})
