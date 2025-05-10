'use client'

import { useQuery } from '@tanstack/react-query'
import { Listbox, ListboxItem, ListboxSection, ScrollShadow, Button } from '@heroui/react'
import { Icon } from '@iconify/react/dist/iconify.js'
import { SidebarRecentChatOptions } from './chat-options'
import { AvatarDropdown } from './avatar-dropdown'
import { getChats } from '../../../services/chat'
import Loading from '../../../components/ui/Loading'

export default function SidebarBody() {
  const {
    data: chats,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['chats', 1, 1, 10],
    queryFn: () => getChats({ user_id: 1, page: 1, take: 10 })
  })

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
            {isLoading ? (
              <ListboxItem key='loading' className='text-default-400' textValue='Cargando...'>
                <Loading />
              </ListboxItem>
            ) : isError ? (
              <ListboxItem key='error' className='text-danger'>
                Error al cargar chats
              </ListboxItem>
            ) : chats && chats.length > 0 ? (
              <>
                {chats.map((chat) => (
                  <ListboxItem
                    key={chat.chat_uuid}
                    onPress={() => console.log(chat.chat_uuid)}
                    className='group h-[44px] px-[12px] py-[10px] text-default-500'
                    endContent={<SidebarRecentChatOptions />}
                  >
                    {chat.title || 'Sin título'}
                  </ListboxItem>
                ))}
              </>
            ) : (
              <ListboxItem key='no-chats' className='text-default-400'>
                No hay chats recientes
              </ListboxItem>
            )}

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
