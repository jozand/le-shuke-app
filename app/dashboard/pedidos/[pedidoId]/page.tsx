'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  obtenerCatalogoConProductos,
  obtenerPedidoDetalle,
  agregarProductoAPedido,
  actualizarCantidadDetalle,
  eliminarDetallePedido,
  finalizarPedido,
  obtenerMetodosPago,
  type CategoriaConProductosDTO,
  type PedidoDetalleDTO,
  type MetodoPagoDTO,
} from '@/app/lib/admin-api';
import { useToast } from '@/context/ToastContext';
import {
  Loader2,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export default function PedidoPage() {
  const params = useParams<{ pedidoId: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const pedidoId = Number(params.pedidoId);

  const [catalogo, setCatalogo] = useState<CategoriaConProductosDTO[]>([]);
  const [detalles, setDetalles] = useState<PedidoDetalleDTO[]>([]);

  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cantidadesCatalogo, setCantidadesCatalogo] = useState<Record<number, number>>({});
  const [categoriaActivaId, setCategoriaActivaId] = useState<number | null>(null);

  const [metodosPago, setMetodosPago] = useState<MetodoPagoDTO[]>([]);
  const [metodoPagoSeleccionadoId, setMetodoPagoSeleccionadoId] = useState<number | null>(null);
  const [cargandoMetodosPago, setCargandoMetodosPago] = useState(false);

  // TOTAL
  const total = useMemo(
    () =>
      detalles.reduce(
        (acc, d) => acc + (d.subtotal ?? d.cantidad * d.precioUnitario),
        0
      ),
    [detalles]
  );

  function getCantidadCatalogo(id: number) {
    return cantidadesCatalogo[id] ?? 1;
  }

  function cambiarCantidadCatalogo(id: number, delta: number) {
    setCantidadesCatalogo((prev) => {
      const actual = prev[id] ?? 1;
      const nuevo = Math.min(Math.max(actual + delta, 1), 99);
      return { ...prev, [id]: nuevo };
    });
  }

  function setCantidadCatalogoDirecto(id: number, valor: number) {
    if (!Number.isFinite(valor) || valor < 1) valor = 1;
    setCantidadesCatalogo((prev) => ({
      ...prev,
      [id]: Math.min(Math.max(Math.round(valor), 1), 99),
    }));
  }

  // Cargar catálogo
  async function cargarCatalogo() {
    try {
      setCargandoCatalogo(true);
      const data = await obtenerCatalogoConProductos();
      setCatalogo(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error al cargar catálogo';

      setError(msg);
      showToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setCargandoCatalogo(false);
    }
  }

  // Cargar detalles
  async function cargarDetalles() {
    try {
      setCargandoDetalles(true);
      const data = await obtenerPedidoDetalle(pedidoId);
      setDetalles(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error al cargar la comanda';

      setError(msg);
      showToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setCargandoDetalles(false);
    }
  }

  // Cargar métodos de pago
  async function cargarMetodosPago() {
    try {
      setCargandoMetodosPago(true);
      const data = await obtenerMetodosPago();
      setMetodosPago(data);
      if (data.length === 1) setMetodoPagoSeleccionadoId(data[0].metodoPagoId);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error al cargar métodos de pago';

      showToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setCargandoMetodosPago(false);
    }
  }

  useEffect(() => {
    if (!pedidoId || Number.isNaN(pedidoId)) return;
    setError(null);
    cargarCatalogo();
    cargarDetalles();
    cargarMetodosPago();
  }, [pedidoId]);

  useEffect(() => {
    if (catalogo.length > 0 && categoriaActivaId === null) {
      setCategoriaActivaId(catalogo[0].categoriaId);
    }
  }, [catalogo, categoriaActivaId]);

  // =============================
  // Agregar producto
  // =============================
  async function handleAgregarProducto(productoId: number, nombre: string, cantidad: number) {
    if (!pedidoId) return;

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return showToast({
        type: 'warning',
        title: 'Cantidad inválida',
        message: 'Ingresa una cantidad mayor a cero.',
      });
    }

    try {
      setProcesandoAccion(true);
      await agregarProductoAPedido({ pedidoId, productoId, cantidad });
      await cargarDetalles();

      showToast({
        type: 'success',
        title: 'Producto agregado',
        message: `Se agregaron ${cantidad} unidad(es) de "${nombre}".`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo agregar el producto.';
      showToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setProcesandoAccion(false);
    }
  }

  // =============================
  // Cambiar cantidad detalle
  // =============================
  async function handleCambiarCantidad(detalle: PedidoDetalleDTO, nuevaCantidad: number) {
    if (nuevaCantidad <= 0) {
      const confirmar = await new Promise<boolean>((resolve) => {
        showToast({
          type: 'confirm',
          title: 'Eliminar producto',
          message: `¿Eliminar "${detalle.nombreProducto}"?`,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });

      if (!confirmar) return;
      return handleEliminarDetalle(detalle);
    }

    try {
      setProcesandoAccion(true);
      await actualizarCantidadDetalle({
        pedidoDetalleId: detalle.pedidoDetalleId,
        cantidad: nuevaCantidad,
      });
      await cargarDetalles();

      showToast({
        type: 'success',
        title: 'Cantidad actualizada',
        message: `Se actualizó "${detalle.nombreProducto}".`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo actualizar.';
      showToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setProcesandoAccion(false);
    }
  }

  // =============================
  // Eliminar detalle
  // =============================
  async function handleEliminarDetalle(detalle: PedidoDetalleDTO) {
    const confirmar = await new Promise<boolean>((resolve) => {
      showToast({
        type: 'confirm',
        title: 'Eliminar producto',
        message: `¿Eliminar "${detalle.nombreProducto}" de la comanda?`,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

    if (!confirmar) return;

    try {
      setProcesandoAccion(true);
      await eliminarDetallePedido(detalle.pedidoDetalleId);
      await cargarDetalles();

      showToast({
        type: 'success',
        title: 'Producto eliminado',
        message: `"${detalle.nombreProducto}" fue eliminado.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo eliminar.';
      showToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setProcesandoAccion(false);
    }
  }

  // =============================
  // Finalizar
  // =============================
  async function handleFinalizarPedido() {
    if (!pedidoId) return;

    if (detalles.length === 0) {
      return showToast({
        type: 'warning',
        title: 'Sin productos',
        message: 'No puedes finalizar una comanda sin productos.',
      });
    }

    if (!metodoPagoSeleccionadoId) {
      return showToast({
        type: 'warning',
        title: 'Método de pago',
        message: 'Selecciona un método de pago.',
      });
    }

    const metodo = metodosPago.find((m) => m.metodoPagoId === metodoPagoSeleccionadoId);

    const confirmar = await new Promise<boolean>((resolve) => {
      showToast({
        type: 'confirm',
        title: 'Finalizar pedido',
        message: `¿Finalizar con: ${metodo?.nombre}?`,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

    if (!confirmar) return;

    try {
      setFinalizando(true);
      await finalizarPedido(pedidoId, metodoPagoSeleccionadoId);

      showToast({
        type: 'success',
        title: 'Pedido finalizado',
        message: 'La comanda se finalizó correctamente.',
      });

      router.push('/dashboard/mesas');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo finalizar.';
      showToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setFinalizando(false);
    }
  }

  const cargando =
    cargandoCatalogo ||
    cargandoDetalles ||
    (!catalogo.length && !detalles.length);

  const categoriaActiva = categoriaActivaId
    ? catalogo.find((c) => c.categoriaId === categoriaActivaId) ?? null
    : null;

  return (
    <section className="space-y-4 pb-10">

      {/* ============ ENCABEZADO ============ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/mesas')}
            className="
              inline-flex items-center gap-2
              rounded-[var(--radius-md)] border border-[var(--border-color)]
              bg-[var(--bg-elevated)] px-4 py-3
              text-sm text-[var(--text-main)]
              hover:bg-[var(--bg-hover)] active:scale-95
              transition
            "
            style={{ minHeight: 44 }}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden xs:inline">Volver</span>
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">
              Comanda #{pedidoId}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)]">
              Toca, suma, resta y finaliza fácilmente.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFinalizarPedido}
          disabled={
            finalizando ||
            procesandoAccion ||
            detalles.length === 0 ||
            !metodoPagoSeleccionadoId
          }
          className="
            inline-flex items-center justify-center gap-2
            rounded-[var(--radius-md)]
            bg-emerald-500 px-6 py-3
            text-sm font-semibold text-white
            hover:bg-emerald-600
            disabled:opacity-50 disabled:cursor-not-allowed
            active:scale-[0.98] transition
            w-full sm:w-auto
          "
        >
          {finalizando && <Loader2 className="h-4 w-4 animate-spin" />}
          <CheckCircle2 className="h-4 w-4" />
          Finalizar
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* ========================================================= */}
      {/* GRID RESPONSIVO (CATÁLOGO + DETALLE) */}
      {/* ========================================================= */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* ========================================================= */}
        {/* CATÁLOGO */}
        {/* ========================================================= */}
        <div
          className="
            rounded-[var(--radius-lg)] border border-[var(--border-color)]
            bg-[var(--bg-card)] shadow-[var(--shadow-card)]
            p-4
          "
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">
              Catálogo de productos
            </h2>

            {cargandoCatalogo && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Cargando…</span>
              </span>
            )}
          </div>

          {catalogo.length === 0 && !cargandoCatalogo ? (
            <p className="text-sm text-[var(--text-secondary)]">
              No hay productos disponibles.
            </p>
          ) : (
            <>
              {/* -------- TABS DE CATEGORÍAS -------- */}
              <div className="mb-3 border-b border-[var(--border-color)]">
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {catalogo.map((cat) => {
                    const activa = cat.categoriaId === categoriaActivaId;
                    return (
                      <button
                        key={cat.categoriaId}
                        type="button"
                        onClick={() => setCategoriaActivaId(cat.categoriaId)}
                        className={`
                          relative inline-flex items-center whitespace-nowrap
                          rounded-full px-3 py-1.5 text-xs font-medium border transition
                          ${activa
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                            : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                          }
                        `}
                      >
                        {cat.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* -------- PRODUCTOS DE LA CATEGORÍA -------- */}
              <div className="max-h-[70vh] overflow-y-auto pr-1">
                {categoriaActiva && categoriaActiva.productos.length > 0 ? (
                  <div
                    className="
                      grid grid-cols-1 
                      sm:grid-cols-2 
                      xl:grid-cols-3 
                      gap-3
                    "
                  >
                    {categoriaActiva.productos.map((prod) => {
                      const cantidad = getCantidadCatalogo(prod.productoId);

                      return (
                        <div
                          key={prod.productoId}
                          className="
                            flex flex-col justify-between gap-2
                            rounded-[var(--radius-md)]
                            border border-[var(--border-color)]
                            bg-[var(--bg-elevated)]
                            px-3 py-3
                            hover:bg-[var(--bg-hover)] transition
                          "
                        >
                          {/* Nombre + descripción */}
                          <div className="flex w-full items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-[var(--text-main)]">
                                {prod.nombre}
                              </p>

                              {prod.descripcion && (
                                <p className="mt-1 text-[11px] text-[var(--text-muted)] line-clamp-3">
                                  {prod.descripcion}
                                </p>
                              )}
                            </div>

                            {/* Precio */}
                            <span
                              className="
                                text-xs font-bold text-[var(--text-main)]
                                whitespace-nowrap rounded-full
                                border border-[var(--border-color)]
                                px-2 py-1
                              "
                            >
                              Q {prod.precio.toFixed(2)}
                            </span>
                          </div>

                          {/* Cantidad + botón agregar */}
                          <div className="mt-1 flex flex-col gap-3">

                            {/* Selector táctil */}
                            <div
                              className="
                                inline-flex items-center justify-between
                                rounded-full border border-[var(--border-color)]
                                bg-[var(--bg-card)] px-2 py-1
                                w-full sm:w-auto
                              "
                            >
                              {/* - */}
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarCantidadCatalogo(prod.productoId, -1)
                                }
                                disabled={procesandoAccion}
                                className="
                                  flex items-center justify-center rounded-full 
                                  bg-[var(--bg-elevated)] active:bg-[var(--bg-hover)]
                                  transition active:scale-95
                                "
                                style={{ width: 40, height: 40 }}
                              >
                                <Minus className="h-5 w-5" />
                              </button>

                              {/* INPUT */}
                              <input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                min={1}
                                max={99}
                                className="
                                  w-14 mx-1 text-center text-base
                                  bg-transparent border-none 
                                  focus:outline-none appearance-none
                                "
                                style={{ fontSize: 16 }}
                                value={cantidad}
                                onChange={(e) =>
                                  setCantidadCatalogoDirecto(
                                    prod.productoId,
                                    Number(e.target.value)
                                  )
                                }
                              />

                              {/* + */}
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarCantidadCatalogo(prod.productoId, 1)
                                }
                                disabled={procesandoAccion}
                                className="
                                  flex items-center justify-center rounded-full 
                                  bg-[var(--bg-elevated)] active:bg-[var(--bg-hover)]
                                  transition active:scale-95
                                "
                                style={{ width: 40, height: 40 }}
                              >
                                <Plus className="h-5 w-5" />
                              </button>
                            </div>

                            {/* Botón agregar */}
                            <button
                              type="button"
                              disabled={procesandoAccion}
                              onClick={() =>
                                handleAgregarProducto(
                                  prod.productoId,
                                  prod.nombre,
                                  cantidad
                                )
                              }
                              className="
                                inline-flex items-center justify-center
                                rounded-[var(--radius-md)]
                                bg-emerald-500 px-3 py-2 
                                text-xs font-semibold text-white
                                hover:bg-emerald-600
                                disabled:opacity-55 disabled:cursor-not-allowed
                                active:scale-[0.97] transition
                                w-full sm:w-auto sm:self-end
                              "
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Agregar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">
                    No hay productos configurados para esta categoría.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ========================================================= */}
        {/* DETALLE DE LA COMANDA — MODO RESPONSIVE (TABLE + CARDS) */}
        {/* ========================================================= */}
        <div
          className="
            rounded-[var(--radius-lg)] border border-[var(--border-color)]
            bg-[var(--bg-card)] shadow-[var(--shadow-card)]
            p-4
          "
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">
              Detalle de la comanda
            </h2>

            {cargandoDetalles && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Cargando…</span>
              </span>
            )}
          </div>

          {/* SI NO HAY PRODUCTOS */}
          {detalles.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Aún no has agregado productos.
            </p>
          ) : (
            <div className="space-y-5">

              {/* -------- CARDS PARA MÓVIL -------- */}
              <div className="md:hidden space-y-3">
                {detalles.map((d) => (
                  <div
                    key={d.pedidoDetalleId}
                    className="
                      rounded-[var(--radius-md)] border border-[var(--border-color)]
                      bg-[var(--bg-elevated)] p-3 flex flex-col gap-3
                    "
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-semibold">{d.nombreProducto}</p>
                        {d.categoriaNombre && (
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {d.categoriaNombre}
                          </p>
                        )}
                      </div>

                      <p className="font-semibold">
                        Q {(d.subtotal ?? d.cantidad * d.precioUnitario).toFixed(2)}
                      </p>
                    </div>

                    {/* Cantidad táctil */}
                    <div className="flex items-center justify-between">
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
                        {/* - */}
                        <button
                          onClick={() =>
                            handleCambiarCantidad(d, d.cantidad - 1)
                          }
                          disabled={procesandoAccion}
                          className="
                            flex items-center justify-center rounded-full 
                            bg-[var(--bg-elevated)]
                            active:bg-[var(--bg-hover)]
                            transition active:scale-95
                          "
                          style={{ width: 34, height: 34 }}
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        {/* Cantidad */}
                        <span className="w-8 text-center font-semibold">
                          {d.cantidad}
                        </span>

                        {/* + */}
                        <button
                          onClick={() =>
                            handleCambiarCantidad(d, d.cantidad + 1)
                          }
                          disabled={procesandoAccion}
                          className="
                            flex items-center justify-center rounded-full 
                            bg-[var(--bg-elevated)]
                            active:bg-[var(--bg-hover)]
                            transition active:scale-95
                          "
                          style={{ width: 34, height: 34 }}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Eliminar */}
                    <button
                      onClick={() => handleEliminarDetalle(d)}
                      disabled={procesandoAccion}
                      className="
                        flex items-center justify-center gap-2
                        rounded-[var(--radius-md)]
                        text-red-400 bg-[var(--bg-elevated)]
                        active:bg-red-500/10
                        px-3 py-2 transition active:scale-95
                      "
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>

              {/* -------- TABLA PARA TABLET / DESKTOP -------- */}
              <div
                className="
                  hidden md:block
                  max-h-[50vh] overflow-y-auto
                  border border-[var(--border-color)]
                  rounded-[var(--radius-md)]
                "
              >
                <table className="min-w-full text-xs">
                  <thead className="bg-[var(--bg-elevated)] sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold">Producto</th>
                      <th className="px-2 py-2 text-center font-semibold">Cant.</th>
                      <th className="px-2 py-2 text-right font-semibold">P. Unit.</th>
                      <th className="px-2 py-2 text-right font-semibold">Subtotal</th>
                      <th className="px-2 py-2 text-center font-semibold">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {detalles.map((d) => (
                      <tr
                        key={d.pedidoDetalleId}
                        className="border-t border-[var(--border-color)]"
                      >
                        {/* PRODUCTO */}
                        <td className="px-2 py-2 align-top">
                          <p className="font-medium">{d.nombreProducto}</p>
                          {d.categoriaNombre && (
                            <p className="text-[11px] text-[var(--text-muted)]">
                              {d.categoriaNombre}
                            </p>
                          )}
                        </td>

                        {/* CANTIDAD */}
                        <td className="px-2 py-2 align-middle text-center">
                          <div
                            className="
                              inline-flex items-center justify-center gap-1
                              rounded-full border border-[var(--border-color)]
                              bg-[var(--bg-elevated)] px-2 py-1
                            "
                          >
                            {/* - */}
                            <button
                              onClick={() =>
                                handleCambiarCantidad(d, d.cantidad - 1)
                              }
                              disabled={procesandoAccion}
                              className="
                                flex items-center justify-center rounded-full 
                                bg-[var(--bg-elevated)]
                                active:bg-[var(--bg-hover)]
                                transition active:scale-95
                              "
                              style={{ width: 36, height: 36 }}
                            >
                              <Minus className="h-4 w-4" />
                            </button>

                            {/* Cantidad */}
                            <span className="w-8 text-center font-semibold">
                              {d.cantidad}
                            </span>

                            {/* + */}
                            <button
                              onClick={() =>
                                handleCambiarCantidad(d, d.cantidad + 1)
                              }
                              disabled={procesandoAccion}
                              className="
                                flex items-center justify-center rounded-full 
                                bg-[var(--bg-elevated)]
                                active:bg-[var(--bg-hover)]
                                transition active:scale-95
                              "
                              style={{ width: 36, height: 36 }}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </td>

                        {/* PRECIO */}
                        <td className="px-2 py-2 text-right">
                          Q {d.precioUnitario.toFixed(2)}
                        </td>

                        {/* SUBTOTAL */}
                        <td className="px-2 py-2 text-right">
                          Q {(d.subtotal ?? d.cantidad * d.precioUnitario).toFixed(2)}
                        </td>

                        {/* ACCION */}
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => handleEliminarDetalle(d)}
                            disabled={procesandoAccion}
                            className="
                              flex items-center justify-center gap-2
                              rounded-[var(--radius-md)]
                              text-red-400 bg-[var(--bg-elevated)]
                              active:bg-red-500/10
                              px-3 py-2 transition active:scale-95
                            "
                            style={{ minHeight: 44 }}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* -------- MÉTODO DE PAGO -------- */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">
                    Método de pago
                  </span>

                  {cargandoMetodosPago && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Cargando…</span>
                    </span>
                  )}
                </div>

                {/* Botones responsivos */}
                <div className="flex flex-wrap gap-2">
                  {metodosPago.map((m) => (
                    <label
                      key={m.metodoPagoId}
                      className={`
                        inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs cursor-pointer transition
                        ${metodoPagoSeleccionadoId === m.metodoPagoId
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="metodoPago"
                        className="h-3 w-3"
                        checked={metodoPagoSeleccionadoId === m.metodoPagoId}
                        onChange={() => setMetodoPagoSeleccionadoId(m.metodoPagoId)}
                      />
                      <span className="font-medium">{m.nombre}</span>

                      {m.descripcion && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {m.descripcion}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* -------- TOTAL -------- */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  Total
                </span>

                <span className="text-xl font-semibold text-[var(--text-main)]">
                  Q {total.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MENSAJE DE CARGA */}
      {cargando && (
        <div className="mt-2 text-xs text-[var(--text-muted)]">
          Cargando información de la comanda…
        </div>
      )}
    </section>
  );
}
