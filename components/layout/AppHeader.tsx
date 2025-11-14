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
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">

        {/* IZQUIERDA: botón móvil + Logo + nombre app */}
        <div className="flex items-center gap-3">
          {/* Botón menú para móvil */}
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

          <div className="relative h-9 w-9">
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
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[var(--text-main)]">
              Le Shulé App
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              Sistema de control de comandas
            </span>
          </div>
        </div>

        {/* DERECHA: Usuario + tema + logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Nombre de usuario (solo en sm o mayor) */}
          {!cargando && usuario && (
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-sm font-medium text-[var(--text-main)]">
                {usuario.nombre}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {usuario.rol}
              </p>
            </div>
          )}

          {/* Switch de tema */}
          <ThemeToggle />

          {/* Botón cerrar sesión */}
          <button
            onClick={cerrarSesion}
            className="
              inline-flex items-center gap-2 
              rounded-full 
              border px-3 py-1.5
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
            {/* Texto solo en pantallas sm en adelante */}
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}
