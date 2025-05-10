import { ScrollShadow } from '@heroui/react'

import { SidebarContainer } from '../components/sidebar'
import { PromptInputWithEnclosedActions } from '../components/prompt-input-with-enclosed-actions'
import { SidebarContainerHeader } from '../components/sidebar-container-header'

import MessagingChatMessage from '../components/messaging-chat-message'
import messagingChatAIConversations from '../components/messaging-chat-ai-conversations'

export function ChatPage() {
  return (
    <div className='h-dvh w-full max-w-full'>
      <SidebarContainer
        header={<SidebarContainerHeader />}
        subTitle='Today'
        title='Apply for launch promotion'
      >
        <div className='relative flex h-full flex-col'>
          <ScrollShadow className='flex h-full max-h-[60vh] flex-col gap-6 overflow-y-auto p-6 pb-8 '>
            {messagingChatAIConversations.map((messagingChatAIConversation, idx) => (
              <MessagingChatMessage
                key={idx}
                classNames={{
                  base: 'bg-default-50'
                }}
                {...messagingChatAIConversation}
              />
            ))}
          </ScrollShadow>
          <div className='mt-auto flex max-w-full flex-col gap-2 px-6'>
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
