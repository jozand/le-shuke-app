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
  fecha: string; // ISO string
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

  const [comandas, setComandas] = useState<HistorialComandaDTO[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroMesa, setFiltroMesa] = useState(''); // ahora será el número de mesa como string
  const [filtroUsuario, setFiltroUsuario] = useState('');

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [mesas, setMesas] = useState<MesaOption[]>([]);
  const [cargandoMesas, setCargandoMesas] = useState(false);

  useEffect(() => {
    cargarHistorial();
    cargarMesas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarHistorial() {
    try {
      setCargando(true);
      setError(null);

      // 🔹 Ahora siempre traemos TODO el historial, sin filtros por querystring
      const res = await fetch('/api/historial', {
        method: 'GET',
      });

      if (!res.ok) {
        let mensaje = 'Error al cargar historial de comandas';
        try {
          const body = await res.json();
          if (body?.mensaje) mensaje = body.mensaje;
        } catch {
          /* ignore */
        }
        throw new Error(mensaje);
      }

      const json = await res.json();
      const data = (json.data || []) as HistorialComandaDTO[];

      // Ordenamos por fecha descendente (más reciente primero)
      data.sort((a, b) => {
        const fa = new Date(a.fecha).getTime();
        const fb = new Date(b.fecha).getTime();
        return fb - fa;
      });

      setComandas(data);
    } catch (err: any) {
      console.error('Error cargando historial:', err);
      setError(err.message || 'Error inesperado al cargar historial');
    } finally {
      setCargando(false);
    }
  }

  async function cargarMesas() {
    try {
      setCargandoMesas(true);
      const res = await fetch('/api/mesas', {
        method: 'GET',
      });

      if (!res.ok) {
        // Si falla, solo log, no queremos romper el historial por esto
        console.error('Error cargando mesas para filtros');
        return;
      }

      const json = await res.json();
      const data = (json.data || []) as MesaOption[];

      // Ordenamos por número de mesa
      data.sort((a, b) => a.numero - b.numero);
      setMesas(data);
    } catch (err) {
      console.error('Error cargando mesas para filtros:', err);
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
    // 🔹 Ya NO recargamos desde el servidor; los filtros son 100% en memoria
  }

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function formatearFecha(valor: string) {
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return valor;
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
          <span
            className={`${base} bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300`}
          >
            CERRADA
          </span>
        );
      case 'CANCELADA':
        return (
          <span
            className={`${base} bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300`}
          >
            CANCELADA
          </span>
        );
      case 'ABIERTA':
        return (
          <span
            className={`${base} bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300`}
          >
            ABIERTA
          </span>
        );
      default:
        return (
          <span
            className={`${base} bg-slate-100/80 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200`}
          >
            {estado}
          </span>
        );
    }
  }

  const comandasFiltradas = useMemo(() => {
    return comandas.filter((c) => {
      if (fechaDesde && new Date(c.fecha) < new Date(fechaDesde)) return false;
      if (
        fechaHasta &&
        new Date(c.fecha) > new Date(fechaHasta + 'T23:59:59')
      )
        return false;

      if (filtroMesa) {
        const mesaStr = String(c.mesaNumero ?? '');
        // Como ahora es selector, hacemos comparación exacta
        if (mesaStr !== filtroMesa) return false;
      }

      if (filtroUsuario && usuario?.rol === 'Administrador') {
        if (
          !c.usuarioNombre
            .toLowerCase()
            .includes(filtroUsuario.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });
  }, [comandas, fechaDesde, fechaHasta, filtroMesa, filtroUsuario, usuario?.rol]);

  // 🔹 Generar PDF de la comanda en el cliente y abrirlo con window.open
  async function imprimirComanda(comanda: HistorialComandaDTO) {
    if (typeof window === 'undefined') return;

    try {
      const jsPDFModule = await import('jspdf');
      const JsPDF = jsPDFModule.default;
      const doc = new JsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      let y = 10;
      const lineHeight = 7;

      doc.setFontSize(14);
      doc.text('Le Shuke - Comanda', margin, y);
      y += lineHeight;

      doc.setFontSize(11);
      doc.text(`Comanda #${comanda.pedidoId}`, margin, y);
      y += lineHeight;

      const mesaTexto = `Mesa ${comanda.mesaNumero}${comanda.mesaNombre ? ' - ' + comanda.mesaNombre : ''
        }`;
      doc.text(mesaTexto, margin, y);
      y += lineHeight;

      doc.text(`Atendido por: ${comanda.usuarioNombre}`, margin, y);
      y += lineHeight;

      doc.text(`Fecha: ${formatearFecha(comanda.fecha)}`, margin, y);
      y += lineHeight;

      doc.text(`Estado: ${comanda.estado}`, margin, y);
      y += lineHeight + 3;

      // Encabezados de tabla
      doc.setFontSize(10);
      doc.text('Producto', margin, y);
      doc.text('Cant.', margin + 80, y, { align: 'right' });
      doc.text('P. Unit', margin + 120, y, { align: 'right' });
      doc.text('Subt.', pageWidth - margin, y, { align: 'right' });

      y += lineHeight - 2;
      doc.line(margin, y, pageWidth - margin, y);
      y += 3;

      comanda.detalles.forEach((det) => {
        const maxY = doc.internal.pageSize.getHeight() - 20;
        if (y > maxY) {
          doc.addPage();
          y = 10;
        }

        // Producto (puede ser largo, así que lo partimos)
        const productoLines = doc.splitTextToSize(det.productoNombre, 70);
        productoLines.forEach((line: string, index: number) => {
          doc.text(line, margin, y);
          if (index === 0) {
            doc.text(String(det.cantidad), margin + 80, y, {
              align: 'right',
            });
            doc.text(formatearMoneda(det.precioUnitario), margin + 120, y, {
              align: 'right',
            });
            doc.text(formatearMoneda(det.subtotal), pageWidth - margin, y, {
              align: 'right',
            });
          }
          y += lineHeight - 2;
        });

        y += 1;
      });

      y += 3;
      doc.line(margin, y, pageWidth - margin, y);
      y += lineHeight;

      doc.setFontSize(12);
      doc.text('Total comanda:', margin + 100, y);
      doc.text(formatearMoneda(comanda.total), pageWidth - margin, y, {
        align: 'right',
      });

      // 🔹 Generar blob URL y abrir en nueva pestaña sin descargar automáticamente
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error generando PDF de comanda:', err);
      alert('Ocurrió un error al generar el PDF de la comanda.');
    }
  }

  // 🔹 Exportar a "Excel" (CSV) según lo filtrado / no filtrado
  function exportarExcel() {
    if (typeof window === 'undefined') return;
    if (comandasFiltradas.length === 0) {
      alert('No hay comandas para exportar.');
      return;
    }

    // Una fila por detalle para que sea más útil en Excel
    const rows: string[] = [];

    rows.push(
      [
        'PedidoId',
        'MesaNumero',
        'MesaNombre',
        'Fecha',
        'Usuario',
        'Estado',
        'Producto',
        'Cantidad',
        'PrecioUnitario',
        'Subtotal',
        'TotalComanda',
      ].join(';')
    );

    comandasFiltradas.forEach((c) => {
      if (c.detalles.length === 0) {
        rows.push(
          [
            c.pedidoId,
            c.mesaNumero,
            c.mesaNombre ?? '',
            formatearFecha(c.fecha),
            c.usuarioNombre,
            c.estado,
            '',
            '',
            '',
            '',
            formatearMoneda(c.total),
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(';')
        );
      } else {
        c.detalles.forEach((det) => {
          rows.push(
            [
              c.pedidoId,
              c.mesaNumero,
              c.mesaNombre ?? '',
              formatearFecha(c.fecha),
              c.usuarioNombre,
              c.estado,
              det.productoNombre,
              det.cantidad,
              formatearMoneda(det.precioUnitario),
              formatearMoneda(det.subtotal),
              formatearMoneda(c.total),
            ]
              .map((v) => `"${String(v).replace(/"/g, '""')}"`)
              .join(';')
          );
        });
      }
    });

    const csvContent = '\uFEFF' + rows.join('\r\n'); // BOM para que Excel abra bien en UTF-8
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const fechaNombre = new Date().toISOString().slice(0, 10);
    link.download = `historial_comandas_${fechaNombre}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
          Historial de comandas
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Consulta de comandas atendidas. Los usuarios verán solo su historial;
          los administradores podrán ver todo.
        </p>
      </div>

      {/* Filtros */}
      <div
        className="
          rounded-[var(--radius-lg)] border
          border-[var(--border-color)] bg-[var(--bg-card)]
          shadow-[var(--shadow-card)] p-4
          space-y-4
        "
      >
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
          <Calendar className="h-4 w-4" />
          <span>Filtros de búsqueda</span>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="
                w-full rounded-md border border-[var(--border-color)]
                bg-[var(--bg-input)] px-2 py-1.5 text-sm
                text-[var(--text-main)] outline-none
                focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]
              "
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="
                w-full rounded-md border border-[var(--border-color)]
                bg-[var(--bg-input)] px-2 py-1.5 text-sm
                text-[var(--text-main)] outline-none
                focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]
              "
            />
          </div>

          {/* Selector de mesa */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Nº de mesa
            </label>
            <div className="relative">
              <select
                value={filtroMesa}
                onChange={(e) => setFiltroMesa(e.target.value)}
                className="
                  w-full appearance-none rounded-md border border-[var(--border-color)]
                  bg-[var(--bg-input)] px-2 py-1.5 text-sm
                  text-[var(--text-main)] outline-none
                  focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]
                "
              >
                <option value="">
                  {cargandoMesas ? 'Cargando mesas...' : 'Todas las mesas'}
                </option>
                {mesas.map((m) => (
                  <option key={m.mesaId} value={String(m.numero)}>
                    Mesa {m.numero}
                    {m.nombre ? ` - ${m.nombre}` : ''}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <ChevronDown className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {usuario?.rol === 'Administrador' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Usuario que atendió
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">
                  <Search className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                </span>
                <input
                  type="text"
                  value={filtroUsuario}
                  onChange={(e) => setFiltroUsuario(e.target.value)}
                  placeholder="Nombre del mesero/cajero"
                  className="
                    w-full rounded-md border border-[var(--border-color)]
                    bg-[var(--bg-input)] pl-7 pr-2 py-1.5 text-sm
                    text-[var(--text-main)] outline-none
                    focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]
                  "
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="
                inline-flex items-center gap-1.5 rounded-md border border-transparent
                px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)]
                hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]
                transition-colors
              "
            >
              <XCircle className="h-4 w-4" />
              <span>Limpiar filtros</span>
            </button>

            <button
              type="button"
              onClick={exportarExcel}
              className="
                inline-flex items-center gap-2 rounded-md border
                border-[var(--border-color)] bg-[var(--bg-elevated)]
                px-3 py-1.5 text-sm font-medium text-[var(--text-main)]
                hover:bg-[var(--bg-hover)] transition-colors
              "
            >
              <FileDown className="h-4 w-4" />
              <span>Exportar a Excel</span>
            </button>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            {comandasFiltradas.length === 0
              ? 'Sin resultados para los filtros seleccionados.'
              : `Mostrando ${comandasFiltradas.length} comanda${comandasFiltradas.length === 1 ? '' : 's'
              }.`}
          </p>
        </div>
      </div>

      {/* Contenido principal: acordeón */}
      <div
        className="
          rounded-[var(--radius-lg)] border
          border-[var(--border-color)] bg-[var(--bg-card)]
          shadow-[var(--shadow-card)] divide-y divide-[var(--border-subtle)]
        "
      >
        {error && (
          <div className="flex items-start gap-2 p-3 text-sm text-rose-600 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-900/20">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-medium">Error al cargar el historial</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

        {cargando && comandas.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--text-secondary)]">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
            <span>Cargando historial de comandas...</span>
          </div>
        )}

        {!cargando && comandasFiltradas.length === 0 && !error && (
          <div className="py-10 text-center text-sm text-[var(--text-secondary)]">
            No se encontraron comandas para los filtros seleccionados.
          </div>
        )}

        {comandasFiltradas.map((comanda) => {
          const isExpanded = expandedId === comanda.pedidoId;

          return (
            <div key={comanda.pedidoId} className="group">
              {/* Header del acordeón */}
              <div
                onClick={() => toggleExpand(comanda.pedidoId)}
                className="
                  w-full px-4 py-3 flex items-center justify-between gap-3
                  hover:bg-[var(--bg-hover)] transition-colors cursor-pointer
                "
              >
                <div className="flex items-center gap-3 text-left">
                  <span
                    className="
                      flex h-8 w-8 items-center justify-center rounded-full
                      bg-[var(--accent-soft)] text-[var(--accent-strong)]
                      text-sm font-semibold
                    "
                  >
                    {comanda.mesaNumero}
                  </span>

                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--text-main)]">
                        Mesa {comanda.mesaNumero}
                        {comanda.mesaNombre
                          ? ` · ${comanda.mesaNombre}`
                          : ''}
                      </p>
                      {badgeEstado(comanda.estado)}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {formatearFecha(comanda.fecha)} · Atendido por{' '}
                      <span className="font-medium">
                        {comanda.usuarioNombre}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Botón imprimir comanda en PDF */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void imprimirComanda(comanda);
                    }}
                    className="
                      inline-flex h-8 w-8 items-center justify-center rounded-md
                      border border-[var(--border-subtle)]
                      bg-[var(--bg-elevated)]
                      text-[var(--text-secondary)]
                      hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]
                      transition-colors
                    "
                    title="Ver comanda en PDF"
                  >
                    <Printer className="h-4 w-4" />
                  </button>

                  <div className="text-right">
                    <p className="text-xs text-[var(--text-secondary)]">
                      Total
                    </p>
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      {formatearMoneda(comanda.total)}
                    </p>
                  </div>

                  <span
                    className={`
                      inline-flex h-6 w-6 items-center justify-center rounded-full
                      border border-[var(--border-subtle)]
                      text-[var(--text-secondary)] transition-transform
                      ${isExpanded ? 'rotate-90' : ''}
                    `}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </span>
                </div>
              </div>

              {/* Cuerpo del acordeón */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 text-sm bg-[var(--bg-subtle)]">
                  {comanda.detalles.length === 0 ? (
                    <p className="text-xs text-[var(--text-secondary)]">
                      Esta comanda no tiene detalles registrados.
                    </p>
                  ) : (
                    <div className="overflow-auto rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)]">
                      <table className="min-w-full text-xs md:text-sm">
                        <thead>
                          <tr className="bg-[var(--bg-header-subtle)] text-[var(--text-secondary)]">
                            <th className="px-3 py-2 text-left font-medium">
                              Producto
                            </th>
                            <th className="px-3 py-2 text-right font-medium">
                              Cantidad
                            </th>
                            <th className="px-3 py-2 text-right font-medium">
                              P. Unitario
                            </th>
                            <th className="px-3 py-2 text-right font-medium">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {comanda.detalles.map((det) => (
                            <tr
                              key={det.pedidoDetalleId}
                              className="border-t border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
                            >
                              <td className="px-3 py-2 align-middle">
                                {det.productoNombre}
                              </td>
                              <td className="px-3 py-2 text-right align-middle">
                                {det.cantidad}
                              </td>
                              <td className="px-3 py-2 text-right align-middle">
                                {formatearMoneda(det.precioUnitario)}
                              </td>
                              <td className="px-3 py-2 text-right align-middle font-semibold">
                                {formatearMoneda(det.subtotal)}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t border-[var(--border-subtle)] bg-[var(--bg-header-subtle)]">
                            <td
                              className="px-3 py-2 text-right text-xs font-medium text-[var(--text-secondary)]"
                              colSpan={3}
                            >
                              Total comanda
                            </td>
                            <td className="px-3 py-2 text-right text-sm font-semibold text-[var(--text-main)]">
                              {formatearMoneda(comanda.total)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
