'use client';

import { Toast } from './Toast';
import { AnimatePresence } from 'framer-motion';

// ===============================
// TIPOS DEL TOAST
// ===============================
export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'confirm';
  message: string;
  duration: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// Props del contenedor
interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <>
      {/* TOASTS NORMALES → esquina INFERIOR derecha */}
      <div
        className="
          fixed bottom-6 right-6 
          flex flex-col gap-3 
          z-[9998]
          pointer-events-none
        "
      >
        <AnimatePresence>
          {toasts
            .filter((t) => t.type !== 'confirm')
            .map((toast) => (
              <div key={toast.id} className="pointer-events-auto">
                <Toast toast={toast} removeToast={removeToast} />
              </div>
            ))}
        </AnimatePresence>
      </div>

      {/* CONFIRM → SIEMPRE POR ENCIMA (CENTRO DE LA PANTALLA) */}
      <AnimatePresence>
        {toasts
          .filter((t) => t.type === 'confirm')
          .map((toast) => (
            <Toast key={toast.id} toast={toast} removeToast={removeToast} />
          ))}
      </AnimatePresence>
    </>
  );
}
