import { useEffect, useRef } from 'react'
import type { FormattedMessageType } from '../../../services/chat'

export const useChatScroll = (messages: FormattedMessageType[], streamingMessage: string) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    if (messages.length > 0 || streamingMessage) {
      setTimeout(scrollToBottom, 50)
    }
  }, [messages, streamingMessage])

  return {
    messagesEndRef,
    scrollToBottom
  }
}
