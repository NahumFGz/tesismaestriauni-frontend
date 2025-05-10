import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'

export type AuthTokens = {
  token: string
  refreshToken: string
}

export type UserProfile = {
  id: number
  name: string
  email: string
}

interface AuthStore {
  token: string | null
  refreshToken: string | null
  profile: UserProfile | null
  isAuth: boolean
  rememberMe: boolean
  setAuth: (data: {
    token: string
    refreshToken: string
    profile: UserProfile
    rememberMe: boolean
  }) => void
  setProfile: (profile: UserProfile) => void
  logout: () => void
}

// Función auxiliar para gestionar el almacenamiento
const getStorage = (rememberMe: boolean) => {
  return createJSONStorage(() => (rememberMe ? localStorage : sessionStorage))
}

// Constante para el nombre del almacenamiento
const STORAGE_KEY = 'auth-storage'

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        token: null,
        refreshToken: null,
        profile: null,
        isAuth: false,
        rememberMe: false,

        setAuth: ({ token, refreshToken, profile, rememberMe }) => {
          // 🔁 Cambiar almacenamiento dinámicamente
          useAuthStore.persist.setOptions({
            storage: getStorage(rememberMe)
          })

          set({
            token,
            refreshToken,
            profile: profile || null,
            isAuth: true,
            rememberMe
          })
        },

        setProfile: (profile) => {
          set({ profile })
        },

        logout: () => {
          if (get().rememberMe) {
            localStorage.removeItem(STORAGE_KEY)
          } else {
            sessionStorage.removeItem(STORAGE_KEY)
          }

          set({
            token: null,
            refreshToken: null,
            profile: null,
            isAuth: false,
            rememberMe: false
          })
        }
      }),
      {
        name: STORAGE_KEY,
        storage: getStorage(false), // valor por defecto usando sessionStorage
        partialize: (state): Partial<AuthStore> => ({
          token: state.token,
          refreshToken: state.refreshToken,
          profile: state.profile,
          isAuth: state.isAuth,
          rememberMe: state.rememberMe
        })
      }
    )
  )
)
