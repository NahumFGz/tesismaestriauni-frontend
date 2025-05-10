import { create } from 'zustand'
import * as localStorageService from '../services/storage/localStorage'
import * as sessionStorageService from '../services/storage/sessionStorage'

// Función para obtener los valores iniciales desde el almacenamiento
const getInitialValues = () => {
  const rememberMe =
    localStorageService.getItem('rememberMe') ||
    sessionStorageService.getItem('rememberMe') ||
    false
  const storageService = rememberMe ? localStorageService : sessionStorageService
  const token = storageService.getItem('token') || sessionStorageService.getItem('token') || null
  const isAuth =
    storageService.getItem('isAuth') || sessionStorageService.getItem('isAuth') || false
  const profile =
    storageService.getItem('profile') || sessionStorageService.getItem('profile') || null

  return {
    token,
    isAuth,
    profile,
    rememberMe
  }
}

export const useAuthStore = create((set) => ({
  ...getInitialValues(),

  setToken: (token) => {
    const storageService = useAuthStore.getState().rememberMe
      ? localStorageService
      : sessionStorageService
    storageService.setItem('token', token)
    storageService.setItem('isAuth', true)
    set({ token, isAuth: true })
  },

  setProfile: (profile) => {
    const storageService = useAuthStore.getState().rememberMe
      ? localStorageService
      : sessionStorageService
    storageService.setItem('profile', profile)
    set({ profile })
  },

  setRememberMe: (rememberMe) => {
    const storageService = rememberMe ? localStorageService : sessionStorageService
    storageService.setItem('rememberMe', rememberMe)
    set({ rememberMe })
  },

  cleanStore: () => {
    const storageService = useAuthStore.getState().rememberMe
      ? localStorageService
      : sessionStorageService
    storageService.removeItem('token')
    storageService.removeItem('isAuth')
    storageService.removeItem('profile')
    storageService.removeItem('rememberMe')
    set({ token: null, isAuth: false, profile: null, rememberMe: false })
  }
}))

export function useAuthStoreDispatch() {
  const token = useAuthStore((store) => store.token)
  const isAuth = useAuthStore((store) => store.isAuth)
  const profile = useAuthStore((store) => store.profile)
  const logout = useAuthStore((state) => state.cleanStore)
  const setToken = useAuthStore((state) => state.setToken)
  const setProfile = useAuthStore((state) => state.setProfile)
  const setRememberMe = useAuthStore((state) => state.setRememberMe)

  return { isAuth, token, profile, logout, setToken, setProfile, setRememberMe }
}
