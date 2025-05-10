// services/auth.ts
export async function login({ email, password }: { email: string; password: string }) {
  console.log('🔐 Simulando login...')
  await new Promise((res) => setTimeout(res, 300)) // simula delay
  if (email === 'test@mail.com' && password === '123456') {
    return {
      accessToken: 'fake-access-token',
      refreshToken: 'fake-refresh-token'
    }
  } else {
    //TODO: Con axios devolver un arreglo de erroes para poder mostralo con toast, buscar las apis del proyecto me_devtree
    throw new Error('Credenciales inválidas')
  }
}

//Simular el profile
export async function getProfile() {
  console.log('🔐 Simulando perfil...')
  await new Promise((res) => setTimeout(res, 100)) // simula delay
  return {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com'
  }
}
