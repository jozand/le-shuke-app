'use client';

import React from 'react';
import type { PedidoDetalleDTO, MetodoPagoDTO } from '@/app/lib/admin-api';
import { Loader2, Minus, Plus, Trash2 } from 'lucide-react';

interface Props {
  detalles: PedidoDetalleDTO[];
  cargando: boolean;
  procesandoAccion: boolean;

  metodosPago: MetodoPagoDTO[];
  metodoPagoSeleccionadoId: number | null;
  setMetodoPagoSeleccionadoId: (id: number) => void;

  onCambiarCantidad: (detalle: PedidoDetalleDTO, nuevaCantidad: number) => void;
  onEliminarDetalle: (detalle: PedidoDetalleDTO) => void;

  total: number;
  order: string;
}

export default function PanelDetalle({
  detalles,
  cargando,
  procesandoAccion,
  metodosPago,
  metodoPagoSeleccionadoId,
  setMetodoPagoSeleccionadoId,
  onCambiarCantidad,
  onEliminarDetalle,
  total,
  order,
}: Props) {
  return (
    <div
      className={`
        rounded-[var(--radius-lg)] border border-[var(--border-color)]
        bg-[var(--bg-card)] shadow-[var(--shadow-card)]
        p-3 sm:p-4 w-full overflow-hidden
        ${order}
      `}
    >
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[var(--text-main)]">
          Detalle de la comanda
        </h2>

        {cargando && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Cargando…</span>
          </span>
        )}
      </div>

      {/* SIN DETALLES */}
      {detalles.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          Aún no has agregado productos.
        </p>
      ) : (
        <>
          {/* ===========================================
              MOBILE + IPAD → CARDS (NO TABLA)
           =========================================== */}
          <div className="xl:hidden space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {detalles.map(det => (
              <div
                key={det.pedidoDetalleId}
                className="
                  rounded-[var(--radius-md)] border border-[var(--border-color)]
                  bg-[var(--bg-elevated)] p-3 flex flex-col gap-3
                "
              >
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {det.nombreProducto}
                    </p>

                    {det.categoriaNombre && (
                      <p className="text-[11px] text-[var(--text-muted)] truncate">
                        {det.categoriaNombre}
                      </p>
                    )}
                  </div>

                  <p className="font-semibold whitespace-nowrap">
                    Q {(det.subtotal ?? det.cantidad * det.precioUnitario).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--text-secondary)]">
                    Cantidad
                  </span>

                  <div
                    className="
                      inline-flex items-center justify-center gap-1
                      rounded-full border border-[var(--border-color)]
                      bg-[var(--bg-elevated)] px-2 py-1
                    "
                  >
                    <button
                      onClick={() => onCambiarCantidad(det, det.cantidad - 1)}
                      disabled={procesandoAccion}
                      style={{ width: 32, height: 32 }}
                      className="
                        flex items-center justify-center rounded-full
                        bg-[var(--bg-elevated)] active:bg-[var(--bg-hover)]
                        transition active:scale-95
                      "
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <span className="w-8 text-center font-semibold">
                      {det.cantidad}
                    </span>

                    <button
                      onClick={() => onCambiarCantidad(det, det.cantidad + 1)}
                      disabled={procesandoAccion}
                      style={{ width: 32, height: 32 }}
                      className="
                        flex items-center justify-center rounded-full
                        bg-[var(--bg-elevated)] active:bg-[var(--bg-hover)]
                        transition active:scale-95
                      "
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => onEliminarDetalle(det)}
                  disabled={procesandoAccion}
                  className="
                    flex items-center justify-center gap-2
                    rounded-[var(--radius-md)]
                    text-red-400 bg-[var(--bg-elevated)]
                    active:bg-red-500/10
                    px-3 py-2 text-xs font-medium
                    transition active:scale-95
                  "
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            ))}
          </div>

          {/* ===========================================
              DESKTOP → TABLA COMPLETA
           =========================================== */}
          <div
            className="
              hidden xl:block
              max-h-[50vh] overflow-y-auto
              rounded-[var(--radius-md)]
              border border-[var(--border-color)]
            "
          >
            <table className="w-full text-xs">
              <thead className="bg-[var(--bg-elevated)] sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold">Producto</th>
                  <th className="px-2 py-2 text-center font-semibold">Cant.</th>
                  <th className="px-2 py-2 text-right font-semibold">P. Unit.</th>
                  <th className="px-2 py-2 text-right font-semibold">Subtotal</th>
                  <th className="px-2 py-2 text-center font-semibold">Acción</th>
                </tr>
              </thead>

              <tbody>
                {detalles.map(det => (
                  <tr
                    key={det.pedidoDetalleId}
                    className="border-t border-[var(--border-color)]"
                  >
                    <td className="px-2 py-2 align-top max-w-[150px] truncate">
                      <p className="font-medium truncate">{det.nombreProducto}</p>

                      {det.categoriaNombre && (
                        <p className="text-[11px] text-[var(--text-muted)] truncate">
                          {det.categoriaNombre}
                        </p>
                      )}
                    </td>

                    <td className="px-2 py-2 text-center">
                      <div
                        className="
                          inline-flex items-center justify-center gap-1
                          rounded-full border border-[var(--border-color)]
                          bg-[var(--bg-elevated)] px-2 py-1
                        "
                      >
                        <button
                          onClick={() => onCambiarCantidad(det, det.cantidad - 1)}
                          disabled={procesandoAccion}
                          style={{ width: 36, height: 36 }}
                          className="
                            flex items-center justify-center rounded-full
                            bg-[var(--bg-elevated)] active:bg-[var(--bg-hover)]
                            transition active:scale-95
                          "
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <span className="w-8 text-center font-semibold">
                          {det.cantidad}
                        </span>

                        <button
                          onClick={() => onCambiarCantidad(det, det.cantidad + 1)}
                          disabled={procesandoAccion}
                          style={{ width: 36, height: 36 }}
                          className="
                            flex items-center justify-center rounded-full
                            bg-[var(--bg-elevated)] active:bg-[var(--bg-hover)]
                            transition active:scale-95
                          "
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>

                    <td className="px-2 py-2 text-right">
                      Q {det.precioUnitario.toFixed(2)}
                    </td>

                    <td className="px-2 py-2 text-right">
                      Q {(det.subtotal ?? det.cantidad * det.precioUnitario).toFixed(2)}
                    </td>

                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => onEliminarDetalle(det)}
                        disabled={procesandoAccion}
                        className="
                          flex items-center justify-center gap-2
                          rounded-[var(--radius-md)]
                          text-red-400 bg-[var(--bg-elevated)]
                          active:bg-red-500/10
                          px-3 py-2 transition active:scale-95
                        "
                        style={{ minHeight: 40 }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MÉTODO DE PAGO */}
          <div className="space-y-2 mt-4">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Método de pago
            </span>

            <div className="flex flex-wrap gap-2">
              {metodosPago.map(mp => (
                <label
                  key={mp.metodoPagoId}
                  className={`
                    inline-flex items-center gap-2 
                    rounded-full border px-3 py-1.5 
                    text-xs cursor-pointer transition 
                    touch-manipulation
                    ${metodoPagoSeleccionadoId === mp.metodoPagoId
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="metodoPago"
                    className="h-3 w-3"
                    checked={metodoPagoSeleccionadoId === mp.metodoPagoId}
                    onChange={() => setMetodoPagoSeleccionadoId(mp.metodoPagoId)}
                  />
                  <span className="font-medium">{mp.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* TOTAL */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border-color)]">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Total
            </span>
            <span className="text-xl font-semibold text-[var(--text-main)]">
              Q {total.toFixed(2)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
