'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

export function Toast({ toast, removeToast }) {
  const [progress, setProgress] = useState(100);
  const isConfirm = toast.type === 'confirm';

  // ============================
  // AUTO-CIERRE SOLO PARA TOASTS NORMALES
  // ============================
  useEffect(() => {
    if (isConfirm) return; // confirm no autodestruye

    if (toast.duration <= 0) return;

    let interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev - (100 / (toast.duration / 50));
        if (next <= 0) {
          clearInterval(interval);
          // ⛔ IMPORTANTE: removeToast debe ir dentro de un efecto, NO en render
          setTimeout(() => removeToast(toast.id), 10);
          return 0;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration, toast.id, isConfirm, removeToast]);

  // Íconos por tipo
  const icons = {
    success: <CheckCircle size={20} className="text-emerald-400" />,
    error: <XCircle size={20} className="text-red-400" />,
    info: <Info size={20} className="text-blue-400" />,
    warning: <AlertTriangle size={20} className="text-yellow-400" />,
  };

  // ============================
  // CASO ESPECIAL: CONFIRM DIALOG
  // ============================
  if (isConfirm) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.7 }}
        className="
          fixed inset-0 flex items-center justify-center 
          bg-black/40 backdrop-blur-sm z-[9999]
        "
      >
        <div className="
          bg-[var(--bg-card)] text-[var(--text-main)]
          border border-[var(--border-color)]
          shadow-xl rounded-xl p-6 w-full max-w-md
        ">
          <p className="text-sm mb-6">{toast.message}</p>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                toast.onCancel?.();
                // ⛔ cerrar dentro de handler, no en render
                removeToast(toast.id);
              }}
              className="px-4 py-2 rounded-lg text-sm
                         bg-[var(--btn-secondary-bg)]
                         hover:bg-[var(--accent-primary)] hover:text-white transition"
            >
              Cancelar
            </button>

            <button
              onClick={() => {
                toast.onConfirm?.();
                removeToast(toast.id);
              }}
              className="px-4 py-2 bg-[var(--accent-primary)] 
                         text-white rounded-lg text-sm hover:brightness-110 transition"
            >
              Aceptar
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ============================
  // TOAST NORMAL (arriba a la derecha)
  // ============================
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      className="
        w-72 p-4 rounded-lg
        bg-[var(--bg-card)] text-[var(--text-main)]
        border border-[var(--border-color)]
        shadow-lg
      "
    >
      <div className="flex items-center gap-3">
        {icons[toast.type]}
        <p className="text-sm">{toast.message}</p>
      </div>

      <div className="mt-3 h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--accent-primary)] transition-all duration-50"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </motion.div>
  );
}
