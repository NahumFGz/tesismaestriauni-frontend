import { Avatar, DropdownItem, DropdownMenu, DropdownSection } from '@heroui/react'

import { Button, Dropdown, DropdownTrigger } from '@heroui/react'
import { DropdownIcon } from '../../../assets/icons/DropdownIcon'

export function AvatarDropdown() {
  return (
    <>
      <div className='flex flex-col gap-4'>
        <Dropdown placement='bottom-end'>
          <DropdownTrigger>
            <Button
              fullWidth
              className='h-[60px] justify-start gap-3 rounded-[14px] border-1 border-default-300 bg-transparent px-3 py-[10px]'
              endContent={<DropdownIcon height={20} width={20} />}
            >
              <div className='flex w-full items-center gap-3'>
                <Avatar
                  size='sm'
                  src='https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/avatars/3a906b3de8eaa53e14582edf5c918b5d.jpg'
                />
                <div className='flex flex-col text-left'>
                  <p className='text-small font-semibold leading-5 text-foreground'>Taylor Smith</p>
                  <p className='text-tiny text-default-400'>taylor@mail.com</p>
                </div>
              </div>
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label='Profile Actions'
            className='w-[210px] bg-content1 px-[8px] py-[8px]'
            variant='flat'
          >
            <DropdownItem key='profile' className='h-14' title='profile'>
              <div className='flex w-full items-center gap-3'>
                <Avatar
                  size='sm'
                  src='https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/avatars/3a906b3de8eaa53e14582edf5c918b5d.jpg'
                />
                <div className='flex flex-col text-left'>
                  <p className='text-small font-normal leading-5 text-foreground'>Taylor Smith</p>
                  <p className='text-tiny text-default-400'>taylor@mail.com</p>
                </div>
              </div>
            </DropdownItem>
            <DropdownSection showDivider aria-label='profile-section-1' className='px-0'>
              <DropdownItem key='my-plan' className='py-[4px] text-default-500'>
                My Plan
              </DropdownItem>
              <DropdownItem key='my-gpts' className='py-[4px] text-default-500'>
                My GPTs
              </DropdownItem>
              <DropdownItem key='customize-acmeai' className='py-[4px] text-default-500'>
                Customize AcmeAI
              </DropdownItem>
            </DropdownSection>
            <DropdownSection showDivider aria-label='profile-section-2'>
              <DropdownItem key='settings' className='py-[4px] text-default-500'>
                Settings
              </DropdownItem>
              <DropdownItem key='download-desktop-app' className='py-[4px] text-default-500'>
                Download Desktop App
              </DropdownItem>
            </DropdownSection>
            <DropdownSection aria-label='profile-section-3' className='mb-0'>
              <DropdownItem key='help-and-feedback' className='py-[4px] text-default-500'>
                Help & Feedback
              </DropdownItem>
              <DropdownItem key='logout' className='pt-[4px] text-default-500'>
                Log Out
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </div>
    </>
  )
}
