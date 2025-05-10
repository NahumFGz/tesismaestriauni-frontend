import { useEffect } from 'react'
import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

interface ThemeStore {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeStore>()(
  devtools(
    persist(
      (set, get) => ({
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        toggleTheme: () =>
          set((state) => ({
            theme: state.theme === 'light' ? 'dark' : 'light'
          }))
      }),
      {
        name: 'theme-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) =>
          ({
            theme: state.theme
          } satisfies Partial<ThemeStore>)
      }
    )
  )
)

export function useThemeStoreDispatch() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  useEffect(() => {
    const htmlElement = document.querySelector('html')
    if (theme === 'dark') {
      htmlElement?.classList.add('dark')
    } else {
      htmlElement?.classList.remove('dark')
    }
  }, [theme])

  return { theme, toggleTheme }
}
