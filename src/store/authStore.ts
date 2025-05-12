import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { disconnectSocket } from '../services/config/socketio'

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

// Detecta si hay una sesión guardada en localStorage
const hasLocalStorageSession = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      return parsed.state && parsed.state.rememberMe === true
    } catch {
      return false
    }
  }
  return false
}

// Detecta el valor inicial de rememberMe
const initialRememberMe = hasLocalStorageSession()

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        token: null,
        refreshToken: null,
        profile: null,
        isAuth: false,
        rememberMe: initialRememberMe,

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

          // Desconectar el socket al cerrar sesión
          disconnectSocket()

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
        storage: getStorage(initialRememberMe), // Usa localStorage si ya hay una sesión guardada
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
