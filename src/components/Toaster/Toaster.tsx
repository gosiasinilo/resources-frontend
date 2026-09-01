import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type ToastType = 'success' | 'info';
type Toast = { id: number; message: string; type: ToastType };
type Listener = (t: Toast) => void;

let _id = 0;
const listeners: Listener[] = [];

function emit(message: string, type: ToastType) {
  listeners.forEach(l => l({ id: ++_id, message, type }));
}

export const toast = {
  success: (m: string) => emit(m, 'success'),
  info:    (m: string) => emit(m, 'info'),
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts(p => [...p, t]);
      setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), 3500);
    };
    listeners.push(handler);
    return () => { listeners.splice(listeners.indexOf(handler), 1); };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none w-80">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded text-sm shadow-lg border pointer-events-auto ${
            t.type === 'success'
              ? 'bg-toplayer border-border text-text'
              : 'bg-toplayer border-secondary/30 text-secondary'
          }`}
        >
          <FontAwesomeIcon
            icon={t.type === 'success' ? 'circle-check' : 'circle-info'}
            className={t.type === 'success' ? 'text-highlight shrink-0' : 'text-secondary shrink-0'}
          />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
