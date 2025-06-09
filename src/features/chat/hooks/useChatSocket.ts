import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '../../../services/config/socketio'
import type { GeneratedResponse, StreamingTokenResponse } from '../../../services/config/socketio'
import type { FormattedMessageType } from '../../../services/chat'
import { createLogger } from '../utils/logger'
import { createAIMessage } from '../utils/messageHelpers'

interface UseChatSocketProps {
  chatUuid?: string
  onStreamingToken: (token: string, shouldReplace?: boolean) => void
  onMessageGenerated: (message: FormattedMessageType) => void
  onClearStreaming: () => void
  onStopSending: () => void
}

export const useChatSocket = ({
  chatUuid,
  onStreamingToken,
  onMessageGenerated,
  onClearStreaming,
  onStopSending
}: UseChatSocketProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const socketRef = useRef(getSocket())
  const navigatingRef = useRef(false)

  const logger = createLogger('useChatSocket')

  // Helper centralizado para navegación a nuevos chats
  const handleNewChatNavigation = useCallback(
    (newChatUuid: string) => {
      logger('navigation', `Nuevo chat creado, navegando a: ${newChatUuid}`)
      navigatingRef.current = true
      navigate(`/chat/conversation/${newChatUuid}`)
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
    [navigate, queryClient, logger]
  )

  // Helper para finalizar mensaje completo
  const handleCompleteMessage = useCallback(
    (content: string) => {
      onClearStreaming()
      onMessageGenerated(createAIMessage(content))
      onStopSending()
    },
    [onClearStreaming, onMessageGenerated, onStopSending]
  )

  useEffect(() => {
    const socket = socketRef.current
    logger('socket', 'Configurando listeners de socket (conexión persistente)')

    // Evento cuando se recibe un mensaje completo (REST)
    socket.on('generated', (data: GeneratedResponse) => {
      logger('socket', 'Mensaje generado recibido:', data)

      // Navegación para nuevos chats
      if (data.chat_uuid && !chatUuid) {
        handleNewChatNavigation(data.chat_uuid)
        return
      }

      // Procesar mensaje si corresponde al chat actual
      if (!chatUuid || data.chat_uuid === chatUuid) {
        handleCompleteMessage(data.content)
      }
    })

    // Evento para tokens de streaming
    socket.on('stream.token', (token) => {
      if (typeof token === 'string') {
        onStreamingToken(token)
      } else if (token && typeof token === 'object') {
        if ('content' in token) {
          onStreamingToken(token.content)
        } else if ('token' in token && 'chat_uuid' in token) {
          const streamingToken = token as StreamingTokenResponse

          // Navegación para nuevos chats
          if (streamingToken.chat_uuid && !chatUuid) {
            handleNewChatNavigation(streamingToken.chat_uuid)
            return
          }

          // Procesar token si corresponde al chat actual
          if (!chatUuid || streamingToken.chat_uuid === chatUuid) {
            // Usar full_message para mejor formato con espacios correctos
            if (streamingToken.full_message) {
              onStreamingToken(streamingToken.full_message, true) // reemplazar mensaje completo
            } else {
              onStreamingToken(streamingToken.token, false) // concatenar token
            }

            // Si el streaming está completo, crear mensaje final
            if (streamingToken.is_complete && streamingToken.full_message) {
              handleCompleteMessage(streamingToken.full_message)
            }
          }
        }
      }
    })

    // Evento cuando finaliza el streaming
    socket.on('stream.end', () => {
      logger('streaming', 'Streaming finalizado')
      onStopSending()
    })

    // Evento cuando hay un error en el streaming
    socket.on('stream.error', (error) => {
      logger('error', 'Error en streaming:', error)
      onClearStreaming()
      onStopSending()
    })

    // Verificar conexión del socket
    if (!socket.connected) {
      logger('socket', 'Socket no conectado, intentando conectar...')
      socket.connect()
    }

    return () => {
      logger('socket', 'Limpiando listeners de socket (manteniendo conexión)')
      socket.off('generated')
      socket.off('stream.token')
      socket.off('stream.end')
      socket.off('stream.error')
    }
  }, [
    chatUuid,
    onStreamingToken,
    onMessageGenerated,
    onClearStreaming,
    onStopSending,
    logger,
    handleNewChatNavigation,
    handleCompleteMessage
  ])

  // Helper centralizado para envío de mensajes
  const sendSocketMessage = useCallback(
    (event: 'generate' | 'generate.streaming', content: string, uuid?: string) => {
      const socket = socketRef.current
      const mode = event === 'generate.streaming' ? 'STREAMING' : 'REST'

      logger(
        'prompt',
        `Enviando prompt ${mode}: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`
      )

      socket.emit(event, { content, chat_uuid: uuid || '' }, (ack) => {
        if (ack?.success === false && ack.message) {
          logger('error', `Error al enviar mensaje ${mode}: ${ack.message}`)
          onStopSending()
        } else {
          logger('prompt', `Mensaje ${mode} enviado, esperando respuesta...`)
        }
      })
    },
    [logger, onStopSending]
  )

  const sendMessage = useCallback(
    (content: string, uuid?: string) => {
      sendSocketMessage('generate', content, uuid)
    },
    [sendSocketMessage]
  )

  const sendStreamingMessage = useCallback(
    (content: string, uuid?: string) => {
      sendSocketMessage('generate.streaming', content, uuid)
    },
    [sendSocketMessage]
  )

  return {
    sendMessage,
    sendStreamingMessage,
    navigatingRef
  }
}
