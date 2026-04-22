import { useState, useCallback, ReactNode } from 'react';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
  icon?: ReactNode;
}

let toastCount = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, options: { type?: 'success' | 'info' | 'error', icon?: ReactNode } = {}) => {
    const { type = 'info', icon } = options;
    const id = toastCount++;
    setToasts(currentToasts => [...currentToasts, { id, message, type, icon }]);
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};
