import { AcmeIcon } from '../../../assets/icons/AcmeIcon'
import { ThemeSwitchButton } from '../../../components/ui/ThemeSwitchButton'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
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
        <LoginForm />
      </div>
    </div>
  )
}
