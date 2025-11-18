// components/layout/AppFooter.tsx
import React from 'react';

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="
        w-full 
        border-t 
        backdrop-blur-xl
        border-[var(--border-color)]
        bg-[var(--bg-header)]
        text-[var(--text-secondary)]
        transition-colors duration-300
        overflow-x-hidden     /* 🔥 evita scroll lateral */
      "
    >
      <div
        className="
          w-full max-w-full     /* 🔥 adiós max-w-6xl que dañaba iPad */
          px-4 py-3
          flex flex-col sm:flex-row
          items-center justify-between
          gap-2
        "
      >
        <p className="text-xs text-[var(--text-secondary)] truncate max-w-full min-w-0 text-center sm:text-left">
          © {year} Le Shulé App · Sistema de control de comandas
        </p>

        <p className="text-[11px] text-[var(--text-secondary)] truncate max-w-full min-w-0 text-center sm:text-right">
          Gestión de comandas, mesas y caja del restaurante
        </p>
      </div>
    </footer>
  );
}
