'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { usePedido } from './_hooks/usePedido';

import Encabezado from './_components/Encabezado';
import PanelCatalogo from './_components/PanelCatalogo';
import PanelDetalle from './_components/PanelDetalle';

export default function PedidoPage() {
  const params = useParams<{ pedidoId: string }>();
  const pedidoId = Number(params.pedidoId);

  const {
    cargandoTodo,
    error,
    detalles,
    catalogo,
    categoriaActivaId,
    setCategoriaActivaId,
    metodosPago,
    metodoPagoSeleccionadoId,
    setMetodoPagoSeleccionadoId,
    total,
    procesandoAccion,
    finalizando,
    handleAgregarProducto,
    handleCambiarCantidad,
    handleEliminarDetalle,
    handleFinalizarPedido,
    getCantidadCatalogo,
    cambiarCantidadCatalogo,
    setCantidadCatalogoDirecto,
  } = usePedido(pedidoId);

  return (
    <section
      className="
        w-full max-w-full 
        px-3 sm:px-4 
        pb-24 pt-2 sm:pt-4 
        overflow-x-hidden space-y-4
      "
    >
      <Encabezado
        pedidoId={pedidoId}
        detalles={detalles}
        finalizando={finalizando}
        procesandoAccion={procesandoAccion}
        metodoPagoSeleccionadoId={metodoPagoSeleccionadoId}
        onFinalizar={handleFinalizarPedido}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* ===========================
          LAYOUT POS EN DOS COLUMNAS
         =========================== */}

      <div
        className="
          grid gap-4
          sm:grid-cols-[minmax(0,1fr)_360px]   /* 2 columnas desde 640px */
          xl:grid-cols-[minmax(0,1fr)_420px]   /* desktop ancho panel */
          w-full overflow-x-hidden
        "
      >
        <PanelCatalogo
          catalogo={catalogo}
          categoriaActivaId={categoriaActivaId}
          setCategoriaActivaId={setCategoriaActivaId}
          procesandoAccion={procesandoAccion}
          getCantidadCatalogo={getCantidadCatalogo}
          cambiarCantidadCatalogo={cambiarCantidadCatalogo}
          setCantidadCatalogoDirecto={setCantidadCatalogoDirecto}
          onAgregarProducto={handleAgregarProducto}
          order="order-1"
        />

        <PanelDetalle
          detalles={detalles}
          cargando={cargandoTodo}
          procesandoAccion={procesandoAccion}
          metodoPagoSeleccionadoId={metodoPagoSeleccionadoId}
          setMetodoPagoSeleccionadoId={setMetodoPagoSeleccionadoId}
          metodosPago={metodosPago}
          onCambiarCantidad={handleCambiarCantidad}
          onEliminarDetalle={handleEliminarDetalle}
          total={total}
          order="order-2"
        />
      </div>

      {/* TOTAL SOLO EN MOBILE */}
      <div
        className="
          fixed bottom-0 left-0 right-0 
          bg-[var(--bg-card)]/95 backdrop-blur-xl
          border-t border-[var(--border-color)]
          px-4 py-3 flex items-center justify-between
          sm:hidden
          shadow-lg
        "
      >
        <span className="text-lg font-semibold text-[var(--text-main)]">
          Q {total.toFixed(2)}
        </span>

        <button
          onClick={handleFinalizarPedido}
          disabled={
            finalizando ||
            procesandoAccion ||
            detalles.length === 0 ||
            !metodoPagoSeleccionadoId
          }
          className="
            inline-flex items-center justify-center
            rounded-[var(--radius-md)]
            bg-emerald-500 px-4 py-2
            text-sm font-semibold text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            active:scale-[0.97] transition
          "
        >
          Finalizar
        </button>
      </div>
    </section>
  );
}
