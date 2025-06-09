import { useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'

import { ChatMessages } from '../components/ChatMessages'
import { ChatInput } from '../components/ChatInput'

import { useChatMessages, useChatSocket, useChatNavigation, useChatScroll } from '../hooks'
import { createUserMessage } from '../utils/messageHelpers'

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
  const [prompt, setPrompt] = useState<string>('')
  const [isSending, setIsSending] = useState(false)

  const {
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
  } = useChatMessages()

  const { sendMessage, sendStreamingMessage, navigatingRef } = useChatSocket({
    chatUuid: chat_uuid,
    onStreamingToken: updateStreamingMessage,
    onMessageGenerated: addStreamingMessage,
    onClearStreaming: clearStreamingMessage,
    onStopSending: () => setIsSending(false)
  })

  useChatNavigation({
    chatUuid: chat_uuid,
    onClearMessages: clearMessages,
    onLoadMessages: loadMessages,
    onClearStreaming: clearStreamingMessage,
    onStopSending: () => setIsSending(false),
    navigatingRef
  })

  const { messagesEndRef } = useChatScroll(localMessages, streamingMessage)

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
        isChangingChat={isChangingChat}
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
