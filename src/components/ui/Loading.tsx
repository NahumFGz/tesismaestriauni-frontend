import { Spinner } from '@heroui/react'

export function Loading() {
  return (
    <div className='flex items-center justify-center h-full w-full'>
      <Spinner variant='spinner' />
    </div>
  )
}
