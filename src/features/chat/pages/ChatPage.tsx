import { ScrollShadow } from '@heroui/react'

import { SidebarContainer } from '../components/sidebar'
import { PromptInputWithEnclosedActions } from '../components/prompt-input-with-enclosed-actions'
import { SidebarContainerHeader } from '../components/sidebar-container-header'

import MessagingChatMessage from '../components/messaging-chat-message'
import { useParams } from 'react-router-dom'
import { NewChat } from '../components/new-chat'
import { getMessagesByUuid } from '../../../services/chat'
import type { FormattedMessageType } from '../../../services/chat'
import { Loading } from '../../../components/ui/Loading'
import { useEffect, useRef, useState, useCallback } from 'react'
import { getSocket, disconnectSocket } from '../../../services/config/socketio'
import type { GeneratedResponse } from '../../../services/config/socketio'
import { Spinner } from '@heroui/react'

export function ChatPage() {
  const { chat_uuid } = useParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previousChatUuidRef = useRef<string | null>(null)

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
      loadMessages(chat_uuid)
    }
  }, [chat_uuid, loadMessages])

  // Configuración de Socket.IO
  useEffect(() => {
    if (!chat_uuid) return

    const socket = getSocket()

    // Evento cuando se recibe un mensaje completo
    socket.on('generated', (data: GeneratedResponse) => {
      if (data.chat_uuid === chat_uuid) {
        console.log('Mensaje generado recibido:', data)
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
  }, [chat_uuid])

  // Función para manejar el envío del prompt
  const handleSendPrompt = () => {
    if (!prompt.trim() || !chat_uuid || isSending) return

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
        chat_uuid
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Desplazarse al final cuando cambian los mensajes o se carga la página
  useEffect(() => {
    if (localMessages.length > 0) {
      scrollToBottom()
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
    if (!isSending || streamingMessage) return null

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
          {/* Ajustamos el área de mensajes para que no sea tapada por el área de entrada */}
          <ScrollShadow className='flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-12'>
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
              <NewChat />
            )}
          </ScrollShadow>
          <div className='mt-4 flex max-w-full flex-col gap-2 px-6 pb-6 bg-default-50 z-10'>
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
