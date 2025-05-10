import { AcmeIcon } from '../../../assets/icons/AcmeIcon'

export default function SidebarHeader() {
  return (
    <>
      <div className='flex items-center gap-2 px-2'>
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-foreground'>
          <AcmeIcon className='text-background' />
        </div>
        <span className='text-base font-bold uppercase leading-6 text-foreground'>Acme AI</span>
      </div>
    </>
  )
}
