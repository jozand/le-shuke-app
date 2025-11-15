// components/layout/AppSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import {
  LayoutDashboard,
  Settings2,
  UtensilsCrossed,
  Clock3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppSidebar() {
  const { usuario } = useAuth();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useUI();
  const pathname = usePathname();

  const isAdmin = usuario?.rol === 'Administrador';

  const items = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: 'Administración',
      href: '/dashboard/administracion',
      icon: <Settings2 size={20} />,
      onlyAdmin: true,
    },
    {
      label: 'Mesas',
      href: '/dashboard/mesas',
      icon: <UtensilsCrossed size={20} />,
    },
    {
      label: 'Historial',
      href: '/dashboard/historial',
      icon: <Clock3 size={20} />,
    },
  ];

  const visibles = items.filter((i) => !i.onlyAdmin || isAdmin);

  return (
    <>
      {/* ========= SIDEBAR DESKTOP (colapsable) ========= */}
      <aside
        className={`
          hidden md:flex flex-col
          border-r border-[var(--border-color)]
          bg-[var(--bg-card)]/90
          backdrop-blur-xl
          text-[var(--text-secondary)]
          transition-all duration-300
          ${sidebarCollapsed ? 'w-16' : 'w-56'}
        `}
      >
        {/* Botón colapsar/expandir */}
        <div className="p-2 flex justify-end">
          <button
            onClick={toggleSidebarCollapsed}
            className="p-1 rounded-lg hover:bg-[var(--bg-main)]/80 transition"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {visibles.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)]
                  text-sm transition-colors
                  ${active
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'hover:bg-[var(--bg-main)]/80 text-[var(--text-secondary)]'
                  }
                `}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ========= SIDEBAR MÓVIL (drawer) ========= */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}   // ⭐ Intermedio, funciona bien en claro/oscuro
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              className="
                fixed top-0 left-0 z-50
                h-full w-64

                bg-[var(--bg-card)]/90
                backdrop-blur-xl

                border-r border-[var(--border-color)]
                shadow-[0_10px_40px_rgba(0,0,0,0.5)]

                px-4 pt-5 pb-4
                flex flex-col
              "
            >
              <h2 className="text-sm font-semibold mb-4 text-[var(--text-main)]">
                Menú
              </h2>

              <nav className="space-y-1">
                {visibles.map((item) => {
                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)]
                        text-sm transition-colors
                        ${active
                          ? 'bg-[var(--accent-primary)] text-white'
                          : 'hover:bg-[var(--bg-card)]/80 text-[var(--text-secondary)]'
                        }
                      `}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
