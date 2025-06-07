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
  Spinner,
  Select,
  SelectItem
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { getBudget, type BudgetType } from '../../../services/budget'

export function BudgetPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [take, setTake] = useState(30)

  // Debounce effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page when searching
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [search])

  const {
    data: budgetData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['budget', page, take, debouncedSearch],
    queryFn: () => getBudget({ page, take, search: debouncedSearch }),
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

  const formatNumber = (amount: string) => {
    const num = parseFloat(amount)
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2
    }).format(num)
  }

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className='h-full flex flex-col p-6'>
      {/* Search Bar and Page Size Selector */}
      <div className='flex gap-4 items-end mb-4'>
        <div className='flex-1 max-w-md'>
          <Input
            isClearable
            placeholder='Buscar por RUC o nombre de entidad'
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
            <SelectItem key='20'>20</SelectItem>
            <SelectItem key='30'>30</SelectItem>
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
          aria-label='Tabla de presupuesto'
          removeWrapper
          isHeaderSticky
          classNames={{
            table: 'min-h-[200px]'
          }}
        >
          <TableHeader>
            <TableColumn key='ruc' width={150}>
              RUC
            </TableColumn>
            <TableColumn key='nombre'>NOMBRE DE ENTIDAD</TableColumn>
            <TableColumn key='monto_total' align='end' width={200}>
              MONTO TOTAL (S/)
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
                'No se encontraron datos de presupuesto'
              )
            }
          >
            {(budgetData?.data || []).map((item: BudgetType) => (
              <TableRow key={item.id}>
                <TableCell>{item.ruc}</TableCell>
                <TableCell>
                  <div title={item.nombre}>{truncateText(item.nombre)}</div>
                </TableCell>
                <TableCell>
                  <div className='text-right'>{formatNumber(item.monto_total)}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {budgetData?.meta && budgetData.meta.totalPages > 1 && (
        <div className='flex justify-center'>
          <Pagination
            total={budgetData.meta.totalPages}
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
