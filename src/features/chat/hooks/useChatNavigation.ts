import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { createLogger } from '../utils/logger'

interface UseChatNavigationProps {
  chatUuid?: string
  onClearMessages: () => void
  onLoadMessages: (uuid: string) => void
  onClearStreaming: () => void
  onStopSending: () => void
  navigatingRef: React.MutableRefObject<boolean>
}

export const useChatNavigation = ({
  chatUuid,
  onClearMessages,
  onLoadMessages,
  onClearStreaming,
  onStopSending,
  navigatingRef
}: UseChatNavigationProps) => {
  const location = useLocation()
  const previousChatUuidRef = useRef<string | null>(null)
  const previousPathRef = useRef<string | null>(null)

  const logger = createLogger('useChatNavigation')

  // Limpiar mensajes cuando cambia la ruta
  useEffect(() => {
    const currentPath = location.pathname

    // Si estamos en la ruta base de chat sin UUID, limpiar los mensajes
    if (currentPath === '/chat/conversation' && previousPathRef.current !== currentPath) {
      logger('navigation', 'Navegando a New Chat, limpiando mensajes')
      onClearMessages()
      onStopSending()
    }

    previousPathRef.current = currentPath
  }, [location.pathname, onClearMessages, onStopSending, logger])

  // Efecto para detectar cambios en chat_uuid y cargar mensajes
  useEffect(() => {
    if (chatUuid && chatUuid !== previousChatUuidRef.current) {
      logger(
        'chat',
        `Cambio de chat detectado: ${previousChatUuidRef.current || 'nuevo'} -> ${chatUuid}`
      )
      previousChatUuidRef.current = chatUuid
      onClearStreaming()

      if (navigatingRef.current) {
        navigatingRef.current = false
        onStopSending()
      }

      onLoadMessages(chatUuid)
    } else if (!chatUuid && previousChatUuidRef.current) {
      // Si no hay chatUuid pero antes había uno, significa que navegamos a New Chat
      logger('chat', 'Navegando desde conversación específica a New Chat')
      previousChatUuidRef.current = null
    }
  }, [chatUuid, onLoadMessages, onClearStreaming, onStopSending, navigatingRef, logger])
}
