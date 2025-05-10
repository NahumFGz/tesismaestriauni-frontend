import { isAxiosError } from 'axios'
import api from './config/axios'

type Chat = {
  id: number
  title: string
  chat_uuid: string
  updated_at: string
}

type GetChatsPayload = {
  user_id: number
  page: number
  take: number
}

export const getChats = async (payload: GetChatsPayload): Promise<Chat[]> => {
  try {
    //Simular un delay de 2 segundos
    await new Promise((resolve) => setTimeout(resolve, 500))
    const response = await api.post<Chat[]>('/messages/chats', payload)
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Error al obtener chats')
    } else {
      throw new Error('Error desconocido al obtener chats')
    }
  }
}
