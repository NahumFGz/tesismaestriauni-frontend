# Chat con Streaming en Tiempo Real - Implementación Completa

## 📋 Resumen

Sistema de chat híbrido que combina **REST** y **Streaming** en tiempo real usando Socket.IO, con gestión inteligente de estado mediante React Query y hooks personalizados.

## 🎯 Características Principales

### ✨ **Dual Mode Chat**

- **🔄 Modo REST**: Mensajes completos instantáneos
- **⚡ Modo Streaming**: Tokens progresivos en tiempo real
- **🎛️ Switch dinámico**: Cambio entre modos sin recargar

### 🚀 **Optimizaciones Avanzadas**

- **💾 Cache inteligente**: React Query con 5 min de persistencia
- **🔄 Navegación instantánea**: Sin delay entre chats
- **📱 Actualizaciones optimistas**: UX fluida
- **🔗 Conexión persistente**: Socket.IO always-on

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Switch Control    │    │   Socket.IO         │    │   React Query       │
│                     │    │                     │    │                     │
│ ┌─ REST Mode ────┐  │    │ • generate          │◄──►│ • Cache (5 min)     │
│ └─ Streaming ──┐ │  │◄──►│ • generate.streaming│    │ • Invalidation      │
│               │ │  │    │ • stream.token      │    │ • Background sync   │
│               │ │  │    │ • stream.end        │    │                     │
│               │ │  │    │ • stream.error      │    │                     │
└───────────────┼─┼──┘    └─────────────────────┘    └─────────────────────┘
                │ │
                │ │       ┌─────────────────────┐    ┌─────────────────────┐
                │ └──────►│   Estado Local      │◄──►│   UI Components     │
                │         │                     │    │                     │
                └────────►│ • localMessages     │    │ • ChatMessages      │
                          │ • streamingMessage  │    │ • ChatInput         │
                          │ • isChangingChat    │    │ • WaitingSpinner    │
                          │ • navigatingRef     │    │                     │
                          └─────────────────────┘    └─────────────────────┘
```

## 🔧 Implementación de Hooks

### 📡 **useChatSocket - Gestión de Comunicación**

```typescript
interface UseChatSocketProps {
  chatUuid?: string
  onStreamingToken: (token: string, shouldReplace?: boolean) => void
  onMessageGenerated: (message: FormattedMessageType) => void
  onClearStreaming: () => void
  onStopSending: () => void
}

// Funciones retornadas
const {
  sendMessage, // Envío REST
  sendStreamingMessage, // Envío Streaming
  navigatingRef // Control de navegación
} = useChatSocket(props)
```

**Características clave:**

- ✅ **Navegación automática** para nuevos chats
- ✅ **Helpers centralizados** para evitar duplicación
- ✅ **Manejo robusto de errores** con logging
- ✅ **Conexión persistente** con reconexión automática

### 💾 **useChatMessages - Estado Híbrido**

```typescript
const {
  localMessages, // Mensajes del chat actual
  streamingMessage, // Mensaje en construcción
  isChangingChat, // Estado de transición
  loadMessages, // Cargar chat específico
  clearMessages, // Limpiar estado
  addMessage, // Agregar mensaje del usuario
  addStreamingMessage, // Finalizar streaming
  updateStreamingMessage, // Actualizar token por token
  clearStreamingMessage, // Limpiar streaming
  getDisplayMessages, // Mensajes para UI
  invalidateMessages // Invalidar cache
} = useChatMessages()
```

**Gestión inteligente de navegación y cache:**

```typescript
const loadMessages = useCallback(
  async (uuid: string) => {
    if (!uuid || currentChatUuid === uuid) return // ✅ Evita recargas innecesarias

    logger('messages', `Iniciando carga para chat: ${uuid}`)
    setIsChangingChat(true)
    setCurrentChatUuid(uuid)

    // Cache inteligente con React Query
    const cachedMessages = queryClient.getQueryData(['chat-messages', uuid])
    if (cachedMessages && cachedMessages.length > 0) {
      logger('messages', `Usando mensajes cacheados: ${cachedMessages.length}`)
      setLocalMessages(cachedMessages)
      setIsChangingChat(false)
    } else {
      // React Query maneja automáticamente el fetch cuando no hay cache
      setLocalMessages([])
    }
  },
  [logger, queryClient, currentChatUuid]
)

const updateStreamingMessage = useCallback((token: string, shouldReplace = false) => {
  if (shouldReplace) {
    setStreamingMessage(token) // Reemplazar mensaje completo
  } else {
    setStreamingMessage((prev) => prev + token) // Concatenar token
  }
}, [])
```

## 🔄 Flujos de Funcionamiento

### **🎯 Modo REST (Switch OFF)**

```
1. Usuario escribe: "Hola mundo"
     ↓
2. addMessage(userMessage) → Estado local
     ↓
3. sendMessage('generate', content, uuid)
     ↓
4. Socket.emit('generate', {content, chat_uuid})
     ↓
5. Socket.on('generated', response)
     ↓
6. onMessageGenerated(aiMessage) → Estado final
```

### **⚡ Modo Streaming (Switch ON)**

```
1. Usuario escribe: "Explica IA"
     ↓
2. addMessage(userMessage) → Estado local
     ↓
3. sendStreamingMessage('generate.streaming', content, uuid)
     ↓
4. Socket.emit('generate.streaming', {content, chat_uuid})
     ↓
5. Socket.on('stream.token', tokens...)
     ↓
   ┌─ Token 1: {token: "La", full_message: "La"}
   ├─ Token 2: {token: "IA", full_message: "La IA"}
   ├─ Token 3: {token: "es", full_message: "La IA es"}
   └─ Final:  {is_complete: true, full_message: "La IA es..."}
     ↓
6. onMessageGenerated(finalMessage) → Estado final
```

## 📡 Protocolo de Streaming

### **Eventos Socket.IO**

#### **📤 Cliente → Servidor**

```typescript
// REST
socket.emit('generate', {
  content: 'Hola',
  chat_uuid: 'uuid-123'
})

// Streaming
socket.emit('generate.streaming', {
  content: 'Hola',
  chat_uuid: 'uuid-123'
})
```

#### **📥 Servidor → Cliente**

**REST Response:**

```typescript
socket.on('generated', {
  id: 1,
  sender_type: 'SYSTEM',
  content: 'Hola, ¿cómo puedo ayudarte?',
  chat_uuid: 'uuid-123'
})
```

**Streaming Tokens:**

```typescript
// Token progresivo
socket.on('stream.token', {
  chat_uuid: 'uuid-123',
  token: 'Hola',
  is_complete: false,
  full_message: 'Hola'
})

// Token final
socket.on('stream.token', {
  chat_uuid: 'uuid-123',
  token: '',
  is_complete: true,
  full_message: 'Hola, ¿cómo puedo ayudarte?'
})

// Finalización
socket.on('stream.end')
```

## 🎛️ Control de Switch

### **Implementación del Switch**

```typescript
// ChatLayout.tsx - Estado global
const [isStreaming, setIsStreaming] = useState(false)

// SidebarContainerHeader.tsx - UI Control
<Switch
  size='sm'
  isSelected={isStreaming}
  onValueChange={setIsStreaming}
  classNames={{
    wrapper: "group-data-[selected=true]:bg-primary"
  }}
/>

// ChatPage.tsx - Lógica condicional
if (isStreaming) {
  sendStreamingMessage(prompt, chat_uuid)
} else {
  sendMessage(prompt, chat_uuid)
}
```

## 🔄 Navegación Automática para Nuevos Chats

### **Problema Original**

- Chat nuevo (sin UUID) → Usuario envía mensaje → Servidor genera UUID
- **REST**: Navegación funcionaba ✅
- **Streaming**: No navegaba ❌

### **Solución Implementada**

```typescript
// Helper centralizado en useChatSocket
const handleNewChatNavigation = useCallback(
  (newChatUuid: string) => {
    logger('navigation', `Nuevo chat creado, navegando a: ${newChatUuid}`)
    navigatingRef.current = true
    navigate(`/chat/conversation/${newChatUuid}`)
    queryClient.invalidateQueries({ queryKey: ['chats'] })
  },
  [navigate, queryClient, logger]
)

// Usado en ambos eventos
socket.on('generated', (data) => {
  if (data.chat_uuid && !chatUuid) {
    handleNewChatNavigation(data.chat_uuid) // REST
  }
})

socket.on('stream.token', (token) => {
  if (token.chat_uuid && !chatUuid) {
    handleNewChatNavigation(token.chat_uuid) // Streaming
  }
})
```

## 🔄 Solución de Navegación y Cache

### **Problema Crítico: Mensajes Desaparecen**

**Escenario:**

1. Usuario está en `/chat/conversation/uuid-123` con mensajes cargados ✅
2. Hace clic en "New Chat" → `/chat/conversation` (se limpian mensajes) ✅
3. Regresa a `/chat/conversation/uuid-123` → "No hay mensajes en esta conversación" ❌

### **Causa Raíz**

El problema estaba en la gestión del estado `messagesLoaded` que impedía recargar mensajes:

```typescript
// ❌ Configuración problemática (ANTES)
const [messagesLoaded, setMessagesLoaded] = useState(false)

const { isLoading } = useQuery({
  enabled: !!currentChatUuid && !messagesLoaded // ❌ Impide recargas
  // ...
})
```

### **Solución Implementada**

```typescript
// ✅ Configuración optimizada (DESPUÉS)
const loadMessages = useCallback(
  async (uuid: string) => {
    if (!uuid || currentChatUuid === uuid) return // Previene recargas duplicadas

    setIsChangingChat(true)
    setCurrentChatUuid(uuid) // Dispara automáticamente el useQuery

    // Cache inteligente primero
    const cachedMessages = queryClient.getQueryData(['chat-messages', uuid])
    if (cachedMessages && cachedMessages.length > 0) {
      setLocalMessages(cachedMessages)
      setIsChangingChat(false)
      return // No necesita fetch del servidor
    }

    // Si no hay cache, useQuery hace fetch automáticamente
    setLocalMessages([])
  },
  [logger, queryClient, currentChatUuid]
)

const { isLoading } = useQuery({
  enabled: !!currentChatUuid // ✅ Simple y efectivo
  // React Query maneja cache y fetch automáticamente
})
```

### **Beneficios de la Solución**

| Aspecto         | Antes                      | Después                     |
| --------------- | -------------------------- | --------------------------- |
| **Navegación**  | ❌ Mensajes desaparecen    | ✅ Mensajes persistentes    |
| **Performance** | ❌ Requests duplicados     | ✅ Un solo request por chat |
| **Cache**       | ❌ Cache ignorado          | ✅ Cache respetado (5 min)  |
| **UX**          | ❌ Loading innecesario     | ✅ Instantáneo con cache    |
| **Complejidad** | 🔴 Estado `messagesLoaded` | 🟢 Lógica simplificada      |

## 🐛 Solución de Espacios en Streaming

### **Problema Identificado**

```
Token 1: "Hola"     → Display: "Hola"
Token 2: "mundo"    → Display: "Holamundo" ❌
Final:   "Hola mundo" → Display: "Hola mundo" ✅
```

### **Solución: full_message**

```typescript
// Antes (concatenación simple)
setStreamingMessage((prev) => prev + token) // ❌ Sin espacios

// Después (reemplazo inteligente)
if (streamingToken.full_message) {
  onStreamingToken(streamingToken.full_message, true) // ✅ Con espacios
} else {
  onStreamingToken(streamingToken.token, false)
}
```

## 🚀 Optimizaciones Implementadas

### **1. Eliminación de Código Duplicado**

**Antes:**

```typescript
// 🔴 Duplicación en navegación
if (data.chat_uuid && !chatUuid) {
  logger('navigation', `Nuevo chat creado, navegando a: ${data.chat_uuid}`)
  navigatingRef.current = true
  navigate(`/chat/conversation/${data.chat_uuid}`)
  queryClient.invalidateQueries({ queryKey: ['chats'] })
}
// Se repetía en 'generated' y 'stream.token'
```

**Después:**

```typescript
// ✅ Helper centralizado
const handleNewChatNavigation = useCallback(
  (newChatUuid: string) => {
    logger('navigation', `Nuevo chat creado, navegando a: ${newChatUuid}`)
    navigatingRef.current = true
    navigate(`/chat/conversation/${newChatUuid}`)
    queryClient.invalidateQueries({ queryKey: ['chats'] })
  },
  [navigate, queryClient, logger]
)
```

### **2. Centralización de Envío**

**Antes:**

```typescript
// 🔴 Dos funciones casi idénticas
const sendMessage = (content, uuid) => {
  /* REST logic */
}
const sendStreamingMessage = (content, uuid) => {
  /* Streaming logic */
}
```

**Después:**

```typescript
// ✅ Helper compartido
const sendSocketMessage = useCallback((event, content, uuid) => {
  const mode = event === 'generate.streaming' ? 'STREAMING' : 'REST'
  socket.emit(event, { content, chat_uuid: uuid || '' }, callback)
}, [])

const sendMessage = useCallback(
  (content, uuid) => {
    sendSocketMessage('generate', content, uuid)
  },
  [sendSocketMessage]
)
```

### **3. Gestión Mejorada de Estados**

```typescript
// Helper para finalizar mensajes
const handleCompleteMessage = useCallback(
  (content: string) => {
    onClearStreaming()
    onMessageGenerated(createAIMessage(content))
    onStopSending()
  },
  [onClearStreaming, onMessageGenerated, onStopSending]
)
```

## 📊 Comparación: Antes vs Después

| Aspecto                    | Antes                   | Después               |
| -------------------------- | ----------------------- | --------------------- |
| **Líneas de código**       | ~210                    | ~146                  |
| **Duplicación**            | 3x navegación, 2x envío | Helpers centralizados |
| **Navegación entre chats** | ❌ Mensajes desaparecen | ✅ Cache persistente  |
| **Performance**            | ❌ Requests duplicados  | ✅ 1 request por chat |
| **Mantenibilidad**         | ❌ Difícil              | ✅ Fácil              |
| **Espacios streaming**     | ❌ Sin espacios         | ✅ Con espacios       |
| **Navegación streaming**   | ❌ No funcionaba        | ✅ Funciona           |
| **Debugging**              | ❌ Logs dispersos       | ✅ Logs centralizados |
| **Estado messagesLoaded**  | 🔴 Complicaba lógica    | 🟢 Eliminado          |
| **Cache React Query**      | ❌ Subutilizado         | ✅ Optimizado         |

## 🎯 Testing del Sistema

### **Test Manual con DevTools**

```javascript
// En browser console
const socket = io('http://localhost:3000/messages')

// Test REST
socket.emit('generate', {
  content: 'Hola',
  chat_uuid: 'test-123'
})

// Test Streaming
socket.emit('generate.streaming', {
  content: 'Explica IA',
  chat_uuid: 'test-123'
})

// Listeners para debug
socket.on('stream.token', console.log)
socket.on('generated', console.log)
```

### **Estados Esperados**

```typescript
// Durante streaming
{
  localMessages: [...mensajesAnteriores, mensajeUsuario],
  streamingMessage: "La IA es una tecnología...", // ✅ Con espacios
  isSending: true,
  isChangingChat: false
}

// Streaming completado
{
  localMessages: [...mensajesAnteriores, mensajeUsuario, mensajeIA],
  streamingMessage: "", // ✅ Limpio
  isSending: false,
  isChangingChat: false
}
```

## 🔮 Beneficios de la Implementación

### **✨ Para el Usuario**

- **Respuesta instantánea**: Modo streaming muestra progreso
- **Flexibilidad**: Puede elegir entre modos según preferencia
- **UX fluida**: Navegación sin delays, actualizaciones optimistas

### **🛠️ Para el Desarrollador**

- **Código limpio**: Helpers centralizados, menos duplicación
- **Debugging fácil**: Logs consistentes y estructurados
- **Escalabilidad**: Arquitectura preparada para nuevas funciones
- **Mantenimiento**: Separación clara de responsabilidades

### **🚀 Para el Sistema**

- **Performance**: Cache inteligente reduce llamadas API
- **Resilencia**: Manejo robusto de errores y reconexión
- **Eficiencia**: Socket.IO persistente, menos overhead de conexión

## 📝 Próximos Pasos

1. **📈 Métricas**: Implementar tracking de uso REST vs Streaming
2. **🎨 UX**: Mejorar indicadores visuales durante streaming
3. **🔧 Config**: Hacer configurable el timeout de streaming
4. **🧪 Tests**: Añadir tests unitarios y de integración para navegación entre chats
5. **📱 Mobile**: Optimizar experiencia en dispositivos móviles
6. **🔍 Monitoring**: Añadir métricas de performance del cache
7. **⚡ Performance**: Optimizar límites de cache y estrategias de invalidación

---

_Esta implementación representa un sistema de chat moderno, escalable y optimizado que combina lo mejor de ambos mundos: la inmediatez del streaming y la robustez de REST._
