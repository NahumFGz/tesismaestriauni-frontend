'use client'
import type { MessagingChatMessageProps } from '../constants/data'

import React, { useCallback } from 'react'
import { Avatar, Image } from '@heroui/react'
import { cn } from '@heroui/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

const MessagingChatMessage = React.forwardRef<HTMLDivElement, MessagingChatMessageProps>(
  ({ avatar, name, time, message, isRTL, imageUrl, className, classNames, ...props }, ref) => {
    const messageRef = React.useRef<HTMLDivElement>(null)

    const MessageAvatar = useCallback(
      () => (
        <div className='relative flex-none'>
          <Avatar src={avatar} />
        </div>
      ),
      [avatar]
    )

    const Message = () => (
      <div className='flex max-w-[70%] flex-col gap-4'>
        <div
          className={cn(
            'relative w-full rounded-medium bg-content2 px-4 py-3 text-default-600',
            classNames?.base
          )}
        >
          <div className='flex'>
            <div className='w-full text-small font-semibold text-default-foreground'>{name}</div>
            <div className='flex-end text-small text-default-400'>{time}</div>
          </div>
          <div ref={messageRef} className='mt-2 text-small text-default-900'>
            {isRTL ? (
              <div className='prose prose-sm max-w-none dark:prose-invert prose-pre:bg-gray-100 prose-pre:text-gray-800 dark:prose-pre:bg-gray-800 dark:prose-pre:text-gray-200 prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-pre:p-2 prose-pre:rounded-md prose-pre:text-xs prose-p:my-1 prose-headings:mt-2 prose-headings:mb-1'>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    a: (props) => <a target='_blank' rel='noopener noreferrer' {...props} />
                  }}
                >
                  {message}
                </ReactMarkdown>
              </div>
            ) : (
              <div className='whitespace-pre-line'>{message}</div>
            )}
            {imageUrl && (
              <Image
                alt={`Image sent by ${name}`}
                className='mt-2 border-2 border-default-200 shadow-small'
                src={imageUrl}
                width={264}
                height={96}
              />
            )}
          </div>
        </div>
      </div>
    )

    return (
      <div
        {...props}
        ref={ref}
        className={cn('flex gap-3', { 'flex-row-reverse': isRTL }, className)}
      >
        <MessageAvatar />
        <Message />
      </div>
    )
  }
)

MessagingChatMessage.displayName = 'MessagingChatMessage'

export default MessagingChatMessage
