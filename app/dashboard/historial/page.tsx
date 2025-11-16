// app/dashboard/historial/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Calendar,
  XCircle,
  Printer,
  FileDown,
} from 'lucide-react';

type HistorialDetalleDTO = {
  pedidoDetalleId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

type HistorialComandaDTO = {
  pedidoId: number;
  mesaNumero: number;
  mesaNombre: string | null;
  fecha: string;
  usuarioNombre: string;
  total: number;
  estado: 'ABIERTA' | 'CERRADA' | 'CANCELADA' | string;
  detalles: HistorialDetalleDTO[];
};

type MesaOption = {
  mesaId: number;
  numero: number;
  nombre: string | null;
};

export default function HistorialPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'Administrador';

  const [comandas, setComandas] = useState<HistorialComandaDTO[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroMesa, setFiltroMesa] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [mesas, setMesas] = useState<MesaOption[]>([]);
  const [cargandoMesas, setCargandoMesas] = useState(false);

  useEffect(() => {
    cargarHistorial();
    cargarMesas();
  }, []);

  async function cargarHistorial() {
    try {
      setCargando(true);
      setError(null);

      const res = await fetch('/api/historial');

      if (!res.ok) {
        let mensaje = 'Error al cargar historial de comandas';
        try {
          const body = await res.json();
          if (body?.mensaje) mensaje = body.mensaje;
        } catch { }
        throw new Error(mensaje);
      }

      const json = await res.json();
      const data = (json.data || []) as HistorialComandaDTO[];

      data.sort((a, b) => {
        const fa = new Date(a.fecha).getTime();
        const fb = new Date(b.fecha).getTime();
        return fb - fa;
      });

      setComandas(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Error inesperado al cargar historial');
    } finally {
      setCargando(false);
    }
  }

  async function cargarMesas() {
    try {
      setCargandoMesas(true);
      const res = await fetch('/api/mesas');

      if (!res.ok) return;

      const json = await res.json();
      const data = (json.data || []) as MesaOption[];

      data.sort((a, b) => a.numero - b.numero);
      setMesas(data);
    } catch (err) {
      console.error('Error mesas:', err);
    } finally {
      setCargandoMesas(false);
    }
  }

  function limpiarFiltros() {
    setFechaDesde('');
    setFechaHasta('');
    setFiltroMesa('');
    setFiltroUsuario('');
    setExpandedId(null);
  }

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function formatearFecha(valor: string) {
    const d = new Date(valor);
    if (isNaN(d.getTime())) return valor;
    return new Intl.DateTimeFormat('es-GT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  }

  function formatearMoneda(valor: number) {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(valor);
  }

  function badgeEstado(estado: string) {
    const base =
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';

    switch (estado) {
      case 'CERRADA':
        return (
          <span className={`${base} bg-emerald-100 text-emerald-700`}>
            CERRADA
          </span>
        );
      case 'CANCELADA':
        return (
          <span className={`${base} bg-rose-100 text-rose-700`}>
            CANCELADA
          </span>
        );
      case 'ABIERTA':
        return (
          <span className={`${base} bg-amber-100 text-amber-700`}>
            ABIERTA
          </span>
        );
      default:
        return (
          <span className={`${base} bg-slate-200 text-slate-700`}>
            {estado}
          </span>
        );
    }
  }

  const comandasFiltradas = useMemo(() => {
    return comandas.filter((c) => {
      if (!esAdmin && usuario?.nombre) {
        const u = usuario.nombre.toLowerCase().trim();
        const cu = c.usuarioNombre.toLowerCase().trim();
        if (u !== cu) return false;
      }

      if (fechaDesde && new Date(c.fecha) < new Date(fechaDesde)) return false;
      if (
        fechaHasta &&
        new Date(c.fecha) > new Date(fechaHasta + 'T23:59:59')
      )
        return false;

      if (filtroMesa !== '' && String(c.mesaNumero) !== filtroMesa)
        return false;

      if (filtroUsuario && esAdmin) {
        if (!c.usuarioNombre.toLowerCase().includes(filtroUsuario.toLowerCase()))
          return false;
      }

      return true;
    });
  }, [
    comandas,
    fechaDesde,
    fechaHasta,
    filtroMesa,
    filtroUsuario,
    esAdmin,
    usuario?.nombre,
  ]);

  // ============================
  // IMPRIMIR COMANDA
  // ============================
  function imprimirComanda(c: HistorialComandaDTO) {
    const contenido = `
      Comanda #${c.pedidoId}
      Mesa: ${c.mesaNumero}
      Fecha: ${formatearFecha(c.fecha)}
      Atendió: ${c.usuarioNombre}

      Detalles:
      ${c.detalles
        .map((d) => `- ${d.productoNombre} x${d.cantidad} = ${formatearMoneda(d.subtotal)}`)
        .join('\n')}

      Total: ${formatearMoneda(c.total)}
    `;

    const ventana = window.open('', '_blank');
    ventana?.document.write(`<pre>${contenido}</pre>`);
    ventana?.print();
    ventana?.close();
  }

  // ============================
  // EXPORTAR A EXCEL
  // ============================
  function exportarExcel(c: HistorialComandaDTO) {
    const filas = [
      ['Producto', 'Cantidad', 'Precio', 'Subtotal'],
      ...c.detalles.map((d) => [
        d.productoNombre,
        d.cantidad,
        d.precioUnitario,
        d.subtotal,
      ]),
    ];

    const contenido = filas.map((f) => f.join(',')).join('\n');

    const blob = new Blob([contenido], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `comanda_${c.pedidoId}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6">
      {/* ================= ENCABEZADO ================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Historial de Comandas</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Filtra, revisa y exporta comandas anteriores.
          </p>
        </div>

        <button
          onClick={cargarHistorial}
          disabled={cargando}
          className="border px-3 py-1.5 rounded-md shadow text-sm
                     bg-[var(--bg-card)] border-[var(--border-color)]
                     hover:bg-[var(--bg-hover)]
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </div>
          ) : (
            'Actualizar'
          )}
        </button>
      </div>

      {/* ================== FILTROS =================== */}
      <div className="border rounded-lg p-4 bg-[var(--bg-card)] grid gap-4 md:grid-cols-4">
        {/* Fecha desde */}
        <div>
          <label className="text-xs font-medium flex items-center gap-1 mb-1">
            <Calendar size={14} /> Desde
          </label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-full px-2 py-1.5 rounded-md border bg-[var(--bg-elevated)]"
          />
        </div>

        {/* Fecha hasta */}
        <div>
          <label className="text-xs font-medium flex items-center gap-1 mb-1">
            <Calendar size={14} /> Hasta
          </label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="w-full px-2 py-1.5 rounded-md border bg-[var(--bg-elevated)]"
          />
        </div>

        {/* Mesa */}
        <div>
          <label className="text-xs font-medium mb-1 block">Mesa</label>
          <select
            className="w-full px-2 py-1.5 rounded-md border bg-[var(--bg-elevated)]"
            value={filtroMesa}
            onChange={(e) => setFiltroMesa(e.target.value)}
          >
            <option value="">Todas</option>
            {mesas.map((m) => (
              <option key={m.mesaId} value={String(m.numero)}>
                {m.numero} {m.nombre ? `(${m.nombre})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Usuario */}
        {esAdmin && (
          <div>
            <label className="text-xs font-medium mb-1 block flex items-center gap-1">
              <Search size={14} /> Usuario
            </label>
            <input
              type="text"
              placeholder="Nombre..."
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              className="w-full px-2 py-1.5 rounded-md border bg-[var(--bg-elevated)]"
            />
          </div>
        )}
      </div>

      {/* BOTÓN LIMPIAR */}
      <button
        onClick={limpiarFiltros}
        className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300"
      >
        <XCircle size={14} /> Limpiar filtros
      </button>

      {/* ================= LISTADO ================= */}
      <div className="space-y-3">
        {comandasFiltradas.map((c) => {
          const abierto = expandedId === c.pedidoId;

          return (
            <div
              key={c.pedidoId}
              className="border rounded-lg bg-[var(--bg-card)] shadow"
            >
              {/* Cabezera del acordeón */}
              <button
                className="w-full flex items-center justify-between p-3 text-left"
                onClick={() => toggleExpand(c.pedidoId)}
              >
                <div>
                  <p className="text-sm font-medium">
                    Mesa {c.mesaNumero} — #{c.pedidoId}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {formatearFecha(c.fecha)} • {c.usuarioNombre}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {badgeEstado(c.estado)}
                  {abierto ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </div>
              </button>

              {/* Contenido */}
              {abierto && (
                <div className="p-4 border-t bg-[var(--bg-elevated)] space-y-4">
                  {/* Tabla */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-[var(--text-main)]">
                          <th className="pb-1">Producto</th>
                          <th className="pb-1 text-center">Cant.</th>
                          <th className="pb-1 text-right">Precio</th>
                          <th className="pb-1 text-right">Subtotal</th>
                        </tr>
                      </thead>

                      <tbody>
                        {c.detalles.map((d) => (
                          <tr
                            key={d.pedidoDetalleId}
                            className="border-b last:border-none"
                          >
                            <td>{d.productoNombre}</td>
                            <td className="text-center">{d.cantidad}</td>
                            <td className="text-right">
                              {formatearMoneda(d.precioUnitario)}
                            </td>
                            <td className="text-right">
                              {formatearMoneda(d.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total */}
                  <p className="text-right font-semibold text-lg">
                    Total: {formatearMoneda(c.total)}
                  </p>

                  {/* Acciones */}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => exportarExcel(c)}
                      className="flex items-center gap-1 text-sm text-green-500 hover:text-green-400"
                    >
                      <FileDown size={16} /> Exportar Excel
                    </button>

                    <button
                      onClick={() => imprimirComanda(c)}
                      className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                    >
                      <Printer size={16} /> Imprimir
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {comandasFiltradas.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)]">
            No se encontraron resultados con los filtros seleccionados.
          </p>
        )}
      </div>
    </section>
  );
}
