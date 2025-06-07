import { isAxiosError } from 'axios'
import api from './config/axios'
import { z } from 'zod'

export const VotingSchema = z.object({
  id: z.string(),
  asunto: z.string(),
  presidente: z.string(),
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

export const VotingMetaSchema = z.object({
  page: z.number(),
  take: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean()
})

export const VotingResponseSchema = z.object({
  data: z.array(VotingSchema),
  meta: VotingMetaSchema
})

export type VotingType = z.infer<typeof VotingSchema>
export type VotingMetaType = z.infer<typeof VotingMetaSchema>
export type VotingResponseType = z.infer<typeof VotingResponseSchema>

export const getVoting = async ({
  page = 1,
  take = 10,
  search = ''
}: {
  page?: number
  take?: number
  search?: string
}): Promise<VotingResponseType> => {
  try {
    const params: Record<string, string | number> = { page, take }

    if (search.trim()) {
      params.search = search.trim()
    }

    const response = await api.get<VotingResponseType>('/documents/voting', {
      params
    })

    const parsed = VotingResponseSchema.parse(response.data)
    return parsed
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Error al obtener datos de votación')
    } else {
      throw new Error('Error desconocido al obtener datos de votación')
    }
  }
}
