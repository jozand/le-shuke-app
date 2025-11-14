'use client';

import { Toast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';

export function ToastContainer({ toasts, removeToast }) {
  return (
    <>
      {/* TOASTS NORMALES → esquina superior derecha */}
      <div className="
          fixed top-20 right-6 
          flex flex-col gap-3 
          z-[9999]
       "
      >
        <AnimatePresence>
          {toasts
            .filter((t) => t.type !== 'confirm')
            .map((toast) => (
              <Toast key={toast.id} toast={toast} removeToast={removeToast} />
            ))}
        </AnimatePresence>
      </div>

      {/* CONFIRM → centro de pantalla */}
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
