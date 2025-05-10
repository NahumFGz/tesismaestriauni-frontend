import { Outlet } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'

export function AuthLayout() {
  return (
    <>
      <div className='h-screen w-screen'>
        <Outlet />
      </div>

      {/* Habilitar toast */}
      <ToastContainer />
    </>
  )
}
