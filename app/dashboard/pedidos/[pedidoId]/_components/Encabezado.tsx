'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2, Printer } from 'lucide-react';
import type { PedidoDetalleDTO } from '@/app/lib/admin-api';

interface Props {
  pedidoId: number;
  detalles: PedidoDetalleDTO[];
  finalizando: boolean;
  procesandoAccion: boolean;
  metodoPagoSeleccionadoId: number | null;
  onFinalizar: () => void;
  onImprimir: () => void;
}

export default function Encabezado({
  pedidoId,
  detalles,
  finalizando,
  procesandoAccion,
  metodoPagoSeleccionadoId,
  onFinalizar,
  onImprimir,
}: Props) {
  const router = useRouter();

  return (
    <div
      className="
        flex flex-col sm:flex-row
        items-start sm:items-center
        justify-between
        gap-3 sm:gap-4
        w-full
      "
    >
      {/* IZQUIERDA */}
      <div className="
        flex items-center gap-3 
        w-full sm:w-auto 
        min-w-0 flex-1
      ">
        <button
          type="button"
          onClick={() => router.push('/dashboard/mesas')}
          className="
            inline-flex items-center gap-2
            rounded-[var(--radius-md)]
            border border-[var(--border-color)]
            bg-[var(--bg-elevated)]
            px-3 py-2.5
            text-sm text-[var(--text-main)]
            hover:bg-[var(--bg-hover)]
            active:scale-95
            transition
            touch-manipulation
            shrink-0
          "
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden xs:inline">Volver</span>
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold text-[var(--text-main)] truncate">
            Comanda #{pedidoId}
          </h1>

          <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)] truncate">
            Toca, suma, resta y finaliza fácilmente.
          </p>
        </div>
      </div>

      {/* DERECHA – SOLO PC/IPAD */}
      <div className="hidden sm:flex items-center gap-3">

        {/* Botón Imprimir */}
        <button
          type="button"
          onClick={onImprimir}
          disabled={detalles.length === 0}
          className="
            inline-flex items-center justify-center
            gap-2
            rounded-[var(--radius-md)]
            bg-sky-500 
            px-5 py-2.5
            text-sm font-semibold text-white
            hover:bg-sky-600
            disabled:opacity-50 disabled:cursor-not-allowed
            active:scale-[0.97] transition
          "
        >
          <Printer className="h-4 w-4" />
          Imprimir
        </button>

        {/* Botón Finalizar */}
        <button
          type="button"
          onClick={onFinalizar}
          disabled={
            finalizando ||
            procesandoAccion ||
            detalles.length === 0 ||
            !metodoPagoSeleccionadoId
          }
          className="
            inline-flex items-center justify-center
            gap-2
            rounded-[var(--radius-md)]
            bg-emerald-500 
            px-5 py-2.5
            text-sm font-semibold text-white
            hover:bg-emerald-600
            disabled:opacity-50 disabled:cursor-not-allowed
            active:scale-[0.97] transition
          "
        >
          {finalizando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Finalizar
        </button>

      </div>
    </div>
  );
}
