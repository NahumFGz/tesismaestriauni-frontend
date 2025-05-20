import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react'
import type { ReactNode } from 'react'

interface ModalBaseProps {
  isOpen: boolean
  onClose: () => void
  modalTitle?: ReactNode
  modalBody?: ReactNode
  modalFooter?: boolean
  isDismissable?: boolean
}

export function ModalBase({
  isOpen,
  onClose,
  modalTitle,
  modalBody,
  modalFooter,
  isDismissable = true // Por defecto no se puede cerrar el modal haciendo clic fuera de él o presionando la tecla Esc
}: ModalBaseProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      scrollBehavior='inside'
      isDismissable={isDismissable}
      classNames={{
        base: 'w-auto max-w-full min-w-[400px]'
      }}
    >
      <ModalContent>
        {(onCloseModal: () => void) => (
          <>
            {modalTitle && <ModalHeader className='flex flex-col gap-1'>{modalTitle}</ModalHeader>}
            {modalBody && <ModalBody className='mb-2'>{modalBody}</ModalBody>}
            {modalFooter && (
              <ModalFooter>
                <Button color='danger' variant='light' onPress={onCloseModal}>
                  Cerrar
                </Button>
              </ModalFooter>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
