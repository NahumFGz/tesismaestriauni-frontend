import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { AuthLayout } from '../features/auth/layouts/AuthLayout'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { ChatLayout } from '../features/chat/layouts/ChatLayout'
import { ChatPage } from '../features/chat/pages/ChatPage'
import { ProtectedRoutes } from './ProtectedRoutes'
import { PublicRoutes } from './PublicRoutes'

export function Navigation() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta por defecto */}
        <Route path='/' element={<Navigate to='/auth/login' replace />} />

        {/* Rutas de autentificación */}
        <Route element={<PublicRoutes />}>
          <Route element={<AuthLayout />}>
            <Route path='/auth/login' element={<LoginPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoutes />}>
          <Route element={<ChatLayout />}>
            <Route path='chat/conversation/:chat_uuid?' element={<ChatPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
