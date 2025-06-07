import { Outlet, useLocation } from 'react-router-dom'
import { SidebarContainer } from '../components/sidebar'
import { SidebarContainerHeader } from '../components/sidebar-container-header'

export function ChatLayout() {
  const location = useLocation()

  // Determinar el título, subtítulo y header según la ruta
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/attendance':
        return { title: 'Attendance System', subTitle: 'Management', showHeader: false }
      case '/budget':
        return { title: 'Budget System', subTitle: 'Management', showHeader: false }
      case '/voting':
        return { title: 'Voting System', subTitle: 'Management', showHeader: false }
      default:
        // Para rutas de chat
        return { title: 'Apply for launch promotion', subTitle: 'Today', showHeader: true }
    }
  }

  const { title, subTitle, showHeader } = getPageInfo()

  return (
    <div className='h-screen w-screen'>
      <SidebarContainer
        header={showHeader ? <SidebarContainerHeader /> : undefined}
        subTitle={subTitle}
        title={title}
      >
        <Outlet />
      </SidebarContainer>
    </div>
  )
}
