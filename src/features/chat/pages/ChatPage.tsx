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
 * ChatPage
 * -----------------------------------------------------------------------------
 * Vista principal de conversación.
 *  • Carga historial cuando hay chat_uuid.
 *  • Permite crear chats nuevos desde /chat/conversation.
 *  • Envío REST o Streaming a través de Socket.IO (conexión persistente).
 *  • Respuestas se procesan en tiempo real sin bloquear la navegación.
 *  • Se respeta la intención del usuario: si cambia de vista no se le redirige.
 *  • El caché de mensajes se mantiene con React-Query y se actualiza via
 *    appendAIMessageToCache(…). También se invalida la clave ['chats'] para que
 *    el Sidebar se refresque.
 *  • Scroll automático al último mensaje.
 *  • Uso intensivo de callbacks/ref para evitar renders innecesarios.
 * -----------------------------------------------------------------------------
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
  const [userIntendedToStay, setUserIntendedToStay] = useState(true) // Flag para rastrear intención del usuario

  // Referencias
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef(getSocket())
  const navigatingRef = useRef(false)
  const previousChatUuidRef = useRef<string | null>(null)
  const previousPathRef = useRef<string | null>(null)
  const lastMessageOriginRef = useRef<string | null>(null) // Rastrear origen del último mensaje

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

  // Helper centralizado para navegación a nuevos chats con respeto a la intención del usuario
  const handleNewChatNavigation = useCallback(
    (newChatUuid: string, shouldRespectUserNavigation = true) => {
      const currentPath = location.pathname
      const isInNewChatView = currentPath === '/chat/conversation'
      const isInTargetChatView = currentPath === `/chat/conversation/${newChatUuid}`

      logger('navigation', `Evaluando navegación a chat ${newChatUuid}:`, {
        currentPath,
        isInNewChatView,
        isInTargetChatView,
        userIntendedToStay,
        lastMessageOrigin: lastMessageOriginRef.current,
        shouldRespectUserNavigation
      })

      // Si el usuario cambió manualmente de vista después de enviar el mensaje, NO navegar
      if (shouldRespectUserNavigation && !userIntendedToStay) {
        logger(
          'navigation',
          `Usuario cambió de vista manualmente, solo actualizando cache para chat ${newChatUuid}`
        )
        queryClient.invalidateQueries({ queryKey: ['chats'] })
        queryClient.invalidateQueries({ queryKey: ['chat-messages', newChatUuid] })
        return
      }

      // Solo navegar automáticamente si:
      // 1. El usuario está en la vista de nuevo chat Y aún pretende quedarse en su flujo original, O
      // 2. Ya está viendo el chat específico
      if ((isInNewChatView && userIntendedToStay) || isInTargetChatView) {
        logger('navigation', `Navegando automáticamente a chat ${newChatUuid}`)
        navigatingRef.current = true
        navigate(`/chat/conversation/${newChatUuid}`)
        queryClient.invalidateQueries({ queryKey: ['chats'] })
      } else {
        logger(
          'navigation',
          `Condiciones no cumplidas para navegar a chat ${newChatUuid}, solo actualizando cache`
        )
        queryClient.invalidateQueries({ queryKey: ['chats'] })
        queryClient.invalidateQueries({ queryKey: ['chat-messages', newChatUuid] })
      }
    },
    [navigate, queryClient, logger, location.pathname, userIntendedToStay]
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

  /**
   * appendAIMessageToCache
   * Helper central que agrega un mensaje de IA al cache de React Query e invalida la lista de chats.
   * De este modo evitamos duplicar la misma lógica tanto en el listener de eventos REST como STREAMING.
   */
  const appendAIMessageToCache = useCallback(
    (chatUuid: string, content: string) => {
      queryClient.setQueryData(
        ['chat-messages', chatUuid],
        (old: FormattedMessageType[] | undefined) => {
          const newMessage = createAIMessage(content)
          return old ? [...old, newMessage] : [newMessage]
        }
      )
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
    [queryClient]
  )

  // Efecto para configurar socket listeners
  useEffect(() => {
    const socket = socketRef.current
    logger('socket', 'Configurando listeners de socket (conexión persistente)')

    // Evento cuando se recibe un mensaje completo (REST)
    socket.on('generated', (data: GeneratedResponse) => {
      logger('socket', 'Mensaje generado recibido:', data)

      // Navegación para nuevos chats - verificar intención del usuario
      if (data.chat_uuid && !chat_uuid) {
        // Solo navegar automáticamente si el mensaje se originó desde "new chat"
        const isFromNewChat = lastMessageOriginRef.current === 'new-chat'

        if (isFromNewChat) {
          handleNewChatNavigation(data.chat_uuid)
        } else {
          // Mensaje de respuesta a un chat existente, pero usuario está en new chat
          // Solo actualizar cache, no navegar
          logger(
            'socket',
            `Respuesta recibida para chat ${data.chat_uuid}, pero usuario está en new chat. Solo actualizando cache.`
          )
          appendAIMessageToCache(data.chat_uuid, data.content)
        }
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

          // Navegación para nuevos chats - verificar intención del usuario
          if (streamingToken.chat_uuid && !chat_uuid) {
            const isFromNewChat = lastMessageOriginRef.current === 'new-chat'

            if (isFromNewChat) {
              handleNewChatNavigation(streamingToken.chat_uuid)
              return
            } else {
              // Streaming de respuesta a un chat existente, pero usuario está en new chat
              // Solo actualizar cache al completarse, no navegar
              if (streamingToken.is_complete && streamingToken.full_message) {
                logger(
                  'socket',
                  `Streaming completado para chat ${streamingToken.chat_uuid}, pero usuario está en new chat. Solo actualizando cache.`
                )
                appendAIMessageToCache(streamingToken.chat_uuid, streamingToken.full_message!)
              }
              return
            }
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
    handleCompleteMessage,
    appendAIMessageToCache
  ])

  // Efecto para scroll automático
  useEffect(() => {
    if (localMessages.length > 0 || streamingMessage) {
      setTimeout(scrollToBottom, 50)
    }
  }, [localMessages, streamingMessage, scrollToBottom])

  // Efecto para navegación - detectar cambios manuales de vista
  useEffect(() => {
    const currentPath = location.pathname

    // Si hay un mensaje pendiente y el usuario cambió de vista manualmente
    if (
      lastMessageOriginRef.current &&
      previousPathRef.current &&
      currentPath !== previousPathRef.current
    ) {
      // Detectar si el usuario se fue de la vista donde envió el mensaje
      const messageOriginPath =
        lastMessageOriginRef.current === 'new-chat'
          ? '/chat/conversation'
          : `/chat/conversation/${lastMessageOriginRef.current}`

      if (currentPath !== messageOriginPath) {
        logger(
          'navigation',
          `Usuario abandonó la vista original (${messageOriginPath}) y fue a ${currentPath}`
        )
        setUserIntendedToStay(false)
      }
    }

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

      // Reset de la intención del usuario para el nuevo chat
      setUserIntendedToStay(true)
      lastMessageOriginRef.current = null

      if (navigatingRef.current) {
        navigatingRef.current = false
        setIsSending(false)
      }

      loadMessages(chat_uuid)
    } else if (!chat_uuid && previousChatUuidRef.current) {
      // Si no hay chatUuid pero antes había uno, significa que navegamos a New Chat
      logger('chat', 'Navegando desde conversación específica a New Chat')
      previousChatUuidRef.current = null
      // Reset del estado cuando vamos a new chat
      setUserIntendedToStay(true)
      lastMessageOriginRef.current = null
    }
  }, [chat_uuid, loadMessages, clearStreamingMessage, logger])

  // Función para manejar el envío del prompt
  const handleSendPrompt = () => {
    if (!prompt.trim() || isSending) return

    setIsSending(true)

    // Rastrear el origen del mensaje para controlar navegación automática
    lastMessageOriginRef.current = chat_uuid || 'new-chat'
    setUserIntendedToStay(true) // Usuario intenta quedarse en el contexto actual

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
