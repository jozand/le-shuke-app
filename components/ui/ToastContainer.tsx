'use client';

import { Toast } from './Toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'confirm';
  message: string;
  duration: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
  setToasts?: (toasts: ToastItem[]) => void; // si lo necesitas
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  const lastToastRef = useRef<string | null>(null);

  /* ==========================================================
     🔥 SOLO UN TOAST A LA VEZ
     - Si aparece un nuevo toast, se elimina el anterior
     ========================================================== */
  useEffect(() => {
    if (toasts.length > 1) {
      const [primero, ...resto] = toasts;

      // Elimina todos menos el último
      resto.forEach((t) => removeToast(t.id));
    }
  }, [toasts]);

  /* =====================
     CONFIGURAR ANIMACIÓN
     ===================== */
  const toastMotion = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 }, // animación hacia abajo
    transition: { duration: 0.25 },
  };

  return (
    <>
      {/* TOASTS NORMALES (inferior derecha) */}
      <div
        className="
          fixed bottom-6 right-6 
          flex flex-col gap-3 
          z-[9998]
          pointer-events-none
        "
      >
        <AnimatePresence mode="wait">
          {toasts
            .filter((t) => t.type !== 'confirm')
            .map((toast) => (
              <motion.div
                key={toast.id}
                {...toastMotion}
                className="pointer-events-auto"
              >
                <Toast toast={toast} removeToast={removeToast} />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* CONFIRMACIONES EN EL CENTRO */}
      <AnimatePresence mode="wait">
        {toasts
          .filter((t) => t.type === 'confirm')
          .map((toast) => (
            <motion.div
              key={toast.id}
              {...toastMotion}
              className="fixed inset-0 flex items-center justify-center z-[9999]"
            >
              <Toast toast={toast} removeToast={removeToast} />
            </motion.div>
          ))}
      </AnimatePresence>
    </>
  );
}
