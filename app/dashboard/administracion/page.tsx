// app/dashboard/administracion/page.tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';

const TABS = ['Mesas', 'Categorías', 'Productos', 'Usuarios'] as const;
type TabKey = (typeof TABS)[number];

export default function AdministracionPage() {
  const { usuario } = useAuth();
  const [tab, setTab] = useState<TabKey>('Mesas');

  // Si NO es admin, lo mandamos al dashboard
  if (usuario && usuario.rol !== 'Administrador') {
    redirect('/dashboard');
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
          Administración
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Gestión de mesas, categorías, productos y usuarios.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="
          inline-flex rounded-[var(--radius-md)] border
          border-[var(--border-color)] bg-[var(--bg-card)] p-1 text-sm
        "
      >
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`
                px-4 py-2 rounded-[var(--radius-md)] transition-colors
                ${active
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'
                }
              `}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Contenido de cada tab (por ahora placeholders) */}
      <div
        className="
          rounded-[var(--radius-lg)] border
          border-[var(--border-color)] bg-[var(--bg-card)]
          shadow-[var(--shadow-card)] p-4
        "
      >
        {tab === 'Mesas' && (
          <p className="text-sm text-[var(--text-secondary)]">
            Aquí irá el CRUD de <strong>Mesas</strong>.
          </p>
        )}
        {tab === 'Categorías' && (
          <p className="text-sm text-[var(--text-secondary)]">
            Aquí irá el CRUD de <strong>Categorías</strong>.
          </p>
        )}
        {tab === 'Productos' && (
          <p className="text-sm text-[var(--text-secondary)]">
            Aquí irá el CRUD de <strong>Productos</strong>.
          </p>
        )}
        {tab === 'Usuarios' && (
          <p className="text-sm text-[var(--text-secondary)]">
            Aquí irá el CRUD de <strong>Usuarios</strong>.
          </p>
        )}
      </div>
    </section>
  );
}
