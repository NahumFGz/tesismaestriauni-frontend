import type { FormattedMessageType } from '../../../services/chat'
import { CHAT_AVATARS, CHAT_NAMES } from '../constants/avatars'

export const createAIMessage = (content: string): FormattedMessageType => ({
  avatar: CHAT_AVATARS.AI,
  message: content,
  name: CHAT_NAMES.AI,
  isRTL: true
})

export const createUserMessage = (content: string): FormattedMessageType => ({
  avatar: CHAT_AVATARS.USER,
  message: content,
  name: CHAT_NAMES.USER,
  isRTL: false
})
