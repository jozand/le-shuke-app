// components/layout/AppHeader.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';

export default function AppHeader() {
  const { usuario, cerrarSesion, cargando } = useAuth();

  return (
    <header className="w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        {/* IZQUIERDA: Logo + nombre app */}
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9">
            <Image
              src="/images/logo-le-shuke.png"
              alt="Le Shulé App"
              fill
              className="rounded-full object-contain shadow-md ring-2 ring-white/30 bg-white/80"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-50">
              Le Shulé App
            </span>
            <span className="text-xs text-slate-300">
              Sistema de control de comandas
            </span>
          </div>
        </div>

        {/* DERECHA: Usuario + botón cerrar sesión */}
        <div className="flex items-center gap-4">
          {!cargando && usuario && (
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-slate-50">
                {usuario.nombre}
              </p>
              <p className="text-xs text-slate-300">
                {usuario.rol}
              </p>
            </div>
          )}

          <button
            onClick={cerrarSesion}
            className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-900/80 px-3 py-1.5
                       text-xs font-medium text-slate-100 shadow-sm hover:bg-slate-800 
                       hover:border-slate-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
