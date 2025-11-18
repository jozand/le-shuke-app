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
        await Promise.all(names.map((name) => caches.delete(name)));
      }

      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) await reg.unregister();
      }

      window.location.replace(window.location.href);
    } catch (err) {
      console.error('Error limpiando caché:', err);
      window.location.reload();
    }
  };

  return (
    <header
      className="
        w-full 
        border-b 
        backdrop-blur-xl
        border-[var(--border-color)]
        bg-[var(--bg-header)]
      "
    >
      <div
        className="
          w-full
          max-w-full           /* 🔥 elimina restricción 6xl */
          px-4 py-3
          flex items-center justify-between gap-4
          overflow-hidden       /* 🔥 protege mobile */
        "
      >

        {/* IZQUIERDA */}
        <div className="flex items-center gap-3">

          {/* Botón menú móvil */}
          <button
            className="
              md:hidden 
              mr-1 
              p-2 
              rounded-lg 
              hover:bg-[var(--bg-card)] 
              border border-transparent 
              hover:border-[var(--border-color)]
              transition
            "
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} className="text-[var(--text-main)]" />
          </button>

          {/* Logo */}
          <button
            onClick={hardRefresh}
            title="Recargar aplicación y limpiar caché"
            className="relative h-10 w-10 sm:h-11 sm:w-11 active:scale-95 transition"
          >
            <Image
              src="/images/logo-le-shuke.png"
              alt="Le Shulé App"
              fill
              className="
                rounded-full 
                object-contain 
                shadow-md 
                ring-2 
                bg-white/80 
                ring-[var(--border-color)]
              "
            />
          </button>

          {/* Nombre app */}
          <div className="flex flex-col max-w-[150px] sm:max-w-none">
            <span className="text-sm font-semibold truncate text-[var(--text-main)]">
              Le Shulé App
            </span>
            <span className="text-xs truncate text-[var(--text-secondary)]">
              Sistema de control de comandas
            </span>
          </div>
        </div>

        {/* DERECHA */}
        <div className="flex items-center gap-3 sm:gap-4">

          {/* Usuario */}
          {!cargando && usuario && (
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-sm font-medium truncate text-[var(--text-main)]">
                {usuario.nombre}
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {usuario.rol}
              </p>
            </div>
          )}

          {/* Modo oscuro */}
          <ThemeToggle />

          {/* Cerrar sesión */}
          <button
            onClick={cerrarSesion}
            className="
              inline-flex items-center gap-2 
              rounded-full 
              border px-2.5 py-2
              text-xs font-medium
              transition-all
              shadow-sm

              border-[var(--border-color)]
              bg-[var(--bg-card)]
              text-[var(--text-main)]

              hover:bg-[var(--accent-primary)]
              hover:text-white
              hover:border-transparent
            "
            title="Cerrar sesión"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}
