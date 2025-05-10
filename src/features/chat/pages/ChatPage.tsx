import { ScrollShadow } from '@heroui/react'

import { SidebarContainer } from '../components/sidebar'
import { PromptInputWithEnclosedActions } from '../components/prompt-input-with-enclosed-actions'
import { SidebarContainerHeader } from '../components/sidebar-container-header'

import MessagingChatMessage from '../components/messaging-chat-message'
import { useParams } from 'react-router-dom'
import { NewChat } from '../components/new-chat'
import { useQuery } from '@tanstack/react-query'
import { getMessagesByUuid } from '../../../services/chat'
import { Loading } from '../../../components/ui/Loading'
import { useEffect, useRef } from 'react'

export function ChatPage() {
  const { chat_uuid } = useParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', chat_uuid],
    queryFn: () => getMessagesByUuid(chat_uuid!),
    enabled: !!chat_uuid,
    retry: false,
    refetchOnWindowFocus: false
  })

  // Función para desplazarse al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Desplazarse al final cuando cambian los mensajes o se carga la página
  useEffect(() => {
    if (!isLoading && messages) {
      scrollToBottom()
    }
  }, [messages, isLoading])

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
              isLoading ? (
                <div className='flex justify-center items-center h-full'>
                  <Loading />
                </div>
              ) : messages && messages.length > 0 ? (
                <>
                  {messages.map((message, idx) => (
                    <MessagingChatMessage
                      key={idx}
                      classNames={{
                        base: 'bg-default-50'
                      }}
                      {...message}
                    />
                  ))}
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
                input: 'placeholder:text-default-500'
              }}
              placeholder='Send a message to AcmeAI'
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
