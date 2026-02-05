'use client';

import { useState, useCallback } from 'react';

interface AlertOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

export function useCustomAlert() {
  const [alertConfig, setAlertConfig] = useState<AlertOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertConfig(options);
    setIsOpen(true);
  }, []);

  const hideAlert = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setAlertConfig(null), 300);
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showAlert({ message, title, type: 'success' });
  }, [showAlert]);

  const showError = useCallback((message: string, title?: string) => {
    showAlert({ message, title, type: 'error' });
  }, [showAlert]);

  const showWarning = useCallback((message: string, title?: string) => {
    showAlert({ message, title, type: 'warning' });
  }, [showAlert]);

  const showConfirm = useCallback((
    message: string, 
    onConfirm: () => void, 
    title?: string,
    confirmText?: string,
    cancelText?: string
  ) => {
    showAlert({ message, title, type: 'confirm', onConfirm, confirmText, cancelText });
  }, [showAlert]);

  return {
    alertConfig,
    isOpen,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
  };
}
