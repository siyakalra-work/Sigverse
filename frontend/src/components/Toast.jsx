import { useEffect } from 'react';

export default function Toast({ toasts, onDismiss }) {
  useEffect(() => {
    if (!toasts.length) return undefined;

    const timers = toasts.map((toast) => window.setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [onDismiss, toasts]);

  if (!toasts.length) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-item-${toast.tone || 'info'}`}>
          <span>{toast.message}</span>
          <button
            type="button"
            className="toast-item-close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
