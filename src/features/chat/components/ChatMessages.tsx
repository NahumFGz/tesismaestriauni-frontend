import { ScrollShadow, Spinner } from '@heroui/react'
import MessagingChatMessage from './messaging-chat-message'
import { NewChat } from './new-chat'
import { Loading } from '../../../components/ui/Loading'
import type { FormattedMessageType } from '../../../services/chat'

interface ChatMessagesProps {
  chatUuid?: string
  displayMessages: FormattedMessageType[]
  isChangingChat: boolean
  isSending: boolean
  streamingMessage: string
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  navigatingRef: React.MutableRefObject<boolean>
}

const WaitingResponseSpinner = ({
  isSending,
  streamingMessage,
  navigatingRef
}: {
  isSending: boolean
  streamingMessage: string
  navigatingRef: React.MutableRefObject<boolean>
}) => {
  if (!isSending || streamingMessage || navigatingRef.current) return null

  return (
    <div className='flex items-center gap-2 px-4 py-2 rounded-lg bg-default-100 mb-2'>
      <Spinner size='sm' color='primary' variant='wave' />
      <span className='text-small text-default-600'>Acme AI está escribiendo...</span>
    </div>
  )
}

export const ChatMessages = ({
  chatUuid,
  displayMessages,
  isChangingChat,
  isSending,
  streamingMessage,
  messagesEndRef,
  navigatingRef
}: ChatMessagesProps) => {
  return (
    <ScrollShadow className='flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-12' hideScrollBar>
      {chatUuid ? (
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
            <WaitingResponseSpinner
              isSending={isSending}
              streamingMessage={streamingMessage}
              navigatingRef={navigatingRef}
            />
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className='text-center text-default-500'>No hay mensajes en esta conversación</div>
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
              <WaitingResponseSpinner
                isSending={isSending}
                streamingMessage={streamingMessage}
                navigatingRef={navigatingRef}
              />
              <div ref={messagesEndRef} />
            </div>
          )}
        </>
      )}
    </ScrollShadow>
  )
}
