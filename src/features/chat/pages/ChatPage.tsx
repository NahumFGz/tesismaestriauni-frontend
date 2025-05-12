import { ScrollShadow, Spinner } from '@heroui/react'

import { SidebarContainer } from '../components/sidebar'
import { PromptInputWithEnclosedActions } from '../components/prompt-input-with-enclosed-actions'
import { SidebarContainerHeader } from '../components/sidebar-container-header'

import MessagingChatMessage from '../components/messaging-chat-message'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { NewChat } from '../components/new-chat'
import { getMessagesByUuid } from '../../../services/chat'
import type { FormattedMessageType } from '../../../services/chat'
import { Loading } from '../../../components/ui/Loading'
import { useEffect, useRef, useState, useCallback } from 'react'
import { getSocket } from '../../../services/config/socketio'
import type { GeneratedResponse } from '../../../services/config/socketio'
import { useQueryClient } from '@tanstack/react-query'

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
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previousChatUuidRef = useRef<string | null>(null)
  const previousPathRef = useRef<string | null>(null)
  const navigatingRef = useRef(false)
  const socketRef = useRef(getSocket()) // Mantener referencia al socket

  const [prompt, setPrompt] = useState<string>('')
  const [localMessages, setLocalMessages] = useState<FormattedMessageType[]>([])
  const [isSending, setIsSending] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [isChangingChat, setIsChangingChat] = useState(false)

  const logger = (type: string, message: string, data?: unknown) => {
    const prefix = `[ChatPage:${type}]`
    if (data) {
      console.log(`${prefix} ${message}`, data)
    } else {
      console.log(`${prefix} ${message}`)
    }
  }

  // Limpiar mensajes cuando cambia la ruta
  useEffect(() => {
    const currentPath = location.pathname

    // Si estamos en la ruta base de chat sin UUID, limpiar los mensajes
    if (currentPath === '/chat/conversation' && previousPathRef.current !== currentPath) {
      logger('navigation', 'Navegando a New Chat, limpiando mensajes')
      setLocalMessages([])
      setStreamingMessage('')
      setIsSending(false)
    }

    previousPathRef.current = currentPath
  }, [location.pathname])

  // Función para cargar mensajes
  const loadMessages = useCallback(async (uuid: string) => {
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
  }, [])

  // Efecto para detectar cambios en chat_uuid y cargar mensajes
  useEffect(() => {
    if (chat_uuid && chat_uuid !== previousChatUuidRef.current) {
      logger(
        'chat',
        `Cambio de chat detectado: ${previousChatUuidRef.current || 'nuevo'} -> ${chat_uuid}`
      )
      previousChatUuidRef.current = chat_uuid
      setStreamingMessage('')

      if (navigatingRef.current) {
        navigatingRef.current = false
        setIsSending(false)
      }

      loadMessages(chat_uuid)
    }
  }, [chat_uuid, loadMessages])

  // Configuración de Socket.IO - Una sola vez al montar el componente
  useEffect(() => {
    const socket = socketRef.current
    logger('socket', 'Configurando listeners de socket (conexión persistente)')

    // Evento cuando se recibe un mensaje completo
    socket.on('generated', (data: GeneratedResponse) => {
      logger('socket', 'Mensaje generado recibido:', data)

      // Si recibimos un nuevo UUID y no teníamos uno, navegamos a la nueva URL
      if (data.chat_uuid && !chat_uuid) {
        logger('navigation', `Nuevo chat creado, navegando a: ${data.chat_uuid}`)
        navigatingRef.current = true

        // Navegar a la URL con el nuevo UUID
        navigate(`/chat/conversation/${data.chat_uuid}`)

        // Actualizar la lista de chats para que aparezca el nuevo chat
        queryClient.invalidateQueries({ queryKey: ['chats'] })

        return
      }

      // Si estamos en el chat correcto o es un nuevo chat
      if (!chat_uuid || data.chat_uuid === chat_uuid) {
        // Limpiamos el mensaje en streaming ya que recibimos el mensaje completo
        setStreamingMessage('')

        // Agregamos el nuevo mensaje al estado local
        const newMessage: FormattedMessageType = {
          avatar:
            'https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/avatar_ai.png',
          message: data.content,
          name: 'Acme AI',
          isRTL: true
        }

        setLocalMessages((prev) => [...prev, newMessage])
        setIsSending(false)
      }
    })

    // Evento para tokens de streaming
    socket.on('stream.token', (token) => {
      if (typeof token === 'string') {
        setStreamingMessage((prev) => prev + token)
      } else if (token && typeof token === 'object' && 'content' in token) {
        setStreamingMessage((prev) => prev + token.content)
      }
    })

    // Evento cuando hay un error en el streaming
    socket.on('stream.error', (error) => {
      logger('error', 'Error en streaming:', error)
      setIsSending(false)
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
  }, [chat_uuid, navigate, queryClient])

  // Función para manejar el envío del prompt
  const handleSendPrompt = () => {
    if (!prompt.trim() || isSending) return

    const socket = socketRef.current
    setIsSending(true)
    logger(
      'prompt',
      `Enviando prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`
    )

    // Agregamos el mensaje del usuario al estado local inmediatamente
    const userMessage: FormattedMessageType = {
      avatar:
        'https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/avatars/3a906b3de8eaa53e14582edf5c918b5d.jpg',
      message: prompt,
      name: 'You',
      isRTL: false
    }

    setLocalMessages((prev) => [...prev, userMessage])

    // Enviamos el mensaje al servidor
    socket.emit(
      'generate',
      {
        content: prompt,
        chat_uuid: chat_uuid || '' // Enviamos cadena vacía si no hay UUID
      },
      (ack) => {
        if (ack) {
          if (ack.success === false && ack.message) {
            logger('error', `Error al enviar mensaje: ${ack.message}`)
            setIsSending(false)
          }
        } else {
          logger('prompt', 'Mensaje enviado, esperando respuesta...')
        }
      }
    )

    // Limpiamos el prompt después de enviar
    setPrompt('')
  }

  // Función para manejar la adición de archivos
  const handleAddFile = () => {
    logger('file', 'Agregando archivo (funcionalidad no implementada)')
  }

  // Función para desplazarse al final de los mensajes
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      })
    }
  }

  // Desplazarse al final cuando cambian los mensajes o se carga la página
  useEffect(() => {
    if (localMessages.length > 0 || streamingMessage) {
      setTimeout(scrollToBottom, 50)
    }
  }, [localMessages, streamingMessage])

  // Combinamos los mensajes locales con el mensaje en streaming si existe
  const displayMessages = [...localMessages]
  if (streamingMessage) {
    displayMessages.push({
      avatar: 'https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/avatar_ai.png',
      message: streamingMessage,
      name: 'Acme AI',
      isRTL: true
    })
  }

  // Componente para mostrar el spinner de carga mientras se espera respuesta
  const WaitingResponseSpinner = () => {
    if (!isSending || streamingMessage || navigatingRef.current) return null

    return (
      <div className='flex items-center gap-2 px-4 py-2 rounded-lg bg-default-100 mb-2'>
        <Spinner size='sm' color='primary' variant='wave' />
        <span className='text-small text-default-600'>Acme AI está escribiendo...</span>
      </div>
    )
  }

  return (
    <div className='h-dvh w-full max-w-full'>
      <SidebarContainer
        header={<SidebarContainerHeader />}
        subTitle='Today'
        title='Apply for launch promotion'
      >
        <div className='relative flex h-full flex-col'>
          <ScrollShadow
            className='flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-12'
            hideScrollBar
          >
            {chat_uuid ? (
              isChangingChat ? (
                <div className='flex justify-center items-center h-full'>
                  <Loading />
                </div>
              ) : displayMessages.length > 0 ? (
                <>
                  {displayMessages.map((message, idx) => (
                    <MessagingChatMessage
                      key={idx}
                      classNames={{
                        base: 'bg-default-50'
                      }}
                      {...message}
                    />
                  ))}
                  <WaitingResponseSpinner />
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className='text-center text-default-500'>
                  No hay mensajes en esta conversación
                </div>
              )
            ) : (
              <>
                <NewChat />
                {displayMessages.length > 0 && (
                  <div className='mt-4'>
                    {displayMessages.map((message, idx) => (
                      <MessagingChatMessage
                        key={idx}
                        classNames={{
                          base: 'bg-default-50'
                        }}
                        {...message}
                      />
                    ))}
                    <WaitingResponseSpinner />
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </>
            )}
          </ScrollShadow>
          <div className='sticky bottom-0 mt-auto flex max-w-full flex-col gap-2 px-6 pb-6 bg-default-50 z-10'>
            <PromptInputWithEnclosedActions
              classNames={{
                button:
                  'bg-default-foreground opacity-100 w-[30px] h-[30px] !min-w-[30px] self-center',
                buttonIcon: 'text-background',
                input: 'placeholder:text-default-500',
                innerWrapper: 'items-center'
              }}
              placeholder='Send a message to AcmeAI'
              prompt={prompt}
              onPromptChange={setPrompt}
              onSendPrompt={handleSendPrompt}
              onAddFile={handleAddFile}
              disabled={isSending || isChangingChat}
            />
            <p className='px-2 text-center text-small font-medium leading-5 text-default-500'>
              AcmeAI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </SidebarContainer>
    </div>
  )
}
