import { Listbox, ListboxItem, ListboxSection } from '@heroui/react'
import { Button } from '@heroui/react'

import { ScrollShadow } from '@heroui/react'
import { Icon } from '@iconify/react/dist/iconify.js'
import { SidebarRecentChatOptions } from './chat-options'
import { AvatarDropdown } from './avatar-dropdown'

export default function SidebarBody() {
  return (
    <>
      <AvatarDropdown />

      <ScrollShadow className='-mr-6 h-full max-h-full pr-6'>
        <Button
          fullWidth
          className='mb-6 mt-2 h-[44px] justify-start gap-3 bg-default-foreground px-3 py-[10px] text-default-50'
          startContent={
            <Icon className='text-default-50' icon='solar:chat-round-dots-linear' width={24} />
          }
        >
          New Chat
        </Button>

        <Listbox aria-label='Recent chats' variant='flat'>
          <ListboxSection
            classNames={{
              base: 'py-0',
              heading: 'py-0 pl-[10px] text-small text-default-400'
            }}
            title='Recent'
          >
            <ListboxItem
              key='financial-planning'
              className='group h-[44px] px-[12px] py-[10px] text-default-500'
              endContent={<SidebarRecentChatOptions />}
            >
              Financial Planning
            </ListboxItem>
            <ListboxItem
              key='email-template'
              className='h-[44px] px-[12px] py-[10px] text-default-500'
              endContent={<SidebarRecentChatOptions />}
            >
              Email template
            </ListboxItem>
            <ListboxItem
              key='react-19-example'
              className='h-[44px] px-[12px] py-[10px] text-default-500'
              endContent={<SidebarRecentChatOptions />}
            >
              React 19 examples
            </ListboxItem>
            <ListboxItem
              key='custom-support-message'
              className='h-[44px] px-[12px] py-[10px] text-default-500'
              endContent={<SidebarRecentChatOptions />}
            >
              Custom support message
            </ListboxItem>
            <ListboxItem
              key='resignation-letter'
              className='h-[44px] px-[12px] py-[10px] text-default-500'
              endContent={<SidebarRecentChatOptions />}
            >
              Resignation Letter
            </ListboxItem>
            <ListboxItem
              key='design-test-review'
              className='h-[44px] px-[12px] py-[10px] text-default-500'
              endContent={<SidebarRecentChatOptions />}
            >
              Design test review
            </ListboxItem>
            <ListboxItem
              key='design-system-modules'
              className='h-[44px] px-[12px] py-[10px] text-default-500'
              endContent={<SidebarRecentChatOptions />}
            >
              Design systems modules
            </ListboxItem>
            <ListboxItem
              key='how-a-taximeter-works'
              className='h-[44px] px-[12px] py-[10px] text-default-500'
              endContent={<SidebarRecentChatOptions />}
            >
              How a taximeter works
            </ListboxItem>
            <ListboxItem
              key='show-more'
              className='h-[44px] px-[12px] py-[10px] text-default-400'
              endContent={
                <Icon className='text-default-300' icon='solar:alt-arrow-down-linear' width={20} />
              }
            >
              Show more
            </ListboxItem>
          </ListboxSection>
        </Listbox>
      </ScrollShadow>
    </>
  )
}
