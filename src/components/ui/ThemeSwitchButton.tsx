import { Icon } from '@iconify/react'
import { useThemeStoreDispatch } from '../../store/themeStore'
import { Button } from '@heroui/react'

export function ThemeSwitchButton() {
  const { toggleTheme, theme } = useThemeStoreDispatch()

  return (
    <div className='flex items-center'>
      {theme === 'dark' ? (
        <p className='text-small text-default-400'>Swap light Mode</p>
      ) : (
        <p className='text-small text-default-400'>Swap dark Mode</p>
      )}
      <div>
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
              className={`absolute top-0 left-0 transition-transform duration-300 ease-in-out ${
                theme === 'dark' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
            />
            <Icon
              icon='solar:moon-linear'
              width={22}
              className={`absolute top-0 left-0 transition-transform duration-300 ease-in-out ${
                theme === 'dark' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
              }`}
            />
          </div>
        </Button>
      </div>
    </div>
  )
}
