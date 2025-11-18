// app/dashboard/page.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verificarToken } from '@/app/lib/auth';

type TokenPayload = {
  usuarioId: number;
  rol: string;
  nombre: string;
  email: string;
};

type DashboardKPIs = {
  totalPedidos: number;
  totalVentas: number;
  ticketPromedio: number;
  pedidosAbiertos: number;
  pedidosCerrados: number;
  pedidosCancelados: number;
};

type DashboardVentaDia = {
  fecha: string;
  totalVentas: number;
  totalPedidos: number;
};

type DashboardMetodoPago = {
  metodoPagoId: number;
  nombre: string;
  total: number;
};

type DashboardTopProducto = {
  productoId: number;
  nombre: string;
  cantidadVendida: number;
  montoTotal: number;
};

type DashboardTopMesero = {
  usuarioId: number;
  nombre: string;
  totalVentas: number;
  totalPedidos: number;
};

type DashboardResponse = {
  periodo: {
    desde: string;
    hasta: string;
  };
  filtros: {
    esAdmin: boolean;
    usuarioId: number | null;
  };
  kpis: DashboardKPIs;
  ventasPorDia: DashboardVentaDia[];
  ventasPorMetodoPago: DashboardMetodoPago[];
  topProductos: DashboardTopProducto[];
  topMeseros: DashboardTopMesero[];
};

function formatearMoneda(valor: number) {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
  }).format(valor);
}

function formatearFechaCorta(fechaIso: string) {
  const d = new Date(fechaIso);
  if (Number.isNaN(d.getTime())) return fechaIso;
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
  }).format(d);
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) redirect('/login');

  const payload = verificarToken(token) as TokenPayload | null;
  if (!payload) redirect('/login');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';

  const res = await fetch(`${baseUrl}/api/dashboard`, {
    method: 'GET',
    headers: {
      'x-usuario-id': String(payload.usuarioId),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('Error al obtener dashboard:', await res.text());
    return (
      <section className="space-y-6 text-[var(--text-main)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel principal</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Ocurrió un error al cargar los indicadores del dashboard.
          </p>
        </div>

        <div
          className="
            rounded-xl border p-4
            bg-rose-50/80 dark:bg-rose-900/20
            border-rose-200/70 dark:border-rose-800
          "
        >
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
            No fue posible obtener los datos del dashboard.
          </p>
          <p className="mt-1 text-xs text-rose-700/80 dark:text-rose-200/80">
            Verifica el endpoint <code>/api/dashboard</code> e intenta nuevamente.
          </p>
        </div>
      </section>
    );
  }

  const dashboard = (await res.json()).data as DashboardResponse;

  const {
    periodo,
    filtros,
    kpis,
    ventasPorDia,
    ventasPorMetodoPago,
    topProductos,
    topMeseros,
  } = dashboard;

  const periodoTexto = `${formatearFechaCorta(
    periodo.desde
  )} – ${formatearFechaCorta(periodo.hasta)}`;

  const cards = [
    {
      titulo: 'Ventas del período',
      valor: formatearMoneda(kpis.totalVentas),
      desc: `Del ${periodoTexto}`,
    },
    {
      titulo: 'Pedidos en el período',
      valor: kpis.totalPedidos.toString(),
      desc: 'Comandas registradas en el rango.',
    },
    {
      titulo: 'Ventas promedio',
      valor: formatearMoneda(kpis.ticketPromedio),
      desc: 'Promedio por comanda.',
    },
    {
      titulo: 'Estado de pedidos',
      valor: `${kpis.pedidosCerrados}/${kpis.totalPedidos}`,
      desc: `Cerrados · Abiertos: ${kpis.pedidosAbiertos} · Cancelados: ${kpis.pedidosCancelados}`,
    },
  ];

  const topProducto = topProductos[0];
  const topMesero = topMeseros[0];

  return (
    <section className="space-y-6 text-[var(--text-main)] min-w-0 w-full overflow-x-hidden">
      {/* Encabezado */}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">Panel principal</h1>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Bienvenido al sistema de control de comandas del restaurante.
        </p>

        <p className="mt-1 text-xs text-[var(--text-muted)] truncate max-w-full">
          Período analizado:{' '}
          <span className="font-medium">{periodoTexto}</span>{' '}
          · Vista:{' '}
          <span className="font-medium">
            {filtros.esAdmin ? 'Todos los usuarios' : 'Solo mis ventas'}
          </span>
        </p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="
              min-w-0
              rounded-xl border p-4
              backdrop-blur-xl shadow-[var(--shadow-card)]
              bg-[var(--bg-card)] border-[var(--border-color)]
            "
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] truncate">
              {card.titulo}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-main)] truncate">
              {card.valor}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)] truncate">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Zona inferior */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 min-w-0">
        {/* Resumen de actividad */}
        <div
          className="
            min-w-0
            rounded-xl border p-4
            backdrop-blur-xl shadow-[var(--shadow-card)]
            bg-[var(--bg-card)] border-[var(--border-color)]
            md:col-span-2 lg:col-span-2
          "
        >
          <h2 className="text-sm font-semibold text-[var(--text-main)] truncate">
            Resumen de actividad
          </h2>

          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            En este período se registraron{' '}
            <span className="font-semibold">{kpis.totalPedidos} pedidos</span>{' '}
            por un total de{' '}
            <span className="font-semibold">
              {formatearMoneda(kpis.totalVentas)}
            </span>
            .
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2 min-w-0">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 min-w-0">
              <p className="text-xs font-semibold text-[var(--text-main)] truncate">
                Ventas por día
              </p>

              {ventasPorDia.length === 0 ? (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  No hay ventas en este período.
                </p>
              ) : (
                <ul className="mt-2 space-y-1 max-h-44 overflow-auto text-xs text-[var(--text-secondary)]">
                  {ventasPorDia.slice(-7).map((v) => (
                    <li
                      key={v.fecha}
                      className="flex items-center justify-between min-w-0"
                    >
                      <span className="truncate">{formatearFechaCorta(v.fecha)}</span>
                      <span className="font-medium truncate">
                        {formatearMoneda(v.totalVentas)} · {v.totalPedidos} ped.
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 min-w-0">
              <p className="text-xs font-semibold text-[var(--text-main)] truncate">
                Ventas por método de pago
              </p>

              {ventasPorMetodoPago.length === 0 ? (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  No hay pagos registrados.
                </p>
              ) : (
                <ul className="mt-2 space-y-1 max-h-44 overflow-auto text-xs text-[var(--text-secondary)]">
                  {ventasPorMetodoPago.map((m) => (
                    <li
                      key={m.metodoPagoId}
                      className="flex items-center justify-between min-w-0"
                    >
                      <span className="truncate">{m.nombre}</span>
                      <span className="font-medium truncate">
                        {formatearMoneda(m.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Destacados */}
        <div
          className="
            min-w-0
            rounded-xl border p-4
            backdrop-blur-xl shadow-[var(--shadow-card)]
            bg-[var(--bg-card)] border-[var(--border-color)]
          "
        >
          <h2 className="text-sm font-semibold text-[var(--text-main)] truncate">
            Destacados del período
          </h2>

          <div className="mt-3 space-y-4 text-xs text-[var(--text-secondary)] min-w-0">
            <div>
              <p className="font-semibold text-[var(--text-main)] truncate">
                Producto más vendido
              </p>

              {topProducto ? (
                <p className="mt-1 truncate">
                  <span className="font-medium">{topProducto.nombre}</span> ·{' '}
                  {topProducto.cantidadVendida} unidades ·{' '}
                  {formatearMoneda(topProducto.montoTotal)}
                </p>
              ) : (
                <p className="mt-1">
                  No hay datos de productos vendidos.
                </p>
              )}
            </div>

            <div>
              <p className="font-semibold text-[var(--text-main)] truncate">
                Mejor mesero / usuario
              </p>

              {topMesero ? (
                <p className="mt-1 truncate">
                  <span className="font-medium">{topMesero.nombre}</span> ·{' '}
                  {topMesero.totalPedidos} pedidos ·{' '}
                  {formatearMoneda(topMesero.totalVentas)}
                </p>
              ) : (
                <p className="mt-1">
                  No hay datos suficientes para ranking de usuarios.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
