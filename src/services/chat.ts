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

// Esquema para los mensajes recibidos de la API
export const MessageSchema = z.object({
  id: z.number(),
  sender_type: z.enum(['USER', 'SYSTEM']),
  content: z.string()
})

export const MessageListSchema = z.array(MessageSchema)

export type MessageType = z.infer<typeof MessageSchema>

// Tipo para los mensajes formateados como en messagingChatAIConversations
export type FormattedMessageType = {
  avatar: string
  message: string
  name: string
  isRTL: boolean
}

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

    const response = await api.get<ChatType[]>(`/messages/chats/${user_id}`, {
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

export const getMessagesByUuid = async (chat_uuid: string): Promise<FormattedMessageType[]> => {
  try {
    const user_id = useAuthStore.getState().profile!.id

    const response = await api.get<MessageType[]>(`/messages/by-chat/${user_id}`, {
      params: { chat_uuid }
    })

    const parsed = MessageListSchema.parse(response.data)

    // Mapear los mensajes al formato requerido
    return parsed.map((message) => ({
      avatar:
        message.sender_type === 'USER'
          ? 'https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/avatars/3a906b3de8eaa53e14582edf5c918b5d.jpg'
          : 'https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/avatar_ai.png',
      message: message.content,
      name: message.sender_type === 'USER' ? 'You' : 'Acme AI',
      isRTL: message.sender_type === 'SYSTEM' // Los mensajes del sistema se muestran a la derecha
    }))
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Error al obtener mensajes')
    } else {
      throw new Error('Error desconocido al obtener mensajes')
    }
  }
}
