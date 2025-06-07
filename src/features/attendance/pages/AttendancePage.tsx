import { SidebarContainer } from '../../chat/components/sidebar'
import { SidebarContainerHeader } from '../../chat/components/sidebar-container-header'

export function AttendancePage() {
  return (
    <div className='h-dvh w-full max-w-full'>
      <SidebarContainer
        header={<SidebarContainerHeader />}
        subTitle='Management'
        title='Attendance System'
      >
        <div className='flex h-full items-center justify-center'>
          <div className='text-center'>
            <h1 className='text-4xl font-bold text-default-700 mb-4'>AttendancePage</h1>
            <p className='text-default-500'>Attendance management system will be here</p>
          </div>
        </div>
      </SidebarContainer>
    </div>
  )
}
