// app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verificarToken } from '@/app/lib/auth';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) redirect('/login');

  const payload = verificarToken(token);
  if (!payload) redirect('/login');

  return (
    <section className="space-y-6 text-[var(--text-main)]">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
          Panel principal
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Bienvenido al sistema de control de comandas del restaurante.
        </p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { titulo: 'Mesas activas', valor: '12', desc: 'Mesas actualmente ocupadas.' },
          { titulo: 'Órdenes en cocina', valor: '5', desc: 'Órdenes pendientes de preparación.' },
          { titulo: 'Cuentas por cobrar', valor: 'Q 1,250', desc: 'Total estimado en cuentas abiertas.' },
          { titulo: 'Órdenes del día', valor: '34', desc: 'Total de órdenes registradas hoy.' },
        ].map((card, idx) => (
          <div
            key={idx}
            className="
              rounded-xl 
              border 
              p-4 
              backdrop-blur-xl 
              shadow-[var(--shadow-card)]
              bg-[var(--bg-card)]
              border-[var(--border-color)]
            "
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
              {card.titulo}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-main)]">
              {card.valor}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Zona inferior */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Actividad reciente */}
        <div
          className="
            rounded-xl 
            border 
            p-4 
            backdrop-blur-xl 
            shadow-[var(--shadow-card)]
            bg-[var(--bg-card)]
            border-[var(--border-color)]
            lg:col-span-2
          "
        >
          <h2 className="text-sm font-semibold text-[var(--text-main)]">
            Actividad reciente
          </h2>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Aquí luego podemos mostrar las últimas comandas, movimientos en caja
            o acciones de los meseros.
          </p>
        </div>

        {/* Atajos rápidos */}
        <div
          className="
            rounded-xl 
            border 
            p-4 
            backdrop-blur-xl 
            shadow-[var(--shadow-card)]
            bg-[var(--bg-card)]
            border-[var(--border-color)]
          "
        >
          <h2 className="text-sm font-semibold text-[var(--text-main)]">
            Atajos rápidos
          </h2>

          <div className="mt-3 flex flex-col gap-2">
            {/* Botón primario */}
            <button
              className="
                w-full rounded-lg px-3 py-2 text-xs font-medium shadow-md
                bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]
                hover:brightness-110 transition
              "
            >
              Crear nueva comanda
            </button>

            {/* Botón secundario */}
            <button
              className="
                w-full rounded-lg px-3 py-2 text-xs font-medium shadow-md
                bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)]
                hover:bg-[var(--accent-primary)] hover:text-white transition
              "
            >
              Ver mesas
            </button>

            {/* Botón acento verde */}
            <button
              className="
                w-full rounded-lg px-3 py-2 text-xs font-medium shadow-md
                bg-[var(--accent-secondary)] text-white
                hover:brightness-110 transition
              "
            >
              Ir a caja
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
