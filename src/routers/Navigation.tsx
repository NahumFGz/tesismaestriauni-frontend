import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { AuthLayout } from '../features/auth/layouts/AuthLayout'
import { LoginPage } from '../features/auth/pages/LoginPage'

export function Navigation() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta por defecto */}
        <Route path='/' element={<Navigate to='/auth/login' replace />} />

        {/* Rutas de autentificación */}
        <Route element={<AuthLayout />}>
          <Route path='/auth/login' element={<LoginPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
