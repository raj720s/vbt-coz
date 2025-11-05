import { useState, useCallback } from "react";

interface UseFormModalReturn<T> {
  isOpen: boolean;
  isLoading: boolean;
  editingItem: T | null;
  openModal: (item?: T) => void;
  closeModal: () => void;
  setLoading: (loading: boolean) => void;
  resetModal: () => void;
}

export const useFormModal = <T = unknown>(): UseFormModalReturn<T> => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  const openModal = useCallback((item?: T) => {
    setEditingItem(item || null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setEditingItem(null);
    setIsLoading(false);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const resetModal = useCallback(() => {
    setIsOpen(false);
    setEditingItem(null);
    setIsLoading(false);
  }, []);

  return {
    isOpen,
    isLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading,
    resetModal,
  };
}; 