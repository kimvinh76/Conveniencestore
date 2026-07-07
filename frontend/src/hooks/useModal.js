import { useRef, useCallback } from 'react';

export function useModal() {
  const modalRef = useRef(null);

  const openModal = useCallback(() => {
    modalRef.current?.showModal();
  }, []);

  const closeModal = useCallback(() => {
    modalRef.current?.close();
  }, []);

  return { modalRef, openModal, closeModal };
}

