import { isAxiosError } from 'axios'
import api from './config/axios'
import { z } from 'zod'

export const AttendanceSchema = z.object({
  id: z.string(),
  fecha: z.string(),
  legislatura: z.string(),
  periodo_congreso_inicio: z.number(),
  periodo_congreso_fin: z.number(),
  periodo_anual_inicio: z.number(),
  periodo_anual_fin: z.number(),
  n_legislatura: z.number(),
  url: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const AttendanceMetaSchema = z.object({
  page: z.number(),
  take: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean()
})

export const AttendanceResponseSchema = z.object({
  data: z.array(AttendanceSchema),
  meta: AttendanceMetaSchema
})

export type AttendanceType = z.infer<typeof AttendanceSchema>
export type AttendanceMetaType = z.infer<typeof AttendanceMetaSchema>
export type AttendanceResponseType = z.infer<typeof AttendanceResponseSchema>

export const getAttendance = async ({
  page = 1,
  take = 10,
  search = ''
}: {
  page?: number
  take?: number
  search?: string
}): Promise<AttendanceResponseType> => {
  try {
    const params: Record<string, string | number> = { page, take }

    if (search.trim()) {
      params.search = search.trim()
    }

    const response = await api.get<AttendanceResponseType>('/documents/attendance', {
      params
    })

    const parsed = AttendanceResponseSchema.parse(response.data)
    return parsed
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Error al obtener datos de asistencia')
    } else {
      throw new Error('Error desconocido al obtener datos de asistencia')
    }
  }
}
