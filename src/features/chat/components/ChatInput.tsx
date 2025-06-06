import { PromptInputWithEnclosedActions } from './prompt-input-with-enclosed-actions'

interface ChatInputProps {
  prompt: string
  onPromptChange: (value: string) => void
  onSendPrompt: () => void
  onAddFile: () => void
  disabled: boolean
}

export const ChatInput = ({
  prompt,
  onPromptChange,
  onSendPrompt,
  onAddFile,
  disabled
}: ChatInputProps) => {
  return (
    <div className='sticky bottom-0 mt-auto flex max-w-full flex-col gap-2 px-6 pb-6 bg-default-50 z-10'>
      <PromptInputWithEnclosedActions
        classNames={{
          button: 'bg-default-foreground opacity-100 w-[30px] h-[30px] !min-w-[30px] self-center',
          buttonIcon: 'text-background',
          input: 'placeholder:text-default-500',
          innerWrapper: 'items-center'
        }}
        placeholder='Send a message to AcmeAI'
        prompt={prompt}
        onPromptChange={onPromptChange}
        onSendPrompt={onSendPrompt}
        onAddFile={onAddFile}
        disabled={disabled}
      />
      <p className='px-2 text-center text-small font-medium leading-5 text-default-500'>
        AcmeAI can make mistakes. Check important info.
      </p>
    </div>
  )
}
