import { createContext, useState } from 'react';
import Toast from '../components/Toast';

export const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const showToast = (message, tone = 'info', duration = 4000) => {
    const id = `toast-${toastId += 1}`;
    setToasts((current) => [...current, { id, message, tone, duration }]);
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}
