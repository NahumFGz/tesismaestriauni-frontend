import { Button, Spacer, useDisclosure, cn } from '@heroui/react'
import { Icon } from '@iconify/react'

import SidebarDrawer from './sidebar-drawer'
import SidebarFooter from './sidebar-footer'
import SidebarBody from './sidebar-body'
import SidebarHeader from './sidebar-header'

/**
 * 💡 TIP: You can use the usePathname hook from Next.js App Router to get the current pathname
 * and use it as the active key for the Sidebar component.
 *
 * ```tsx
 * import {usePathname} from "next/navigation";
 *
 * const pathname = usePathname();
 * const currentPath = pathname.split("/")?.[1]
 *
 * <Sidebar defaultSelectedKey="home" selectedKeys={[currentPath]} />
 * ```
 */

export function SidebarContainer({
  children,
  header,
  title,
  subTitle,
  classNames = {}
}: {
  children?: React.ReactNode
  header?: React.ReactNode
  title?: string
  subTitle?: string
  classNames?: Record<string, string>
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const content = (
    <div className='relative flex h-full w-72 flex-1 flex-col p-6'>
      <SidebarHeader />
      <Spacer y={8} />
      <SidebarBody />
      <Spacer y={8} />
      <SidebarFooter />
    </div>
  )

  return (
    <div className='flex h-full min-h-[48rem] w-full py-4'>
      <SidebarDrawer
        className='h-full flex-none rounded-[14px] bg-default-50'
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        {content}
      </SidebarDrawer>
      <div className='flex w-full flex-col px-4 sm:max-w-[calc(100%_-_288px)]'>
        <header
          className={cn(
            'flex h-16 min-h-16 items-center justify-between gap-2 rounded-none rounded-t-medium border-small border-divider px-4 py-3',
            classNames?.['header']
          )}
        >
          <Button isIconOnly className='flex sm:hidden' size='sm' variant='light' onPress={onOpen}>
            <Icon
              className='text-default-500'
              height={24}
              icon='solar:hamburger-menu-outline'
              width={24}
            />
          </Button>
          {(title || subTitle) && (
            <div className='w-full min-w-[120px] sm:w-auto'>
              <div className='truncate text-small font-semibold leading-5 text-foreground'>
                {title}
              </div>
              <div className='truncate text-small font-normal leading-5 text-default-500'>
                {subTitle}
              </div>
            </div>
          )}
          {header}
        </header>
        <main className='flex h-full'>
          <div className='flex h-full w-full flex-col gap-4 rounded-none rounded-b-medium border-0 border-b border-l border-r border-divider py-3'>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
