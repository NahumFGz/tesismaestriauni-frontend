import { io, Socket } from 'socket.io-client'

// Creamos una única instancia del socket para toda la aplicación
let socket: Socket | null = null

// Interfaz para el mensaje a enviar
export interface GenerateMessageDTO {
  content: string
  chat_uuid: string
}

// Interfaz para la respuesta del servidor
export interface GeneratedResponse {
  id: number
  sender_type: 'SYSTEM' | 'USER'
  content: string
  chat_uuid: string
}

// Interfaz para los tokens de streaming
export interface StreamingTokenResponse {
  chat_uuid: string
  token: string
  is_complete: boolean
  full_message: string
}

// Interfaz para los eventos que recibimos del servidor
export interface ServerToClientEvents {
  generated: (data: GeneratedResponse) => void
  'stream.token': (token: string | { content: string } | StreamingTokenResponse) => void
  'stream.end': () => void
  'stream.error': (error: string) => void
}

// Interfaz para los eventos que enviamos al servidor
export interface ClientToServerEvents {
  generate: (
    dto: GenerateMessageDTO,
    callback: (ack: { success: boolean; message?: string }) => void
  ) => void
  'generate.streaming': (
    dto: GenerateMessageDTO,
    callback?: (ack: { success: boolean; message?: string }) => void
  ) => void
}

// Función para registrar mensajes de log
const logSocketEvent = (event: string, data?: unknown) => {
  const prefix = '[Socket.IO]'
  if (data) {
    console.log(`${prefix} ${event}:`, data)
  } else {
    console.log(`${prefix} ${event}`)
  }
}

// Función para obtener la instancia del socket, creándola si no existe
export const getSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
  if (!socket) {
    logSocketEvent('Creando nueva conexión de socket')
    socket = io(`${import.meta.env.VITE_BASE_API_URL}/chats`)

    // Registrar eventos de conexión
    socket.on('connect', () => {
      logSocketEvent('Conectado exitosamente', { id: socket?.id })
    })

    socket.on('disconnect', (reason) => {
      logSocketEvent('Desconectado', { reason })
    })

    socket.on('reconnect_attempt', (attempt) => {
      logSocketEvent('Intentando reconectar', { attempt })
    })

    socket.on('reconnect', (attempt) => {
      logSocketEvent('Reconectado exitosamente', { attempt })
    })

    socket.on('error', (error) => {
      logSocketEvent('Error de conexión', error)
    })
  }
  return socket
}

// Función para desconectar el socket
export const disconnectSocket = (): void => {
  if (socket) {
    logSocketEvent('Desconectando socket manualmente')
    socket.disconnect()
    socket = null
  }
}
