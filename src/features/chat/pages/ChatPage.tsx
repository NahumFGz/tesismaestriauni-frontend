import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useOutletContext, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { ChatMessages } from '../components/ChatMessages'
import { ChatInput } from '../components/ChatInput'

import { getMessagesByUuid } from '../../../services/chat'
import type { FormattedMessageType } from '../../../services/chat'
import { getSocket } from '../../../services/config/socketio'
import type { GeneratedResponse, StreamingTokenResponse } from '../../../services/config/socketio'
import { createLogger } from '../utils/logger'
import { createAIMessage, createUserMessage } from '../utils/messageHelpers'

interface ChatContextType {
  isStreaming: boolean
  setIsStreaming: (value: boolean) => void
}

/**
 * ChatPage - Componente principal para la interfaz de chat
 *
 * Flujo de funcionamiento:
 * 1. Carga mensajes existentes cuando hay un UUID en la URL
 * 2. Permite enviar mensajes en chats nuevos o existentes
 * 3. Al enviar un mensaje sin UUID, el servidor devuelve un nuevo UUID
 * 4. Con el nuevo UUID, se navega automáticamente a la URL correspondiente
 * 5. Las respuestas se muestran en tiempo real mediante streaming
 * 6. El scroll se mantiene automáticamente en el último mensaje
 *
 * Estados principales:
 * - localMessages: Mensajes del chat actual (array)
 * - streamingMessage: Mensaje que se está recibiendo en streaming (string)
 * - isSending: Indica si se está esperando respuesta (boolean)
 * - isChangingChat: Indica cambio entre chats (boolean)
 *
 * Gestión de eventos:
 * - Socket 'generated': Recibe mensaje completo y actualiza estado
 * - Socket 'stream.token': Actualiza mensaje en streaming
 * - Socket 'stream.end': Finaliza streaming (no acción)
 * - Socket 'stream.error': Maneja errores de comunicación
 *
 * Optimizaciones:
 * - Conexión de socket persistente durante toda la sesión
 * - Referencias para prevenir re-renderizados innecesarios
 * - Gestión eficiente de cambios entre chats
 */
export function ChatPage() {
  const { chat_uuid } = useParams()
  const { isStreaming } = useOutletContext<ChatContextType>()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Estados principales
  const [prompt, setPrompt] = useState<string>('')
  const [isSending, setIsSending] = useState(false)
  const [localMessages, setLocalMessages] = useState<FormattedMessageType[]>([])
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [isChangingChat, setIsChangingChat] = useState(false)
  const [currentChatUuid, setCurrentChatUuid] = useState<string>('')

  // Referencias
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef(getSocket())
  const navigatingRef = useRef(false)
  const previousChatUuidRef = useRef<string | null>(null)
  const previousPathRef = useRef<string | null>(null)

  // Logger
  const logger = createLogger('ChatPage')

  // Helper para actualizar el cache de React Query
  const updateCache = useCallback(
    (messages: FormattedMessageType[]) => {
      if (currentChatUuid) {
        queryClient.setQueryData(['chat-messages', currentChatUuid], messages)
      }
    },
    [currentChatUuid, queryClient]
  )

  // Query para cargar mensajes con React Query
  const { isLoading } = useQuery({
    queryKey: ['chat-messages', currentChatUuid],
    queryFn: async () => {
      const messages = await getMessagesByUuid(currentChatUuid)
      logger('messages', `Mensajes cargados desde servidor: ${messages.length}`)

      // Actualizar los mensajes locales
      setLocalMessages(messages)
      setIsChangingChat(false)
      return messages
    },
    enabled: !!currentChatUuid,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 60 // 1 hora
  })

  // Función para cargar mensajes
  const loadMessages = useCallback(
    async (uuid: string) => {
      if (!uuid || currentChatUuid === uuid) return

      logger('messages', `Iniciando carga para chat: ${uuid}`)
      setIsChangingChat(true)

      // Cambiar el UUID primero para disparar el query
      setCurrentChatUuid(uuid)

      // Intentar usar cache si está disponible
      const cachedMessages = queryClient.getQueryData<FormattedMessageType[]>([
        'chat-messages',
        uuid
      ])
      if (cachedMessages && cachedMessages.length > 0) {
        logger('messages', `Usando mensajes cacheados: ${cachedMessages.length}`)
        setLocalMessages(cachedMessages)
        setIsChangingChat(false)
      } else {
        // Limpiar mensajes solo si no hay cache
        setLocalMessages([])
      }
    },
    [logger, queryClient, currentChatUuid]
  )

  // Función para limpiar mensajes
  const clearMessages = useCallback(() => {
    logger('messages', 'Limpiando estado de mensajes')
    setLocalMessages([])
    setStreamingMessage('')
    setCurrentChatUuid('')
    setIsChangingChat(false)
  }, [logger])

  // Función para agregar mensaje
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

  // Función para agregar mensaje streaming
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

  // Función para actualizar mensaje streaming
  const updateStreamingMessage = useCallback((token: string, shouldReplace = false) => {
    if (shouldReplace) {
      setStreamingMessage(token)
    } else {
      setStreamingMessage((prev) => prev + token)
    }
  }, [])

  // Función para limpiar mensaje streaming
  const clearStreamingMessage = useCallback(() => {
    setStreamingMessage('')
  }, [])

  // Función para obtener mensajes para mostrar
  const getDisplayMessages = useCallback(() => {
    const displayMessages = [...localMessages]
    if (streamingMessage) {
      displayMessages.push(createAIMessage(streamingMessage))
    }
    return displayMessages
  }, [localMessages, streamingMessage])

  // Función para scroll al final
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      })
    }
  }, [])

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
      clearStreamingMessage()
      addStreamingMessage(createAIMessage(content))
      setIsSending(false)
    },
    [clearStreamingMessage, addStreamingMessage]
  )

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
          setIsSending(false)
        } else {
          logger('prompt', `Mensaje ${mode} enviado, esperando respuesta...`)
        }
      })
    },
    [logger]
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

  // Efecto para configurar socket listeners
  useEffect(() => {
    const socket = socketRef.current
    logger('socket', 'Configurando listeners de socket (conexión persistente)')

    // Evento cuando se recibe un mensaje completo (REST)
    socket.on('generated', (data: GeneratedResponse) => {
      logger('socket', 'Mensaje generado recibido:', data)

      // Navegación para nuevos chats
      if (data.chat_uuid && !chat_uuid) {
        handleNewChatNavigation(data.chat_uuid)
        return
      }

      // Procesar mensaje si corresponde al chat actual
      if (!chat_uuid || data.chat_uuid === chat_uuid) {
        handleCompleteMessage(data.content)
      }
    })

    // Evento para tokens de streaming
    socket.on('stream.token', (token) => {
      if (typeof token === 'string') {
        updateStreamingMessage(token)
      } else if (token && typeof token === 'object') {
        if ('content' in token) {
          updateStreamingMessage(token.content)
        } else if ('token' in token && 'chat_uuid' in token) {
          const streamingToken = token as StreamingTokenResponse

          // Navegación para nuevos chats
          if (streamingToken.chat_uuid && !chat_uuid) {
            handleNewChatNavigation(streamingToken.chat_uuid)
            return
          }

          // Procesar token si corresponde al chat actual
          if (!chat_uuid || streamingToken.chat_uuid === chat_uuid) {
            // Usar full_message para mejor formato con espacios correctos
            if (streamingToken.full_message) {
              updateStreamingMessage(streamingToken.full_message, true) // reemplazar mensaje completo
            } else {
              updateStreamingMessage(streamingToken.token, false) // concatenar token
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
      setIsSending(false)
    })

    // Evento cuando hay un error en el streaming
    socket.on('stream.error', (error) => {
      logger('error', 'Error en streaming:', error)
      clearStreamingMessage()
      setIsSending(false)
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
    chat_uuid,
    updateStreamingMessage,
    clearStreamingMessage,
    logger,
    handleNewChatNavigation,
    handleCompleteMessage
  ])

  // Efecto para scroll automático
  useEffect(() => {
    if (localMessages.length > 0 || streamingMessage) {
      setTimeout(scrollToBottom, 50)
    }
  }, [localMessages, streamingMessage, scrollToBottom])

  // Efecto para navegación - limpiar mensajes cuando cambia la ruta
  useEffect(() => {
    const currentPath = location.pathname

    // Si estamos en la ruta base de chat sin UUID, limpiar los mensajes
    if (currentPath === '/chat/conversation' && previousPathRef.current !== currentPath) {
      logger('navigation', 'Navegando a New Chat, limpiando mensajes')
      clearMessages()
      setIsSending(false)
    }

    previousPathRef.current = currentPath
  }, [location.pathname, clearMessages, logger])

  // Efecto para detectar cambios en chat_uuid y cargar mensajes
  useEffect(() => {
    if (chat_uuid && chat_uuid !== previousChatUuidRef.current) {
      logger(
        'chat',
        `Cambio de chat detectado: ${previousChatUuidRef.current || 'nuevo'} -> ${chat_uuid}`
      )
      previousChatUuidRef.current = chat_uuid
      clearStreamingMessage()

      if (navigatingRef.current) {
        navigatingRef.current = false
        setIsSending(false)
      }

      loadMessages(chat_uuid)
    } else if (!chat_uuid && previousChatUuidRef.current) {
      // Si no hay chatUuid pero antes había uno, significa que navegamos a New Chat
      logger('chat', 'Navegando desde conversación específica a New Chat')
      previousChatUuidRef.current = null
    }
  }, [chat_uuid, loadMessages, clearStreamingMessage, logger])

  // Función para manejar el envío del prompt
  const handleSendPrompt = () => {
    if (!prompt.trim() || isSending) return

    setIsSending(true)

    // Agregamos el mensaje del usuario al estado local inmediatamente
    const userMessage = createUserMessage(prompt)

    addMessage(userMessage)

    // Usar streaming o REST según el estado del switch
    if (isStreaming) {
      sendStreamingMessage(prompt, chat_uuid)
    } else {
      sendMessage(prompt, chat_uuid)
    }

    setPrompt('')
  }

  // Función para manejar la adición de archivos
  const handleAddFile = () => {
    console.log('[ChatPage:file] Agregando archivo (funcionalidad no implementada)')
  }

  const displayMessages = getDisplayMessages()

  return (
    <div className='relative flex h-full flex-col'>
      <ChatMessages
        chatUuid={chat_uuid}
        displayMessages={displayMessages}
        isChangingChat={isChangingChat || isLoading}
        isSending={isSending}
        streamingMessage={streamingMessage}
        messagesEndRef={messagesEndRef}
        navigatingRef={navigatingRef}
      />
      <ChatInput
        prompt={prompt}
        onPromptChange={setPrompt}
        onSendPrompt={handleSendPrompt}
        onAddFile={handleAddFile}
        disabled={isSending || isChangingChat}
      />
    </div>
  )
}
