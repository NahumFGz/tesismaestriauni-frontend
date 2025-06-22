import { Card, CardBody, CardHeader } from '@heroui/react'
import { AcmeIcon } from '../../../assets/icons/AcmeIcon'
import { Icon } from '@iconify/react/dist/iconify.js'

const cardMessages = [
  {
    key: 'message1',
    description: '¿Quieres saber qué empresas han contratado con el Estado?',
    icon: <Icon className='text-primary-700' icon='solar:notebook-square-bold' width={24} />
  },
  {
    key: 'message2',
    description: 'Consulta el historial de contrataciones de una empresa específica.',
    icon: <Icon className='text-danger-600' icon='solar:chat-square-like-bold' width={24} />
  },
  {
    key: 'message3',
    description: 'Revisa las asistencias y votaciones de congresistas.',
    icon: <Icon className='text-warning-600' icon='solar:user-id-bold' width={24} />
  },
  {
    key: 'message4',
    description: 'Explora empresas con contratos superiores a 250,000 soles.',
    icon: <Icon className='text-success-600' icon='solar:gameboy-bold' width={24} />
  }
]

export function NewChat() {
  return (
    <>
      <div className='flex h-full flex-col items-center justify-center gap-10 mx-30 mx-7'>
        <div className='flex rounded-full bg-foreground'>
          <AcmeIcon className='text-background' size={56} />
        </div>
        <div className='grid gap-2 sm:grid-cols-2 md:grid-cols-4'>
          {cardMessages.map((message) => (
            <Card
              key={message.key}
              className='h-auto bg-default-100 px-[20px] py-[16px]'
              shadow='none'
            >
              <CardHeader className='p-0 pb-[9px]'>{message.icon}</CardHeader>
              <CardBody className='p-0 text-small text-default-400'>{message.description}</CardBody>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
