import { Navigate } from 'react-router-dom'

import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function ProtectedRoutes() {
  const { isAuth } = useAuthStore()

  if (!isAuth) {
    return <Navigate to='/auth/login' />
  }

  return <Outlet />
}
