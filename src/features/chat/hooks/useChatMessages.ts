import { useState, useCallback } from 'react'
import { getMessagesByUuid } from '../../../services/chat'
import type { FormattedMessageType } from '../../../services/chat'
import { createLogger } from '../utils/logger'
import { createAIMessage } from '../utils/messageHelpers'

export const useChatMessages = () => {
  const [localMessages, setLocalMessages] = useState<FormattedMessageType[]>([])
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [isChangingChat, setIsChangingChat] = useState(false)

  const logger = createLogger('useChatMessages')

  const loadMessages = useCallback(
    async (uuid: string) => {
      if (!uuid) return

      setIsChangingChat(true)
      setLocalMessages([])

      try {
        logger('messages', `Cargando mensajes para chat: ${uuid}`)
        const messages = await getMessagesByUuid(uuid)
        logger('messages', `Mensajes cargados: ${messages.length}`)
        setLocalMessages(messages)
      } catch (error) {
        logger('error', 'Error al cargar mensajes:', error)
      } finally {
        setIsChangingChat(false)
      }
    },
    [logger]
  )

  const clearMessages = useCallback(() => {
    logger('messages', 'Limpiando mensajes')
    setLocalMessages([])
    setStreamingMessage('')
  }, [logger])

  const addMessage = useCallback((message: FormattedMessageType) => {
    setLocalMessages((prev) => [...prev, message])
  }, [])

  const addStreamingMessage = useCallback((message: FormattedMessageType) => {
    setStreamingMessage('')
    setLocalMessages((prev) => [...prev, message])
  }, [])

  const updateStreamingMessage = useCallback((token: string) => {
    setStreamingMessage((prev) => prev + token)
  }, [])

  const clearStreamingMessage = useCallback(() => {
    setStreamingMessage('')
  }, [])

  const getDisplayMessages = useCallback(() => {
    const displayMessages = [...localMessages]
    if (streamingMessage) {
      displayMessages.push(createAIMessage(streamingMessage))
    }
    return displayMessages
  }, [localMessages, streamingMessage])

  return {
    localMessages,
    streamingMessage,
    isChangingChat,
    loadMessages,
    clearMessages,
    addMessage,
    addStreamingMessage,
    updateStreamingMessage,
    clearStreamingMessage,
    getDisplayMessages
  }
}
