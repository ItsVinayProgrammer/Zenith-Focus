import React from 'react';
import type { ToastMessage } from '../../hooks/useToast';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

export const Toast: React.FC<{ toast: ToastMessage, onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-accent-cyan',
  }

  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
        setIsExiting(true);
        const removeTimer = setTimeout(() => onDismiss(toast.id), 300);
        return () => clearTimeout(removeTimer);
    }, 2700);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`relative flex items-center gap-3 w-full max-w-sm p-4 bg-dark-card border border-white/10 rounded-lg shadow-lg ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}`}>
      <div className={`flex-shrink-0 ${colors[toast.type]}`}>
        {toast.icon || icons[toast.type]}
      </div>
      <p className="text-sm font-medium text-gray-200">{toast.message}</p>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[], removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-5 right-5 z-[100] space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};
