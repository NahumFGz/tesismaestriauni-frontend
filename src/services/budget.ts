import { isAxiosError } from 'axios'
import api from './config/axios'
import { z } from 'zod'

export const BudgetSchema = z.object({
  id: z.string(),
  ruc: z.string(),
  nombre: z.string(),
  fecha_inicio_actividades: z.string().nullable(),
  monto_total: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const BudgetMetaSchema = z.object({
  page: z.number(),
  take: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean()
})

export const BudgetResponseSchema = z.object({
  data: z.array(BudgetSchema),
  meta: BudgetMetaSchema
})

export type BudgetType = z.infer<typeof BudgetSchema>
export type BudgetMetaType = z.infer<typeof BudgetMetaSchema>
export type BudgetResponseType = z.infer<typeof BudgetResponseSchema>

export const getBudget = async ({
  page = 1,
  take = 10,
  search = ''
}: {
  page?: number
  take?: number
  search?: string
}): Promise<BudgetResponseType> => {
  try {
    const params: Record<string, string | number> = { page, take }

    if (search.trim()) {
      params.search = search.trim()
    }

    const response = await api.get<BudgetResponseType>('/documents/budget', {
      params
    })

    const parsed = BudgetResponseSchema.parse(response.data)
    return parsed
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Error al obtener datos de presupuesto')
    } else {
      throw new Error('Error desconocido al obtener datos de presupuesto')
    }
  }
}
