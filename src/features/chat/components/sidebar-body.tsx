'use client'

import { useQuery } from '@tanstack/react-query'
import { Listbox, ListboxItem, ListboxSection, ScrollShadow, Button, Spinner } from '@heroui/react'
import { Icon } from '@iconify/react/dist/iconify.js'
import { SidebarRecentChatOptions } from './chat-options'
import { AvatarDropdown } from './avatar-dropdown'
import { Loading } from '../../../components/ui/Loading'
import { getChats, type ChatType } from '../../../services/chat'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { sortByDateDesc } from '../utils'

export default function SidebarBody() {
  const navigate = useNavigate()
  const { chat_uuid } = useParams()
  const location = useLocation()
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
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60
  })

  // Actualizar lista cuando llegan nuevos datos
  useEffect(() => {
    if (!chats || isLoading) return

    setAccumulatedChats((prev) => {
      // Si es primera página, reemplazar; si es paginación continuar acumulando
      if (pagination.page === 1) return [...chats].sort(sortByDateDesc)

      const existingIds = new Set(prev.map((c) => c.chat_uuid))
      const merged = [...prev, ...chats.filter((c) => !existingIds.has(c.chat_uuid))]
      return merged.sort(sortByDateDesc)
    })
    setLoadingMore(false)
  }, [chats, isLoading, pagination.page])

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

        <Listbox aria-label='Tools and Recent chats' variant='flat'>
          <ListboxSection
            classNames={{
              base: 'py-0',
              heading: 'py-0 pl-[10px] text-small text-default-400'
            }}
            title='Tools'
          >
            <ListboxItem
              key='budget'
              onPress={() => navigate('/budget')}
              className={`h-[36px] px-[12px] py-[6px] ${
                location.pathname === '/budget'
                  ? 'bg-content3 text-content1-foreground'
                  : 'text-default-500'
              }`}
              startContent={
                <Icon className='text-default-400' icon='solar:wallet-money-linear' width={20} />
              }
            >
              Budget
            </ListboxItem>

            <ListboxItem
              key='attendance'
              onPress={() => navigate('/attendance')}
              className={`h-[36px] px-[12px] py-[6px] ${
                location.pathname === '/attendance'
                  ? 'bg-content3 text-content1-foreground'
                  : 'text-default-500'
              }`}
              startContent={
                <Icon className='text-default-400' icon='solar:calendar-mark-linear' width={20} />
              }
            >
              Attendance
            </ListboxItem>

            <ListboxItem
              key='voting'
              onPress={() => navigate('/voting')}
              className={`h-[36px] px-[12px] py-[6px] ${
                location.pathname === '/voting'
                  ? 'bg-content3 text-content1-foreground'
                  : 'text-default-500'
              }`}
              startContent={
                <Icon className='text-default-400' icon='solar:check-square-linear' width={20} />
              }
            >
              Voting
            </ListboxItem>
          </ListboxSection>
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
                    className={`group h-[44px] px-[12px] py-[10px] ${
                      chat.chat_uuid === chat_uuid
                        ? 'bg-content3 text-content1-foreground'
                        : 'text-default-500'
                    }`}
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
