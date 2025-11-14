// app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verificarToken } from '@/app/lib/auth';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = verificarToken(token);
  if (!payload) {
    redirect('/login');
  }

  return (
    <section className="space-y-6">
      {/* Encabezado del dashboard */}
      <div>
        <h1 className="text-2xl font-bold text-slate-50 tracking-tight">
          Panel principal
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Bienvenido al sistema de control de comandas del restaurante.
        </p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl">
          <p className="text-xs font-medium text-slate-200 uppercase tracking-wide">
            Mesas activas
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">12</p>
          <p className="mt-1 text-xs text-slate-300">
            Mesas actualmente ocupadas.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl">
          <p className="text-xs font-medium text-slate-200 uppercase tracking-wide">
            Órdenes en cocina
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">5</p>
          <p className="mt-1 text-xs text-slate-300">
            Órdenes pendientes de preparación.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl">
          <p className="text-xs font-medium text-slate-200 uppercase tracking-wide">
            Cuentas por cobrar
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">Q 1,250</p>
          <p className="mt-1 text-xs text-slate-300">
            Total estimado en cuentas abiertas.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl">
          <p className="text-xs font-medium text-slate-200 uppercase tracking-wide">
            Órdenes del día
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">34</p>
          <p className="mt-1 text-xs text-slate-300">
            Total de órdenes registradas hoy.
          </p>
        </div>
      </div>

      {/* Área donde luego cargaremos otros componentes */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-50">
            Actividad reciente
          </h2>
          <p className="mt-2 text-xs text-slate-300">
            Aquí luego podemos mostrar las últimas comandas, movimientos en caja
            o acciones de los meseros.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-slate-50">
            Atajos rápidos
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            <button className="w-full rounded-lg bg-blue-600/90 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500 transition shadow-md">
              Crear nueva comanda
            </button>
            <button className="w-full rounded-lg bg-slate-900/80 px-3 py-2 text-xs font-medium text-white hover:bg-black transition shadow-md">
              Ver mesas
            </button>
            <button className="w-full rounded-lg bg-emerald-600/90 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition shadow-md">
              Ir a caja
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
