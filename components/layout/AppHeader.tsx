// components/layout/AppHeader.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Menu } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useUI } from '@/context/UIContext';

export default function AppHeader() {
  const { usuario, cerrarSesion, cargando } = useAuth();
  const { setSidebarOpen } = useUI();

  const hardRefresh = async () => {
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) await reg.unregister();
      }
      window.location.replace(window.location.href);
    } catch {
      window.location.reload();
    }
  };

  return (
    <header
      className="
        w-full
        border-b
        bg-[var(--bg-header)]
        border-[var(--border-color)]
        backdrop-blur-xl
        flex items-center
        min-h-[64px]          /* 🔥 evita que nada se recorte */
        z-50
      "
    >
      <div
        className="
          flex items-center justify-between
          w-full max-w-full
          px-4
          py-2                /* 🔥 padding suave para móvil */
          sm:py-3             /* 🔥 más espacio en tablet/pc */
          gap-4
        "
      >
        {/* IZQUIERDA */}
        <div className="flex items-center gap-3 min-w-0">

          {/* MENU MOBILE */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="
              md:hidden p-2 mr-1
              rounded-lg transition
              hover:bg-[var(--bg-card)]
              border border-transparent
              hover:border-[var(--border-color)]
            "
          >
            <Menu size={20} className="text-[var(--text-main)]" />
          </button>

          {/* LOGO */}
          <button
            onClick={hardRefresh}
            title="Recargar aplicación"
            className="relative h-10 w-10 sm:h-11 sm:w-11 active:scale-95 transition"
          >
            <Image
              src="/images/logo-le-shuke.png"
              alt="Le Shulé App"
              fill
              className="
                object-contain rounded-full shadow-md
                ring-2 ring-[var(--border-color)]
                bg-white/80
              "
            />
          </button>

          {/* TEXTOS */}
          <div className="flex flex-col truncate min-w-0">
            <span className="text-sm font-semibold truncate text-[var(--text-main)]">
              Le Shulé App
            </span>
            <span className="text-xs truncate text-[var(--text-secondary)]">
              Sistema de control de comandas
            </span>
          </div>
        </div>

        {/* DERECHA */}
        <div className="flex items-center gap-2 sm:gap-4">

          {!cargando && usuario && (
            <div className="hidden sm:block text-right truncate">
              <p className="text-sm font-medium truncate text-[var(--text-main)]">
                {usuario.nombre}
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {usuario.rol}
              </p>
            </div>
          )}

          <ThemeToggle />

          {/* CERRAR SESIÓN */}
          <button
            onClick={cerrarSesion}
            title="Cerrar sesión"
            className="
              flex items-center justify-center
              rounded-full border shadow-sm
              transition-all

              border-[var(--border-color)]
              bg-[var(--bg-card)]
              text-[var(--text-main)]

              hover:bg-[var(--accent-primary)]
              hover:text-white
              hover:border-transparent

              w-10 h-10 p-0            /* 🔥 móvil: icono perfecto */

              sm:w-auto sm:h-auto      /* 🔥 escritorio: botón completo */
              sm:px-3 sm:py-2 sm:gap-2
            "
          >
            <LogOut size={18} />
            <span className="hidden sm:inline text-xs font-medium">
              Cerrar sesión
            </span>
          </button>

        </div>
      </div>
    </header>
  );
}
