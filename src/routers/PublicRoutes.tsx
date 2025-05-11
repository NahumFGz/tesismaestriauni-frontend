import { Navigate } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function PublicRoutes() {
  const { isAuth } = useAuthStore()

  if (isAuth) {
    return <Navigate to='/chat/conversation' />
  }

  return <Outlet />
}
