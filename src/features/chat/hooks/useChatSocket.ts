import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '../../../services/config/socketio'
import type { GeneratedResponse } from '../../../services/config/socketio'
import type { FormattedMessageType } from '../../../services/chat'
import { createLogger } from '../utils/logger'
import { createAIMessage } from '../utils/messageHelpers'

interface UseChatSocketProps {
  chatUuid?: string
  onStreamingToken: (token: string) => void
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

  useEffect(() => {
    const socket = socketRef.current
    logger('socket', 'Configurando listeners de socket (conexión persistente)')

    // Evento cuando se recibe un mensaje completo
    socket.on('generated', (data: GeneratedResponse) => {
      logger('socket', 'Mensaje generado recibido:', data)

      // Si recibimos un nuevo UUID y no teníamos uno, navegamos a la nueva URL
      if (data.chat_uuid && !chatUuid) {
        logger('navigation', `Nuevo chat creado, navegando a: ${data.chat_uuid}`)
        navigatingRef.current = true

        // Navegar a la URL con el nuevo UUID
        navigate(`/chat/conversation/${data.chat_uuid}`)

        // Actualizar la lista de chats para que aparezca el nuevo chat
        queryClient.invalidateQueries({ queryKey: ['chats'] })

        return
      }

      // Si estamos en el chat correcto o es un nuevo chat
      if (!chatUuid || data.chat_uuid === chatUuid) {
        // Limpiamos el mensaje en streaming ya que recibimos el mensaje completo
        onClearStreaming()

        // Agregamos el nuevo mensaje al estado local
        const newMessage = createAIMessage(data.content)

        onMessageGenerated(newMessage)
        onStopSending()
      }
    })

    // Evento para tokens de streaming
    socket.on('stream.token', (token) => {
      if (typeof token === 'string') {
        onStreamingToken(token)
      } else if (token && typeof token === 'object' && 'content' in token) {
        onStreamingToken(token.content)
      }
    })

    // Evento cuando hay un error en el streaming
    socket.on('stream.error', (error) => {
      logger('error', 'Error en streaming:', error)
      onStopSending()
    })

    // Verificar que el socket esté conectado o reconectar si es necesario
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
      // No desconectamos el socket al desmontar el componente para mantenerlo persistente
    }
  }, [
    chatUuid,
    navigate,
    queryClient,
    onStreamingToken,
    onMessageGenerated,
    onClearStreaming,
    onStopSending,
    logger
  ])

  const sendMessage = (content: string, uuid?: string) => {
    const socket = socketRef.current
    logger(
      'prompt',
      `Enviando prompt: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`
    )

    socket.emit(
      'generate',
      {
        content,
        chat_uuid: uuid || ''
      },
      (ack) => {
        if (ack) {
          if (ack.success === false && ack.message) {
            logger('error', `Error al enviar mensaje: ${ack.message}`)
            onStopSending()
          }
        } else {
          logger('prompt', 'Mensaje enviado, esperando respuesta...')
        }
      }
    )
  }

  return {
    sendMessage,
    navigatingRef
  }
}
