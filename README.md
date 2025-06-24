# 💻 Frontend - Interfaz Conversacional para Transparencia Gubernamental

Aplicación frontend desarrollada en **React** con **TypeScript** que proporciona una **interfaz conversacional moderna** para consultas sobre transparencia gubernamental del Estado Peruano. Integra **comunicación en tiempo real** con WebSockets, **UI moderna** con HeroUI y **gestión de estado** avanzada.

## 🎯 Funcionalidades

- **Interfaz conversacional**: Chat en tiempo real para consultas gubernamentales
- **Streaming de respuestas**: Visualización en tiempo real de respuestas de IA
- **Gestión de documentos**: Consulta y visualización de documentos oficiales
- **Sistema de autenticación**: Login/registro con manejo de sesiones
- **UI responsiva**: Diseño adaptativo para desktop y móvil
- **Tema configurable**: Modo claro/oscuro persistente

## 🛠️ Tecnologías

### Core

- **React 19**: Framework frontend con las últimas características
- **TypeScript**: Tipado estático para desarrollo robusto
- **Vite**: Build tool ultrarrápido con HMR

### UI y Estilos

- **HeroUI**: Sistema de componentes moderno y accessible
- **TailwindCSS**: Framework CSS utility-first
- **Framer Motion**: Animaciones fluidas y transiciones
- **@iconify/react**: Biblioteca de iconos unificada

### Estado y Datos

- **Zustand**: Gestión de estado global ligera
- **TanStack Query**: Cache y sincronización de datos del servidor
- **React Hook Form**: Manejo eficiente de formularios

### Comunicación

- **Socket.IO Client**: WebSockets para comunicación en tiempo real
- **Axios**: Cliente HTTP para APIs REST

### Funcionalidades Avanzadas

- **React Markdown**: Renderizado de markdown con soporte GFM
- **React Router DOM**: Enrutamiento declarativo
- **React Toastify**: Notificaciones elegantes
- **usehooks-ts**: Hooks utilitarios de TypeScript

## 📱 Características de la interfaz

### Sistema Conversacional

- **Chat en tiempo real**: Comunicación bidireccional con WebSockets
- **Streaming de mensajes**: Visualización token por token
- **Historial persistente**: Conversaciones guardadas por usuario
- **Markdown rendering**: Soporte completo para formato de respuestas

### Gestión de Documentos

- **Búsqueda avanzada**: Filtros por fecha, legislatura, tipo
- **Visualización directa**: Links a documentos oficiales
- **Metadata estructurada**: Información contextual completa

### Autenticación

- **Login/Registro**: Sistema completo de usuarios
- **Sesiones persistentes**: Estado de autenticación mantenido
- **Rutas protegidas**: Acceso controlado por autenticación

### UI/UX

- **Responsive design**: Adaptativo para todos los dispositivos
- **Dark/Light mode**: Tema configurable y persistente
- **Animaciones fluidas**: Transiciones con Framer Motion
- **Loading states**: Indicadores de carga elegantes

## 🏗️ Arquitectura

### Estructura de carpetas

```
frontend/src/
├── features/              # Funcionalidades por dominio
│   ├── auth/             # Autenticación y registro
│   │   ├── components/   # Componentes específicos
│   │   ├── hooks/        # Hooks personalizados
│   │   └── services/     # Lógica de negocio
│   ├── chat/             # Sistema conversacional
│   │   ├── components/   # Componentes de chat
│   │   ├── hooks/        # WebSocket y estado
│   │   ├── services/     # Comunicación en tiempo real
│   │   ├── store/        # Estado local del chat
│   │   └── types/        # Tipos TypeScript
│   ├── attendance/       # Consultas de asistencias
│   ├── voting/           # Consultas de votaciones
│   └── procurement/      # Consultas de contrataciones
├── components/           # Componentes compartidos
│   └── ui/              # Componentes de interfaz reutilizables
├── services/            # Servicios de comunicación
│   ├── api.ts           # Cliente HTTP configurado
│   ├── auth.ts          # Servicios de autenticación
│   └── websocket.ts     # Configuración Socket.IO
├── store/               # Estado global
│   ├── authStore.ts     # Estado de autenticación
│   └── themeStore.ts    # Configuración de tema
├── routers/             # Configuración de rutas
│   ├── Navigation.tsx   # Navegación principal
│   ├── ProtectedRoutes.tsx # Rutas autenticadas
│   └── PublicRoutes.tsx # Rutas públicas
├── types/               # Definiciones TypeScript
└── utils/               # Utilidades y helpers
```

### Patrones implementados

- **Feature-based architecture**: Organización por funcionalidad
- **Compound components**: Componentes complejos modulares
- **Custom hooks**: Lógica reutilizable encapsulada
- **Service layer**: Separación de lógica de comunicación

## ⚙️ Variables de entorno

```env
# API Gateway
VITE_API_URL=http://localhost:3000/api

# WebSocket Gateway
VITE_WEBSOCKET_URL=http://localhost:3000

# Configuración de aplicación
VITE_APP_TITLE="Transparencia Gubernamental"
VITE_APP_VERSION=1.0.0
```

## 🚀 Instalación y ejecución

### Desarrollo local

1. **Instalar dependencias:**

```bash
npm install
```

2. **Configurar variables de entorno:**

```bash
cp .env.template .env
# Editar .env con tus configuraciones
```

3. **Ejecutar en modo desarrollo:**

```bash
npm run dev
```

4. **Abrir en navegador:**

```
http://localhost:5173
```

### Producción

1. **Construir para producción:**

```bash
npm run build
```

2. **Preview de build:**

```bash
npm run preview
```

### Con Docker

```bash
# Construir imagen
docker build -t frontend .

# Ejecutar contenedor
docker run -p 80:80 frontend
```

## 🔧 Desarrollo

### Comandos disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo con HMR
npm run preview          # Preview de build de producción

# Build
npm run build            # Construir para producción

# Calidad de código
npm run lint             # Ejecutar ESLint
```

### Herramientas de desarrollo

- **Vite HMR**: Hot Module Replacement ultrarrápido
- **TypeScript**: Verificación de tipos en tiempo real
- **ESLint**: Linting con reglas React y TypeScript
- **Prettier**: Formateo automático de código
- **React Query Devtools**: Inspector de cache de datos

### Estructura de componentes

```typescript
// Ejemplo de componente con tipado
interface ChatMessageProps {
  message: string
  timestamp: Date
  isUser: boolean
  isStreaming?: boolean
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  timestamp,
  isUser,
  isStreaming = false
}) => {
  // Implementación del componente
}
```

## 🔌 Integración con Backend

### WebSocket Communication

```typescript
// Conexión con Socket.IO
const socket = io(WEBSOCKET_URL, {
  path: '/socket.io',
  transports: ['websocket', 'polling']
})

// Eventos de chat
socket.emit('generate.streaming', { message, chat_id, user_id })
socket.on('stream.token', handleStreamToken)
socket.on('stream.end', handleStreamEnd)
```

### HTTP API Calls

```typescript
// Cliente HTTP configurado
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptores para autenticación
api.interceptors.request.use(addAuthToken)
api.interceptors.response.use(handleResponse, handleError)
```

## 📊 Gestión de estado

### Global State (Zustand)

```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Implementación del store
}))
```

### Server State (TanStack Query)

```typescript
// Queries para datos del servidor
export const useDocuments = (filters: DocumentFilters) => {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => fetchDocuments(filters),
    staleTime: 5 * 60 * 1000 // 5 minutos
  })
}
```

## 🎨 Sistema de diseño

### HeroUI Components

- **Buttons**: Variantes primary, secondary, ghost
- **Inputs**: Text, textarea, select con validación
- **Cards**: Containers para contenido estructurado
- **Modals**: Overlays para acciones importantes
- **Navigation**: Navbar, sidebar, breadcrumbs

### TailwindCSS Classes

- **Responsive**: `sm:`, `md:`, `lg:`, `xl:` breakpoints
- **Dark mode**: `dark:` prefix para tema oscuro
- **Animations**: Clases de transición y transformación
- **Typography**: Plugin para contenido markdown

## 🐳 Docker

### Dockerfile multistage

```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```bash
# Solo frontend y gateway
docker compose -f docker-compose.app.yml up

# Sistema completo
docker compose up
```

## 📱 Funcionalidades destacadas

### Chat Conversacional

- **Streaming en tiempo real**: Respuestas token por token
- **Markdown rendering**: Formato rico en respuestas
- **Historial persistente**: Conversaciones guardadas
- **Estados de loading**: Indicadores visuales

### Búsqueda de Documentos

- **Filtros avanzados**: Por fecha, tipo, legislatura
- **Resultados paginados**: Performance optimizada
- **Links directos**: Acceso a documentos oficiales
- **Metadata completa**: Información contextual

### Sistema de Temas

- **Dark/Light mode**: Alternancia automática
- **Persistencia**: Configuración guardada
- **Transiciones suaves**: Cambios animados
- **Variables CSS**: Personalización fácil

## 🔒 Seguridad

### Autenticación

- **JWT tokens**: Almacenados de forma segura
- **Refresh tokens**: Renovación automática
- **Protected routes**: Acceso controlado
- **Logout automático**: Por expiración de sesión

### Validación

- **Client-side**: React Hook Form + Zod schemas
- **Server-side**: Validación en gateway
- **Sanitización**: Prevención de XSS
- **CORS**: Configurado en desarrollo

## 📝 Notas técnicas

- **React 19**: Utiliza las últimas características de React
- **TypeScript strict**: Configuración estricta de tipos
- **Bundle optimization**: Tree shaking y code splitting
- **Performance**: Lazy loading y memorización
- **Accessibility**: Componentes HeroUI con ARIA
- **SEO**: Meta tags dinámicos por ruta

## 🚀 Características avanzadas

- **Progressive Web App**: Service workers y manifest
- **Offline support**: Cache de datos críticos
- **Real-time updates**: WebSocket reconnection automática
- **Error boundaries**: Manejo elegante de errores
- **Analytics**: Tracking de interacciones
- **Performance monitoring**: Core Web Vitals
