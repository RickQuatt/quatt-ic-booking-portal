import React from 'react'
import ReactDOM from 'react-dom'
import classes from './Modal.module.css'
import { Button, ButtonProps } from '../Button/Button';

export type ModalProps = {
  isOpen: boolean;
  closeModal: () => void;
}
export function Modal ({
  isOpen,
  closeModal,
  children
}: React.PropsWithChildren<ModalProps>) {
  if (!isOpen) return null

  // const rootDOMNode = useRootDOMNode()
  const rootDOMNode = document.getElementById('root')!

  return ReactDOM.createPortal(
    <DimmerOverlay>
      <ModalInner closeModal={closeModal}>
        { children }
      </ModalInner>
    </DimmerOverlay>,
    rootDOMNode
  )
}

type ModalInnerProps = {
  closeModal: () => void;
  children: React.ReactNode;
}

export const ModalInner = (({ closeModal, children }: ModalInnerProps) => {
    const modalRef = React.useRef<HTMLDivElement>(null)

    // close on click outside and Escape key press
    React.useEffect(() => {
      const clickListener = (event: MouseEvent) => {
        if(event.target instanceof Node && modalRef.current && modalRef.current.contains(event.target)) {
          return;
        }
        closeModal()
      }

      const keydownListener = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          closeModal()
        }
      }

      document.addEventListener('click', clickListener, true)
      document.addEventListener('keydown', keydownListener, true)
      return () => {
        document.removeEventListener('click', clickListener, true)
        document.removeEventListener('keydown', keydownListener, true)
      }
    }, [
      closeModal
    ])

    return (
      <div
        ref={modalRef}
        tabIndex={0}
        className={classes.modal}
      >
        {children}
      </div>
    )
  }
)

const DimmerOverlay = ({ children }: React.PropsWithChildren) => {
  return (
    <div className={classes['dimmer-overlay']}>
      { children }
    </div>
  )
}

export const ModalHeader = ({ children }: { children: React.ReactNode }) => (
  <div className={classes['modal-header']}>
    { children }
  </div>
)
export const ModalContent = ({ children, className }: { children: React.ReactNode, className?: string; }) => (
  <div className={classes['modal-content']}>
    { children }
  </div>
)
export const ModalActions = ({ children }: { children: React.ReactNode }) => (
  <div className={classes['modal-actions']}>
    { children }
  </div>
)

// TODO: Make a raised button and add icon - 2023-06-23
export const ModalConfirmButton = (props: ButtonProps) => {
  return (
    <Button {...props} />
  )
}

// TODO: Make a flat button and add icon - 2023-06-23
export const ModalCloseButton = (props: ButtonProps) => {
  return (
    <Button {...props}>Close</Button>
  )
}