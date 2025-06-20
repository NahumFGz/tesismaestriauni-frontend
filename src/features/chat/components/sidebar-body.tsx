'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Listbox, ListboxItem, ListboxSection, ScrollShadow, Button, Spinner } from '@heroui/react'
import { Icon } from '@iconify/react/dist/iconify.js'
import { SidebarRecentChatOptions } from './chat-options'
import { AvatarDropdown } from './avatar-dropdown'
import { Loading } from '../../../components/ui/Loading'
import { getChats, type ChatType } from '../../../services/chat'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

export default function SidebarBody() {
  const navigate = useNavigate()
  const { chat_uuid } = useParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState({ page: 1, take: 10 })
  const [accumulatedChats, setAccumulatedChats] = useState<ChatType[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const isFirstLoad = useRef(true)

  const {
    data: chats,
    isLoading,
    isError,
    dataUpdatedAt
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

  // Efecto para manejar los chats cuando llegan nuevos datos o se invalidan
  useEffect(() => {
    if (chats && !isLoading) {
      // Si es la primera página, resetear completamente el estado acumulado
      if (pagination.page === 1) {
        console.log(
          '[SidebarBody] Página 1 cargada/actualizada, reseteando chats acumulados:',
          chats.length
        )
        setAccumulatedChats(
          chats.sort((a, b) => {
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          })
        )
        isFirstLoad.current = false
      } else {
        // Para páginas siguientes, acumular los chats nuevos
        setAccumulatedChats((prevChats) => {
          const existingIds = new Set(prevChats.map((chat) => chat.chat_uuid))
          const newChats = chats.filter((chat) => !existingIds.has(chat.chat_uuid))

          // Ordenamos los chats por fecha de actualización (más recientes primero)
          const allChats = [...prevChats, ...newChats]
          allChats.sort((a, b) => {
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          })

          return allChats
        })
      }
      setLoadingMore(false)
    }
  }, [chats, isLoading, pagination.page, dataUpdatedAt])

  // Efecto para resetear paginación cuando hay invalidaciones externas
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event?.type === 'updated' &&
        event.query.queryKey[0] === 'chats' &&
        event.query.queryKey[1] === 1 && // Solo para página 1
        pagination.page > 1
      ) {
        // Solo si estamos en páginas posteriores
        console.log(
          '[SidebarBody] Query de chats página 1 invalidada externamente, reseteando paginación'
        )
        setPagination({ page: 1, take: 10 })
        setAccumulatedChats([]) // Limpiar estado para forzar refresh
      }
    })

    return unsubscribe
  }, [queryClient, pagination.page])

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
