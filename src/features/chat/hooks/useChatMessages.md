# useChatMessages Hook - Implementación Híbrida con React Query

## 📋 Resumen

Hook personalizado que gestiona el estado de mensajes en el chat usando una **implementación híbrida** que combina React Query para el cacheo inteligente con estado local para actualizaciones en tiempo real.

## 🎯 Problema Resuelto

**Problema Original:** La funcionalidad de chat tenía conflictos al usar React Query debido a:

- Streaming de mensajes en tiempo real
- Actualizaciones optimistas (agregar mensaje del usuario inmediatamente)
- Navegación entre chats que requiere sincronización
- Race conditions entre cache y estado local

**Solución:** Implementación híbrida que usa React Query solo para carga inicial y cacheo, mientras mantiene el estado local para todas las actualizaciones dinámicas.

## 🏗️ Arquitectura

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   React Query       │    │   Estado Local      │    │   Funciones API     │
│                     │    │                     │    │                     │
│ • Carga inicial     │◄──►│ • Streaming         │◄──►│ • getMessagesByUuid │
│ • Cacheo (5 min)    │    │ • Nuevos mensajes   │    │ • Socket events     │
│ • Invalidación      │    │ • Display messages  │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────────┘
```

## 🔧 Configuración de React Query

```typescript
{
  retry: 2,                    // 2 reintentos en caso de error
  refetchOnWindowFocus: false, // No refetch al enfocar ventana
  refetchOnMount: false,       // No refetch al montar componente
  refetchOnReconnect: false,   // No refetch al reconectar
  staleTime: 1000 * 60 * 5,   // 5 minutos de datos frescos
  gcTime: 1000 * 60 * 60      // 1 hora en garbage collector
}
```

## 📊 Estados Gestionados

| Estado             | Tipo                     | Propósito                             |
| ------------------ | ------------------------ | ------------------------------------- |
| `localMessages`    | `FormattedMessageType[]` | Mensajes del chat actual              |
| `streamingMessage` | `string`                 | Mensaje siendo recibido por streaming |
| `isChangingChat`   | `boolean`                | Indicador de cambio entre chats       |
| `currentChatUuid`  | `string`                 | UUID del chat actualmente activo      |
| `messagesLoaded`   | `boolean`                | Estado de control de carga            |

## 🚀 Funcionalidades Principales

### 1. **Carga Inteligente de Mensajes**

```typescript
loadMessages(uuid: string)
```

- Busca primero en cache para respuesta instantánea
- Si no existe cache, carga desde servidor via React Query
- Previene múltiples cargas simultáneas

### 2. **Gestión de Streaming**

```typescript
updateStreamingMessage(token: string)  // Actualiza token por token
addStreamingMessage(message)           // Finaliza streaming
clearStreamingMessage()               // Limpia streaming
```

### 3. **Actualizaciones Optimistas**

```typescript
addMessage(message) // Agrega mensaje del usuario inmediatamente
```

### 4. **Sincronización de Cache**

- Helper `updateCache()` centraliza la lógica de actualización
- Se ejecuta automáticamente al agregar mensajes
- Mantiene consistencia entre estado local y cache

## 🔄 Flujo de Funcionamiento

### **Chat Existente (con UUID):**

1. `loadMessages(uuid)` → Busca en cache
2. **Cache hit** → Carga instantánea ⚡
3. **Cache miss** → React Query carga desde servidor
4. Streaming y nuevos mensajes → Actualiza estado local + cache

### **Chat Nuevo (sin UUID):**

1. Estado local vacío inicialmente
2. Usuario escribe → `addMessage()` → Estado local
3. Streaming de respuesta → `updateStreamingMessage()`
4. Al asignarse UUID → Se cachea para futuras visitas

## 🔄 Sincronización Detallada: Cache vs Estado Dinámico

### **🎯 El Problema de Sincronización**

La complejidad principal radica en manejar **dos fuentes de verdad simultáneas**:

- **Cache/Servidor**: Mensajes históricos que deben cargarse una vez
- **Estado Local**: Mensajes nuevos que se agregan dinámicamente

**Conflicto potencial:**

```typescript
// ❌ PROBLEMA: Race condition
1. Usuario carga chat → React Query trae 10 mensajes
2. Usuario escribe → Se agrega mensaje #11 localmente
3. React Query se actualiza → Sobrescribe estado con solo 10 mensajes
4. ¡Mensaje #11 desaparece! 💥
```

### **✅ Solución: Separación de Responsabilidades**

#### **1. Control de Carga Inicial (`messagesLoaded`)**

```typescript
// Estado que previene cargas múltiples
const [messagesLoaded, setMessagesLoaded] = useState(false)

// Query solo se ejecuta si NO hemos cargado mensajes
enabled: !!currentChatUuid && !messagesLoaded
```

**Flujo paso a paso:**

```
┌─ loadMessages(uuid) llamado
│
├─ messagesLoaded = false ← Permitir carga
├─ currentChatUuid = uuid ← Activar query
│
├─ React Query enabled = true ← Query se ejecuta
├─ queryFn() ejecuta ← Trae mensajes del servidor
├─ messagesLoaded = true ← Bloquear futuras cargas
│
└─ Query enabled = false ← Query se desactiva automáticamente
```

#### **2. Carga Inmediata desde Cache**

```typescript
// Si hay cache, usarlo INMEDIATAMENTE sin esperar React Query
const cachedMessages = queryClient.getQueryData(['chat-messages', uuid])
if (cachedMessages) {
  setLocalMessages(cachedMessages) // ← Carga instantánea
  setMessagesLoaded(true) // ← Bloquea React Query
  setIsChangingChat(false) // ← UX instantánea
}
```

**Ventaja:** El usuario ve mensajes inmediatamente sin flicker ni loading.

#### **3. Actualización Segura del Estado**

```typescript
// React Query actualiza estado SOLO si no hemos cargado
if (!messagesLoaded) {
  setLocalMessages(messages) // ← Solo primera vez
  setMessagesLoaded(true) // ← Bloquea futuras actualizaciones
}
```

### **🔄 Flujo Completo de Sincronización**

#### **Escenario A: Chat con Cache (Navegación rápida)**

```
Usuario navega a chat UUID-123
     ↓
loadMessages("UUID-123")
     ↓
Cache hit: [msg1, msg2, msg3] ← Datos del cache
     ↓
setLocalMessages([msg1, msg2, msg3]) ← Carga instantánea ⚡
     ↓
messagesLoaded = true ← Bloquea React Query
     ↓
React Query enabled = false ← No se ejecuta
     ↓
Usuario escribe: "Hola"
     ↓
addMessage(userMsg) → [msg1, msg2, msg3, userMsg] ← Actualización local
     ↓
updateCache([msg1, msg2, msg3, userMsg]) ← Sincroniza cache
```

#### **Escenario B: Chat sin Cache (Primera visita)**

```
Usuario navega a chat UUID-456
     ↓
loadMessages("UUID-456")
     ↓
Cache miss: null ← No hay datos cacheados
     ↓
messagesLoaded = false ← Permitir carga desde servidor
     ↓
React Query enabled = true ← Query se activa
     ↓
Servidor responde: [msgA, msgB] ← Datos del servidor
     ↓
setLocalMessages([msgA, msgB]) ← Solo si !messagesLoaded
     ↓
messagesLoaded = true ← Bloquea nuevas cargas
     ↓
updateCache([msgA, msgB]) ← Cache para próximas visitas
     ↓
Usuario escribe: "Mundo"
     ↓
addMessage(userMsg) → [msgA, msgB, userMsg] ← Estado + cache actualizados
```

#### **Escenario C: Streaming durante Carga**

```
loadMessages("UUID-789") iniciado
     ↓
React Query cargando... ← Tomará 200ms
     ↓
Usuario escribe "Test" ← Mientras tanto...
     ↓
addMessage(userMsg) → [userMsg] ← Se agrega al estado vacío
     ↓
React Query responde: [msgX, msgY] ← Llegan datos del servidor
     ↓
messagesLoaded = false ← Todavía no habíamos cargado
     ↓
setLocalMessages([msgX, msgY]) ← ❌ SOBRESCRIBE estado local!
     ↓
¡Mensaje "Test" se pierde! 💥
```

**❌ Problema identificado:** Si el usuario interactúa durante la carga inicial.

**✅ Solución mejorada:** Preservar mensajes locales durante carga inicial.

### **🛡️ Protección Anti-Race Conditions**

La implementación actual maneja la mayoría de casos, pero para casos edge podríamos mejorar:

```typescript
// Mejora propuesta (no implementada aún):
if (!messagesLoaded) {
  // Preservar mensajes que el usuario agregó durante carga
  const newMessages = localMessages.length > 0 ? [...messages, ...localMessages] : messages

  setLocalMessages(newMessages)
  setMessagesLoaded(true)
}
```

### **🎯 Puntos Clave de la Sincronización**

| Momento                | Estado `messagesLoaded` | React Query        | Comportamiento             |
| ---------------------- | ----------------------- | ------------------ | -------------------------- |
| **Navegación inicial** | `false`                 | `enabled: true`    | Carga desde servidor/cache |
| **Después de cargar**  | `true`                  | `enabled: false`   | Solo estado local          |
| **Cambio de chat**     | Reset a `false`         | Se reactiva        | Nueva carga                |
| **Actualizaciones RT** | Permanece `true`        | Permanece disabled | Solo estado local          |

**Resultado:** Separación perfecta entre carga inicial (React Query) y actualizaciones dinámicas (estado local), eliminando conflictos de sincronización.

## 🛠️ Optimizaciones Implementadas

### **Eliminación de Duplicación:**

- ✅ Helper `updateCache()` centraliza lógica de cache
- ✅ `addMessage()` y `addStreamingMessage()` reutilizan lógica
- ✅ Logging consistente en todas las operaciones

### **Control de Condiciones de Carrera:**

- ✅ `messagesLoaded` previene múltiples cargas
- ✅ Query habilitada condicionalmente: `enabled: !!currentChatUuid && !messagesLoaded`
- ✅ Cache se actualiza pasivamente sin interferir

### **Gestión de Memoria:**

- ✅ `gcTime: 1 hora` para limpiar cache automáticamente
- ✅ `invalidateMessages()` para limpiar manualmente
- ✅ Estados se resetean correctamente al cambiar chats

## 💡 Ventajas de la Implementación

| Característica             | Beneficio                                           |
| -------------------------- | --------------------------------------------------- |
| **Navegación Instantánea** | Cache permite cambiar entre chats sin delay         |
| **Streaming Fluido**       | Estado local no interfiere con actualizaciones RT   |
| **Menos Llamadas API**     | Cache de 5 minutos reduce requests innecesarios     |
| **UX Optimizada**          | Actualizaciones optimistas para respuesta inmediata |
| **Debugging Mejorado**     | React Query DevTools + logs centralizados           |
| **Gestión de Errores**     | Retry automático y handling robusto                 |

## 🔧 API del Hook

```typescript
const {
  localMessages, // Mensajes del chat actual
  streamingMessage, // Mensaje en streaming
  isChangingChat, // Estado de carga/cambio
  loadMessages, // Cargar mensajes de un chat
  clearMessages, // Limpiar todos los mensajes
  addMessage, // Agregar mensaje del usuario
  addStreamingMessage, // Finalizar mensaje de streaming
  updateStreamingMessage, // Actualizar streaming token por token
  clearStreamingMessage, // Limpiar mensaje de streaming
  getDisplayMessages, // Obtener mensajes para mostrar
  invalidateMessages // Invalidar cache manualmente
} = useChatMessages()
```

## 🎯 Casos de Uso

- ✅ **Chat en tiempo real** con streaming de respuestas
- ✅ **Navegación rápida** entre múltiples conversaciones
- ✅ **Offline-first** con cache inteligente
- ✅ **Optimistic updates** para mejor UX
- ✅ **Sincronización automática** entre pestañas (via React Query)

---

**Resultado:** Un sistema de chat robusto que combina lo mejor de ambos mundos: la potencia del cacheo de React Query con la flexibilidad del estado local para actualizaciones dinámicas.
