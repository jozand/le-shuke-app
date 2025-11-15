'use client';

import { Toast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';

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
      {/* TOASTS NORMALES → esquina superior derecha */}
      <div
        className="
          fixed top-20 right-6 
          flex flex-col gap-3 
          z-[9999]
        "
      >
        <AnimatePresence>
          {toasts
            .filter((t: ToastItem) => t.type !== 'confirm')
            .map((toast: ToastItem) => (
              <Toast key={toast.id} toast={toast} removeToast={removeToast} />
            ))}
        </AnimatePresence>
      </div>

      {/* CONFIRM → centro de pantalla */}
      <AnimatePresence>
        {toasts
          .filter((t: ToastItem) => t.type === 'confirm')
          .map((toast: ToastItem) => (
            <Toast key={toast.id} toast={toast} removeToast={removeToast} />
          ))}
      </AnimatePresence>
    </>
  );
}
