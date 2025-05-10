'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { Button, Input, Checkbox, Link, Divider } from '@heroui/react'
import { Icon } from '@iconify/react'
import { AcmeIcon } from '../../../assets/acme'
import { ThemeSwitchButton } from '../../../components/ui/ThemeSwitchButton'
import { useMutation } from '@tanstack/react-query'
import { getProfile, login } from '../../../services/auth'
import { useAuthStore, type UserProfile } from '../../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

type LoginFormData = {
  email: string
  password: string
  remember: boolean
}

type LoginResponseType = {
  token: string
  refreshToken: string
  profile: UserProfile
  rememberMe: boolean
}

export function LoginPage() {
  const [isVisible, setIsVisible] = React.useState(false)
  const toggleVisibility = () => setIsVisible(!isVisible)
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      remember: false
    }
  })

  const mutation = useMutation<LoginResponseType, Error, LoginFormData>({
    mutationFn: async (data: LoginFormData) => {
      const tokensResponse = await login(data)
      const profileData = await getProfile()

      // Mapear los nombres de los tokens correctamente
      return {
        token: tokensResponse.accessToken,
        refreshToken: tokensResponse.refreshToken,
        profile: profileData,
        rememberMe: data.remember
      }
    },
    onSuccess: ({ token, refreshToken, profile, rememberMe }) => {
      setAuth({ token, refreshToken, profile, rememberMe })
      navigate('/chat/conversation', { replace: true })
    },
    onError: (error) => {
      console.error('❌ Error de login:', error)
      toast.error('Credenciales inválidas')
    }
  })

  const onSubmit = (data: LoginFormData) => {
    mutation.mutate(data)
    console.log(errors)
  }

  return (
    <div className='flex h-full w-full flex-col items-center justify-center relative'>
      <div className='absolute right-6 top-6'>
        <ThemeSwitchButton />
      </div>

      <div className='flex flex-col items-center pb-6'>
        <AcmeIcon size={60} />
        <p className='text-xl font-medium'>Welcome Back</p>
        <p className='text-small text-default-500'>Log in to your account to continue</p>
      </div>

      <div className='mt-2 flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 py-6 shadow-small'>
        <form className='flex flex-col gap-3' onSubmit={handleSubmit(onSubmit)}>
          <Input
            isRequired
            label='Email Address'
            placeholder='Enter your email'
            type='email'
            variant='bordered'
            {...register('email', { required: 'Email is required' })}
          />

          <Input
            isRequired
            endContent={
              <button type='button' onClick={toggleVisibility}>
                <Icon
                  className='pointer-events-none text-2xl text-default-400'
                  icon={isVisible ? 'solar:eye-closed-linear' : 'solar:eye-bold'}
                />
              </button>
            }
            label='Password'
            placeholder='Enter your password'
            type={isVisible ? 'text' : 'password'}
            variant='bordered'
            {...register('password', { required: 'Password is required' })}
          />

          <div className='flex w-full items-center justify-between px-1 py-2'>
            <Checkbox size='sm' {...register('remember')}>
              Remember me
            </Checkbox>
            <Link className='text-default-500' href='#' size='sm' isDisabled>
              Forgot password?
            </Link>
          </div>

          <Button className='w-full' color='primary' type='submit'>
            Log In
          </Button>
        </form>

        <div className='flex items-center gap-4'>
          <Divider className='flex-1' />
          <p className='shrink-0 text-tiny text-default-500'>OR</p>
          <Divider className='flex-1' />
        </div>

        <div className='flex flex-col gap-2'>
          <Button
            startContent={<Icon icon='flat-color-icons:google' width={24} />}
            variant='bordered'
            isDisabled
          >
            Continue with Google
          </Button>
          <Button
            startContent={<Icon className='text-default-500' icon='fe:github' width={24} />}
            variant='bordered'
            isDisabled
          >
            Continue with Github
          </Button>
        </div>

        <p className='text-center text-small'>
          Need to create an account?&nbsp;
          <Link href='#' size='sm' isDisabled>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
