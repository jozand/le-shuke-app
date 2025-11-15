'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ToastContainer } from '@/components/ui/ToastContainer';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'confirm';

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number; // default: 5000 excepto confirm
  onConfirm?: () => void; // sólo confirm
  onCancel?: () => void;  // sólo confirm
}

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (options: ToastOptions) => {
    const id = crypto.randomUUID();
    const toast: Toast = {
      id,
      type: options.type || 'info',
      message: options.message,
      duration: options.type === 'confirm' ? 0 : options.duration || 5000,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    };

    setToasts((prev) => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
