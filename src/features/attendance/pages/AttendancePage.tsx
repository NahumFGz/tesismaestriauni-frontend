import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { getAttendance, type AttendanceType } from '../../../services/attendance'

export function AttendancePage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [take, setTake] = useState(20)

  // Debounce effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page when searching
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [search])

  const {
    data: attendanceData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['attendance', page, take, debouncedSearch],
    queryFn: () => getAttendance({ page, take, search: debouncedSearch }),
    retry: 2,
    refetchOnWindowFocus: false
  })

  const handleSearch = (value: string) => {
    setSearch(value)
  }

  const handleTakeChange = (value: string) => {
    setTake(Number(value))
    setPage(1) // Reset to first page when changing page size
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0] // Format as yyyy-mm-dd
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
            placeholder='Buscar por fecha (ej: 2022-12-29) o legislatura'
            value={search}
            onValueChange={handleSearch}
            startContent={
              <Icon icon='solar:magnifer-linear' className='text-default-400' width={20} />
            }
            variant='bordered'
          />
        </div>

        <div className='flex items-center gap-2 whitespace-nowrap'>
          <span className='text-small text-default-600'>Elementos:</span>
          <Select
            selectedKeys={[take.toString()]}
            onSelectionChange={(keys) => {
              const selectedValue = Array.from(keys)[0] as string
              handleTakeChange(selectedValue)
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
          aria-label='Tabla de asistencia'
          removeWrapper
          isHeaderSticky
          classNames={{
            table: 'min-h-[200px]'
          }}
        >
          <TableHeader>
            <TableColumn key='fecha'>FECHA</TableColumn>
            <TableColumn key='legislatura'>LEGISLATURA</TableColumn>
            <TableColumn key='periodo_anual_inicio'>PERÍODO ANUAL</TableColumn>
            <TableColumn key='url' align='center'>
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
                'No se encontraron datos de asistencia'
              )
            }
          >
            {(attendanceData?.data || []).map((item: AttendanceType) => (
              <TableRow key={item.id}>
                <TableCell>{formatDate(item.fecha)}</TableCell>
                <TableCell>{item.legislatura}</TableCell>
                <TableCell>{item.periodo_anual_inicio}</TableCell>
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
      {attendanceData?.meta && attendanceData.meta.totalPages > 1 && (
        <div className='flex justify-center'>
          <Pagination
            total={attendanceData.meta.totalPages}
            page={page}
            onChange={setPage}
            showControls
            showShadow
            color='primary'
          />
        </div>
      )}
    </div>
  )
}
