import { isAxiosError } from 'axios'
import api from './config/axios'
import { z } from 'zod'

export const ProcurementSchema = z.object({
  id: z.string(),
  ruc: z.string(),
  nombre: z.string(),
  fecha_inicio_actividades: z.string().nullable(),
  monto_total: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const ProcurementMetaSchema = z.object({
  page: z.number(),
  take: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean()
})

export const ProcurementResponseSchema = z.object({
  data: z.array(ProcurementSchema),
  meta: ProcurementMetaSchema
})

export type ProcurementType = z.infer<typeof ProcurementSchema>
export type ProcurementMetaType = z.infer<typeof ProcurementMetaSchema>
export type ProcurementResponseType = z.infer<typeof ProcurementResponseSchema>

export const getProcurement = async ({
  page = 1,
  take = 10,
  search = ''
}: {
  page?: number
  take?: number
  search?: string
}): Promise<ProcurementResponseType> => {
  try {
    const params: Record<string, string | number> = { page, take }

    if (search.trim()) {
      params.search = search.trim()
    }

    const response = await api.get<ProcurementResponseType>('/documents/procurement', {
      params
    })

    const parsed = ProcurementResponseSchema.parse(response.data)
    return parsed
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Error al obtener datos de procurement')
    } else {
      throw new Error('Error desconocido al obtener datos de procurement')
    }
  }
}
