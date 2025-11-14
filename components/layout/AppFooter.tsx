// components/layout/AppFooter.tsx
import React from 'react';

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-slate-300">
          © {year} Le Shulé App · Sistema de control de comandas
        </p>
        <p className="text-[11px] text-slate-500">
          Gestión de comandas, mesas y caja del restaurante
        </p>
      </div>
    </footer>
  );
}
