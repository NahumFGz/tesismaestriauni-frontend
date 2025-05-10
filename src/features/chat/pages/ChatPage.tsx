import { ScrollShadow } from '@heroui/react'

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
import { getSocket, disconnectSocket } from '../../../services/config/socketio'
import type { GeneratedResponse } from '../../../services/config/socketio'
import { Spinner } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * ChatPage - Componente principal para la interfaz de chat
 *
 * Flujo de funcionamiento:
 * 1. Cargar mensajes existentes si hay un UUID en la URL
 * 2. Permitir enviar mensajes con o sin UUID (chat nuevo o existente)
 * 3. Al enviar un mensaje sin UUID, se espera que el servidor devuelva un nuevo UUID
 * 4. Cuando se recibe un nuevo UUID, se navega a la URL con ese UUID
 * 5. Se muestran los mensajes en tiempo real con streaming mientras se generan
 * 6. Se mantiene el scroll siempre en el último mensaje
 *
 * Características implementadas:
 * - Carga de mensajes existentes para un chat específico
 * - Envío de mensajes a través de websockets
 * - Streaming de respuestas en tiempo real
 * - Navegación automática a nuevo chat cuando se recibe un UUID nuevo
 * - Indicador de carga mientras se espera respuesta
 * - Manejo de cambio entre diferentes chats
 * - Limpieza de mensajes al iniciar un nuevo chat
 * - Actualización de la lista de chats al crear uno nuevo
 *
 * Estados principales:
 * - localMessages: Mensajes del chat actual
 * - streamingMessage: Mensaje que se está recibiendo en streaming
 * - isSending: Indica si se está enviando/esperando respuesta
 * - isChangingChat: Indica si se está cambiando entre chats
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

  // Estado para el prompt
  const [prompt, setPrompt] = useState<string>('')
  // Estado local para los mensajes (para actualización en tiempo real)
  const [localMessages, setLocalMessages] = useState<FormattedMessageType[]>([])
  // Estado para indicar si se está enviando un mensaje
  const [isSending, setIsSending] = useState(false)
  // Estado para almacenar el mensaje en streaming
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  // Estado para rastrear si estamos cambiando de chat
  const [isChangingChat, setIsChangingChat] = useState(false)

  // Limpiar mensajes cuando cambia la ruta
  useEffect(() => {
    const currentPath = location.pathname

    // Si estamos en la ruta base de chat sin UUID, limpiar los mensajes
    if (currentPath === '/chat/conversation' && previousPathRef.current !== currentPath) {
      console.log('Navegando a New Chat, limpiando mensajes')
      setLocalMessages([])
      setStreamingMessage('')
      setIsSending(false)
    }

    // Actualizar la referencia de la ruta anterior
    previousPathRef.current = currentPath
  }, [location.pathname])

  // Función para cargar mensajes
  const loadMessages = useCallback(async (uuid: string) => {
    if (!uuid) return

    setIsChangingChat(true)
    setLocalMessages([])

    try {
      console.log('Cargando mensajes para chat:', uuid)
      const messages = await getMessagesByUuid(uuid)
      console.log('Mensajes cargados:', messages.length)
      setLocalMessages(messages)
    } catch (error) {
      console.error('Error al cargar mensajes:', error)
    } finally {
      setIsChangingChat(false)
    }
  }, [])

  // Efecto para detectar cambios en chat_uuid y cargar mensajes
  useEffect(() => {
    if (chat_uuid && chat_uuid !== previousChatUuidRef.current) {
      console.log('Cambio de chat detectado:', previousChatUuidRef.current, '->', chat_uuid)
      previousChatUuidRef.current = chat_uuid
      setStreamingMessage('')

      // Si estábamos navegando, reiniciamos el estado
      if (navigatingRef.current) {
        navigatingRef.current = false
        setIsSending(false)
      }

      loadMessages(chat_uuid)
    }
  }, [chat_uuid, loadMessages])

  // Configuración de Socket.IO
  useEffect(() => {
    const socket = getSocket()

    // Evento cuando se recibe un mensaje completo
    socket.on('generated', (data: GeneratedResponse) => {
      console.log('Mensaje generado recibido:', data)

      // Si recibimos un nuevo UUID y no teníamos uno, navegamos a la nueva URL
      if (data.chat_uuid && !chat_uuid) {
        console.log('Nuevo chat creado, navegando a:', data.chat_uuid)
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

    // Evento cuando termina el streaming
    socket.on('stream.end', () => {
      // No hacemos nada aquí ya que el mensaje completo llegará por 'generated'
    })

    // Evento cuando hay un error en el streaming
    socket.on('stream.error', (error) => {
      console.error('Error en streaming:', error)
      setIsSending(false)
    })

    return () => {
      // Limpiamos los listeners cuando se desmonta el componente
      socket.off('generated')
      socket.off('stream.token')
      socket.off('stream.end')
      socket.off('stream.error')
    }
  }, [chat_uuid, navigate, queryClient])

  // Función para manejar el envío del prompt
  const handleSendPrompt = () => {
    if (!prompt.trim() || isSending) return

    const socket = getSocket()
    setIsSending(true)

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
        // Verificamos si el ack existe y tiene la estructura esperada
        if (ack) {
          // Si hay un mensaje de error explícito, lo mostramos
          if (ack.success === false && ack.message) {
            console.error('Error al enviar mensaje:', ack.message)
            setIsSending(false)
          }
        } else {
          // Si no hay ack o no tiene la estructura esperada, simplemente continuamos
          // El mensaje "generated" debería llegar de todas formas
          console.log('Mensaje enviado, esperando respuesta...')
        }
      }
    )

    // Limpiamos el prompt después de enviar
    setPrompt('')
  }

  // Función para manejar la adición de archivos
  const handleAddFile = () => {
    console.log('Agregando archivo')
    // Aquí irá la lógica para agregar archivos
  }

  // Función para desplazarse al final de los mensajes
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end' // Asegura que el scroll se enfoque en el final del contenido
      })
    }
  }

  // Desplazarse al final cuando cambian los mensajes o se carga la página
  useEffect(() => {
    if (localMessages.length > 0 || streamingMessage) {
      // Pequeño retraso para asegurar que el DOM se ha actualizado
      setTimeout(scrollToBottom, 50)
    }
  }, [localMessages, streamingMessage])

  // Desconectar el socket cuando se desmonta el componente
  useEffect(() => {
    return () => {
      disconnectSocket()
    }
  }, [])

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
          {/* Contenedor de mensajes con scroll */}
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
                  {/* Spinner de espera de respuesta */}
                  <WaitingResponseSpinner />
                  {/* Elemento invisible para hacer scroll hasta el final */}
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
                    {/* Spinner de espera de respuesta */}
                    <WaitingResponseSpinner />
                    {/* Elemento invisible para hacer scroll hasta el final */}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </>
            )}
          </ScrollShadow>
          {/* Área de entrada fija en la parte inferior */}
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
