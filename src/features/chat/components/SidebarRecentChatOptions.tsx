import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { Icon } from '@iconify/react'

export function SidebarRecentChatOptions() {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Icon
          className='text-default-500 opacity-0 group-hover:opacity-100'
          icon='solar:menu-dots-bold'
          width={24}
        />
      </DropdownTrigger>
      <DropdownMenu aria-label='Dropdown menu with icons' className='py-2' variant='faded'>
        <DropdownItem
          key='share'
          className='text-default-500 data-[hover=true]:text-default-500'
          startContent={
            <Icon
              className='text-default-300'
              height={20}
              icon='solar:square-share-line-linear'
              width={20}
            />
          }
        >
          Share
        </DropdownItem>
        <DropdownItem
          key='rename'
          className='text-default-500 data-[hover=true]:text-default-500'
          startContent={
            <Icon className='text-default-300' height={20} icon='solar:pen-linear' width={20} />
          }
        >
          Rename
        </DropdownItem>
        <DropdownItem
          key='archive'
          className='text-default-500 data-[hover=true]:text-default-500'
          startContent={
            <Icon
              className='text-default-300'
              height={20}
              icon='solar:folder-open-linear'
              width={20}
            />
          }
        >
          Archive
        </DropdownItem>
        <DropdownItem
          key='delete'
          className='text-danger-500 data-[hover=true]:text-danger-500'
          color='danger'
          startContent={
            <Icon
              className='text-danger-500'
              height={20}
              icon='solar:trash-bin-minimalistic-linear'
              width={20}
            />
          }
        >
          Delete
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}
