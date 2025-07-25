import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Button,
  Spinner,
  Select,
  SelectItem
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { getVoting, type VotingType } from '../../../services/voting'
import { formatDateToISO, truncateText } from '../../../utils/format'

export function VotingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Valores derivados directamente de la URL para la query
  const currentPage = Number(searchParams.get('page')) || 1
  const currentTake = Number(searchParams.get('take')) || 10
  const currentSearch = searchParams.get('search') || ''

  // Estado local independiente para el input de búsqueda (mantiene espacios mientras el usuario escribe)
  const [searchInput, setSearchInput] = useState(currentSearch)

  // Ref para el timer de debounce
  const debounceTimerRef = useRef<number | null>(null)

  // Ref para mantener los metadatos de paginación durante loading
  const lastMetaRef = useRef<{ totalPages: number } | null>(null)

  // Función para actualizar la URL con los parámetros actuales
  const updateURL = (searchValue: string, newPage: number, newTake: number) => {
    const params = new URLSearchParams()

    // Solo aplicamos trim cuando actualizamos la URL, no en el input
    const trimmedSearch = searchValue.trim()

    if (trimmedSearch) {
      params.set('search', trimmedSearch)
    }
    if (newPage > 1) {
      params.set('page', newPage.toString())
    }
    if (newTake !== 10) {
      params.set('take', newTake.toString())
    }

    navigate(`/voting${params.toString() ? `?${params.toString()}` : ''}`, { replace: true })
  }

  // Manejar cambios en el input de búsqueda
  const handleSearchChange = (value: string) => {
    // Actualizar el estado del input inmediatamente (sin trim)
    setSearchInput(value)

    // Limpiar el timer anterior
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current)
    }

    // Configurar nuevo timer para actualizar la URL
    debounceTimerRef.current = window.setTimeout(() => {
      lastMetaRef.current = null // Resetear metadatos cuando cambia el search
      updateURL(value, 1, currentTake) // Reset to first page when searching
    }, 300)
  }

  // Sincronizar searchInput solo cuando la URL cambia desde fuera (ej: navegación)
  useEffect(() => {
    // Solo sincronizar si el valor trimmed es diferente
    if (currentSearch !== searchInput.trim()) {
      setSearchInput(currentSearch)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSearch])

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const {
    data: votingData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['voting', currentPage, currentTake, currentSearch],
    queryFn: () => getVoting({ page: currentPage, take: currentTake, search: currentSearch }),
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60
  })

  // Actualizar los metadatos cuando tengamos datos
  if (votingData?.meta) {
    lastMetaRef.current = { totalPages: votingData.meta.totalPages }
  }

  const openImage = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <div className='h-full flex flex-col p-6'>
      {/* Search Bar and Page Size Selector */}
      <div className='flex gap-4 items-end mb-4'>
        <div className='flex-1 max-w-md'>
          <Input
            isClearable
            placeholder='Buscar por fecha (ej: 2022-01-31) o asunto'
            value={searchInput}
            onValueChange={handleSearchChange}
            startContent={
              <Icon icon='solar:magnifer-linear' className='text-default-400' width={20} />
            }
            variant='bordered'
          />
        </div>

        <div className='flex items-center gap-2 whitespace-nowrap'>
          <span className='text-small text-default-600'>Elementos:</span>
          <Select
            selectedKeys={[currentTake.toString()]}
            onSelectionChange={(keys) => {
              const newTake = Number(Array.from(keys)[0])
              updateURL(currentSearch, 1, newTake)
            }}
            variant='bordered'
            size='md'
            className='w-20'
            aria-label='Seleccionar cantidad de elementos'
          >
            <SelectItem key='10'>10</SelectItem>
            <SelectItem key='20'>20</SelectItem>
            <SelectItem key='50'>50</SelectItem>
          </Select>
        </div>
      </div>

      {/* Table with fixed height */}
      <div
        className='mb-4 overflow-auto border border-default-200 rounded-lg'
        style={{ height: 'calc(100vh - 240px)' }}
      >
        <Table
          aria-label='Tabla de votaciones'
          removeWrapper
          isHeaderSticky
          classNames={{
            table: 'min-h-[200px]'
          }}
        >
          <TableHeader>
            <TableColumn key='fecha' width={120}>
              FECHA
            </TableColumn>
            <TableColumn key='asunto'>ASUNTO</TableColumn>
            <TableColumn key='presidente' width={200}>
              PRESIDENTE
            </TableColumn>
            <TableColumn key='legislatura' width={250}>
              LEGISLATURA
            </TableColumn>
            <TableColumn key='url' align='center' width={100}>
              DOCUMENTO
            </TableColumn>
          </TableHeader>
          <TableBody
            isLoading={isLoading}
            loadingContent={<Spinner label='Cargando datos...' />}
            emptyContent={
              isError ? (
                <div className='text-center text-danger'>
                  Error: {error?.message || 'Error al cargar datos'}
                </div>
              ) : (
                'No se encontraron datos de votación'
              )
            }
          >
            {(votingData?.data || []).map((item: VotingType) => (
              <TableRow key={item.id}>
                <TableCell>{formatDateToISO(item.fecha)}</TableCell>
                <TableCell>
                  <div className='text-small' title={item.asunto}>
                    {truncateText(item.asunto)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className='text-small' title={item.presidente}>
                    {truncateText(item.presidente, 30)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className='text-small' title={item.legislatura}>
                    {truncateText(item.legislatura, 40)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex justify-center'>
                    <Button
                      isIconOnly
                      size='sm'
                      variant='light'
                      onPress={() => openImage(item.url)}
                      className='text-primary'
                    >
                      <Icon icon='solar:eye-linear' width={18} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {lastMetaRef.current && lastMetaRef.current.totalPages > 1 && (
        <div className='flex justify-center'>
          <Pagination
            total={lastMetaRef.current.totalPages}
            page={currentPage}
            onChange={(newPage) => updateURL(currentSearch, newPage, currentTake)}
            showControls
            showShadow
            color='primary'
          />
        </div>
      )}
    </div>
  )
}
