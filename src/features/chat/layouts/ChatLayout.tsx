import { Outlet } from 'react-router-dom'

export function ChatLayout() {
  return (
    <div className='h-screen w-screen'>
      <Outlet />
    </div>
  )
}
