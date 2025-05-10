'use client'

import { useQuery } from '@tanstack/react-query'
import { Listbox, ListboxItem, ListboxSection, ScrollShadow, Button, Spinner } from '@heroui/react'
import { Icon } from '@iconify/react/dist/iconify.js'
import { SidebarRecentChatOptions } from './chat-options'
import { AvatarDropdown } from './avatar-dropdown'
import { Loading } from '../../../components/ui/Loading'
import { getChats, type ChatType } from '../../../services/chat'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function SidebarBody() {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState({ page: 1, take: 10 })
  const [accumulatedChats, setAccumulatedChats] = useState<ChatType[]>([])
  const [loadingMore, setLoadingMore] = useState(false)

  const {
    data: chats,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['chats', pagination.page, pagination.take],
    queryFn: () => getChats({ page: pagination.page, take: pagination.take }),
    retry: 2
  })

  useEffect(() => {
    //TODO: Revisar cuando se haya implementado la metadata de la paginación
    if (chats && !isLoading) {
      setAccumulatedChats((prevChats) => {
        const existingIds = new Set(prevChats.map((chat) => chat.chat_uuid))
        const newChats = chats.filter((chat) => !existingIds.has(chat.chat_uuid))
        return [...prevChats, ...newChats]
      })
      setLoadingMore(false)
    }
  }, [chats, isLoading])

  const handleLoadMore = () => {
    setLoadingMore(true)
    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
    // No es necesario llamar a refetch() ya que el cambio en pagination.page
    // provocará que React Query realice automáticamente una nueva solicitud
  }

  return (
    <>
      <AvatarDropdown />

      <ScrollShadow className='-mr-6 h-full max-h-full pr-6'>
        <Button
          fullWidth
          onPress={() => navigate('/chat/conversation')}
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
            {isLoading && accumulatedChats.length === 0 ? (
              <ListboxItem key='loading' className='text-default-400' textValue='Cargando...'>
                <Loading />
              </ListboxItem>
            ) : isError ? (
              <ListboxItem key='error' className='text-danger'>
                Error al cargar chats
              </ListboxItem>
            ) : accumulatedChats.length > 0 ? (
              <>
                {accumulatedChats.map((chat) => (
                  <ListboxItem
                    key={chat.chat_uuid}
                    onPress={() => navigate(`/chat/conversation/${chat.chat_uuid}`)}
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
              onPress={handleLoadMore}
              endContent={
                loadingMore ? (
                  <Spinner size='sm' />
                ) : (
                  <Icon
                    className='text-default-300'
                    icon='solar:alt-arrow-down-linear'
                    width={20}
                  />
                )
              }
            >
              Mostrar más
            </ListboxItem>
          </ListboxSection>
        </Listbox>
      </ScrollShadow>
    </>
  )
}
