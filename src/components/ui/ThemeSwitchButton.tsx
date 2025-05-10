import { Icon } from '@iconify/react'
import { useThemeStoreDispatch } from '../../store/themeStore'
import { Button, Tooltip } from '@heroui/react'

export function ThemeSwitchButton() {
  const { toggleTheme, theme } = useThemeStoreDispatch()

  return (
    <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} placement='bottom'>
      <Button
        isIconOnly
        radius='full'
        variant='light'
        onPress={toggleTheme}
        className='bg-transparent'
      >
        <div className='relative w-6 h-6'>
          <Icon
            icon='solar:sun-linear'
            width={24}
            className={`absolute top-0 left-0 transition-opacity duration-300 ease-in-out ${
              theme === 'dark' ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <Icon
            icon='solar:moon-linear'
            width={22}
            className={`absolute top-0 left-0 transition-opacity duration-300 ease-in-out ${
              theme === 'dark' ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </div>
      </Button>
    </Tooltip>
  )
}
