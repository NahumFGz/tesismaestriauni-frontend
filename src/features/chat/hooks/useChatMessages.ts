import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMessagesByUuid } from '../../../services/chat'
import type { FormattedMessageType } from '../../../services/chat'
import { createLogger } from '../utils/logger'
import { createAIMessage } from '../utils/messageHelpers'

export const useChatMessages = () => {
  const [localMessages, setLocalMessages] = useState<FormattedMessageType[]>([])
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [isChangingChat, setIsChangingChat] = useState(false)
  const [currentChatUuid, setCurrentChatUuid] = useState<string>('')
  const [messagesLoaded, setMessagesLoaded] = useState(false)

  const queryClient = useQueryClient()
  const logger = createLogger('useChatMessages')

  // Helper para actualizar el cache de React Query
  const updateCache = useCallback(
    (messages: FormattedMessageType[]) => {
      if (currentChatUuid) {
        queryClient.setQueryData(['chat-messages', currentChatUuid], messages)
      }
    },
    [currentChatUuid, queryClient]
  )

  // Query para cargar mensajes con React Query (solo para carga inicial)
  const { isLoading } = useQuery({
    queryKey: ['chat-messages', currentChatUuid],
    queryFn: async () => {
      const messages = await getMessagesByUuid(currentChatUuid)
      logger('messages', `Mensajes cargados desde servidor: ${messages.length}`)

      // Solo actualizar si no hemos cargado mensajes para este chat
      if (!messagesLoaded) {
        setLocalMessages(messages)
        setMessagesLoaded(true)
      }

      setIsChangingChat(false)
      return messages
    },
    enabled: !!currentChatUuid && !messagesLoaded,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 60 // 1 hora
  })

  const loadMessages = useCallback(
    async (uuid: string) => {
      if (!uuid) return

      logger('messages', `Iniciando carga para chat: ${uuid}`)
      setIsChangingChat(true)
      setLocalMessages([])
      setMessagesLoaded(false)
      setCurrentChatUuid(uuid)

      // Intentar usar cache si está disponible
      const cachedMessages = queryClient.getQueryData<FormattedMessageType[]>([
        'chat-messages',
        uuid
      ])
      if (cachedMessages) {
        logger('messages', `Usando mensajes cacheados: ${cachedMessages.length}`)
        setLocalMessages(cachedMessages)
        setMessagesLoaded(true)
        setIsChangingChat(false)
      }
    },
    [logger, queryClient]
  )

  const clearMessages = useCallback(() => {
    logger('messages', 'Limpiando estado de mensajes')
    setLocalMessages([])
    setStreamingMessage('')
    setCurrentChatUuid('')
    setMessagesLoaded(false)
  }, [logger])

  const addMessage = useCallback(
    (message: FormattedMessageType) => {
      setLocalMessages((prev) => {
        const updatedMessages = [...prev, message]
        updateCache(updatedMessages)
        return updatedMessages
      })
    },
    [updateCache]
  )

  const addStreamingMessage = useCallback(
    (message: FormattedMessageType) => {
      setStreamingMessage('') // Limpiar mensaje en streaming
      setLocalMessages((prev) => {
        const updatedMessages = [...prev, message]
        updateCache(updatedMessages)
        return updatedMessages
      })
    },
    [updateCache]
  )

  const updateStreamingMessage = useCallback((token: string, shouldReplace = false) => {
    if (shouldReplace) {
      setStreamingMessage(token)
    } else {
      setStreamingMessage((prev) => prev + token)
    }
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

  const invalidateMessages = useCallback(
    (uuid?: string) => {
      if (uuid) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', uuid] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['chat-messages'] })
      }
      setMessagesLoaded(false) // Permitir recargar
    },
    [queryClient]
  )

  return {
    localMessages,
    streamingMessage,
    isChangingChat: isChangingChat || isLoading,
    loadMessages,
    clearMessages,
    addMessage,
    addStreamingMessage,
    updateStreamingMessage,
    clearStreamingMessage,
    getDisplayMessages,
    invalidateMessages
  }
}
