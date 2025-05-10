import { isAxiosError } from 'axios'
import api from './config/axios'

import { z } from 'zod'
import { useAuthStore } from '../store/authStore'

export const ChatSchema = z.object({
  id: z.number(),
  title: z.string().nullable(),
  chat_uuid: z.string(),
  updated_at: z.string()
})

export const ChatListSchema = z.array(ChatSchema)

export type ChatType = z.infer<typeof ChatSchema>

export const getChats = async ({
  page,
  take
}: {
  page: number
  take: number
}): Promise<ChatType[]> => {
  //TODO: Eliminar el delay
  //TODO: Revisar el backend para traer metadata de los elementos
  try {
    await new Promise((resolve) => setTimeout(resolve, 150))

    const user_id = useAuthStore.getState().profile!.id

    const response = await api.get<ChatType[]>(`/messages/${user_id}`, {
      params: { page, take }
    })

    const parsed = ChatListSchema.parse(response.data)

    return parsed
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Error al obtener chats')
    } else {
      throw new Error('Error desconocido al obtener chats')
    }
  }
}
