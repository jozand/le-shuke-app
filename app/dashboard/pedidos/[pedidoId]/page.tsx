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
  type CategoriaConProductosDTO,
  type PedidoDetalleDTO,
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

  // Cantidades locales por productoId para el catálogo
  const [cantidadesCatalogo, setCantidadesCatalogo] = useState<
    Record<number, number>
  >({});

  // Categoría activa para los tabs
  const [categoriaActivaId, setCategoriaActivaId] = useState<number | null>(
    null
  );

  const total = useMemo(
    () =>
      detalles.reduce(
        (acc, d) => acc + (d.subtotal ?? d.cantidad * d.precioUnitario),
        0
      ),
    [detalles]
  );

  function getCantidadCatalogo(productoId: number) {
    return cantidadesCatalogo[productoId] ?? 1;
  }

  function cambiarCantidadCatalogo(productoId: number, delta: number) {
    setCantidadesCatalogo((prev) => {
      const actual = prev[productoId] ?? 1;
      const nueva = actual + delta;
      if (nueva < 1) return { ...prev, [productoId]: 1 };
      if (nueva > 99) return { ...prev, [productoId]: 99 }; // por si acaso
      return { ...prev, [productoId]: nueva };
    });
  }

  function setCantidadCatalogoDirecto(productoId: number, valor: number) {
    if (!Number.isFinite(valor) || valor <= 0) {
      setCantidadesCatalogo((prev) => ({ ...prev, [productoId]: 1 }));
      return;
    }
    setCantidadesCatalogo((prev) => ({
      ...prev,
      [productoId]: Math.min(Math.max(Math.round(valor), 1), 99),
    }));
  }

  async function cargarCatalogo() {
    try {
      setCargandoCatalogo(true);
      const data = await obtenerCatalogoConProductos();
      setCatalogo(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar catálogo de productos');
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Error al cargar catálogo de productos',
      });
    } finally {
      setCargandoCatalogo(false);
    }
  }

  async function cargarDetalles() {
    try {
      setCargandoDetalles(true);
      const data = await obtenerPedidoDetalle(pedidoId);
      setDetalles(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar la comanda');
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Error al cargar la comanda',
      });
    } finally {
      setCargandoDetalles(false);
    }
  }

  useEffect(() => {
    if (!pedidoId || Number.isNaN(pedidoId)) return;
    setError(null);
    cargarCatalogo();
    cargarDetalles();
  }, [pedidoId]);

  // Cuando se cargue el catálogo, seleccionamos la primera categoría como activa
  useEffect(() => {
    if (catalogo.length > 0 && categoriaActivaId === null) {
      setCategoriaActivaId(catalogo[0].categoriaId);
    }
  }, [catalogo, categoriaActivaId]);

  async function handleAgregarProducto(
    productoId: number,
    nombreProducto: string,
    cantidad: number
  ) {
    if (!pedidoId) return;

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      showToast({
        type: 'warning',
        title: 'Cantidad inválida',
        message: 'Ingresa una cantidad mayor a cero.',
      });
      return;
    }

    try {
      setProcesandoAccion(true);
      await agregarProductoAPedido({ pedidoId, productoId, cantidad });
      await cargarDetalles();

      showToast({
        type: 'success',
        title: 'Producto agregado',
        message: `Se agregaron ${cantidad} unidad(es) de "${nombreProducto}" a la comanda.`,
      });
    } catch (err: any) {
      console.error(err);
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'No se pudo agregar el producto.',
      });
    } finally {
      setProcesandoAccion(false);
    }
  }

  async function handleCambiarCantidad(
    detalle: PedidoDetalleDTO,
    nuevaCantidad: number
  ) {
    if (nuevaCantidad <= 0) {
      // Usamos el mismo esquema de confirm toast que para eliminar
      const confirmarEliminar = await new Promise<boolean>((resolve) => {
        try {
          showToast({
            type: 'confirm',
            title: 'Eliminar producto',
            message: `La cantidad es 0. ¿Deseas eliminar "${detalle.nombreProducto}" de la comanda?`,
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
          });
        } catch {
          const ok = window.confirm(
            `La cantidad es 0. ¿Deseas eliminar "${detalle.nombreProducto}" de la comanda?`
          );
          resolve(ok);
        }
      });

      if (!confirmarEliminar) return;
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
        message: `Se actualizó la cantidad de "${detalle.nombreProducto}".`,
      });
    } catch (err: any) {
      console.error(err);
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'No se pudo actualizar la cantidad.',
      });
    } finally {
      setProcesandoAccion(false);
    }
  }

  async function handleEliminarDetalle(detalle: PedidoDetalleDTO) {
    // Mostrar diálogo de confirmación usando toast
    const confirmar = await new Promise<boolean>((resolve) => {
      try {
        showToast({
          type: 'confirm',
          title: 'Eliminar producto',
          message: `¿Deseas eliminar "${detalle.nombreProducto}" de la comanda?`,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      } catch {
        // Fallback por si falla el toast
        const ok = window.confirm(
          `¿Deseas eliminar "${detalle.nombreProducto}" de la comanda?`
        );
        resolve(ok);
      }
    });

    if (!confirmar) return;

    try {
      setProcesandoAccion(true);
      await eliminarDetallePedido(detalle.pedidoDetalleId);
      await cargarDetalles();

      showToast({
        type: 'success',
        title: 'Producto eliminado',
        message: `"${detalle.nombreProducto}" fue eliminado de la comanda.`,
      });
    } catch (err: any) {
      console.error(err);
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'No se pudo eliminar el producto.',
      });
    } finally {
      setProcesandoAccion(false);
    }
  }

  async function handleFinalizarPedido() {
    if (!pedidoId) return;

    const confirmar = await new Promise<boolean>((resolve) => {
      try {
        showToast({
          type: 'confirm',
          title: 'Finalizar pedido',
          message:
            '¿Deseas finalizar esta comanda? Ya no podrás agregar más productos.',
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      } catch {
        const ok = window.confirm(
          '¿Deseas finalizar esta comanda? Ya no podrás agregar más productos.'
        );
        resolve(ok);
      }
    });

    if (!confirmar) return;

    try {
      setFinalizando(true);
      await finalizarPedido(pedidoId);

      showToast({
        type: 'success',
        title: 'Pedido finalizado',
        message: 'La comanda se finalizó correctamente.',
      });

      router.push('/dashboard/mesas');
    } catch (err: any) {
      console.error(err);
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'No se pudo finalizar el pedido.',
      });
    } finally {
      setFinalizando(false);
    }
  }

  const cargando =
    cargandoCatalogo ||
    cargandoDetalles ||
    (!catalogo.length && !detalles.length);

  // Obtenemos la categoría activa (para mostrar solo esa en el catálogo)
  const categoriaActiva = categoriaActivaId
    ? catalogo.find((c) => c.categoriaId === categoriaActivaId) ?? null
    : null;

  return (
    <section className="space-y-4">
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/mesas')}
            className="
              inline-flex items-center gap-1 rounded-[var(--radius-md)]
              border border-[var(--border-color)]
              bg-[var(--bg-elevated)] px-3 py-2 text-sm
              text-[var(--text-main)] hover:bg-[var(--bg-hover)]
              active:scale-[0.98] transition
            "
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a mesas</span>
          </button>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
              Comanda #{pedidoId}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Diseñado para trabajar cómodo en tablet: toca, suma, resta y
              finaliza el pedido.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFinalizarPedido}
          disabled={finalizando || procesandoAccion || detalles.length === 0}
          className="
            inline-flex items-center gap-2 rounded-[var(--radius-md)]
            bg-emerald-500 px-4 py-2 text-sm font-medium text-white
            hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed
            active:scale-[0.98] transition
          "
        >
          {finalizando && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          <CheckCircle2 className="h-4 w-4" />
          <span>Finalizar pedido</span>
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* CONTENIDO PRINCIPAL: IZQUIERDA CATÁLOGO / DERECHA COMANDA */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* CATÁLOGO */}
        <div
          className="
            rounded-[var(--radius-lg)] border
            border-[var(--border-color)] bg-[var(--bg-card)]
            shadow-[var(--shadow-card)] p-4
          "
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">
              Catálogo de productos
            </h2>
            {cargandoCatalogo && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Cargando...</span>
              </span>
            )}
          </div>

          {catalogo.length === 0 && !cargandoCatalogo ? (
            <p className="text-sm text-[var(--text-secondary)]">
              No hay productos disponibles en el catálogo.
            </p>
          ) : (
            <>
              {/* TABS DE CATEGORÍAS */}
              <div className="mb-3 border-b border-[var(--border-color)]">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {catalogo.map((cat) => {
                    const activa = cat.categoriaId === categoriaActivaId;
                    return (
                      <button
                        key={cat.categoriaId}
                        type="button"
                        onClick={() => setCategoriaActivaId(cat.categoriaId)}
                        className={`
                          relative inline-flex items-center whitespace-nowrap
                          rounded-full px-3 py-1.5 text-xs font-medium
                          border
                          ${activa
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                            : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                          }
                          transition
                        `}
                      >
                        {cat.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LISTADO DE PRODUCTOS DE LA CATEGORÍA ACTIVA */}
              <div className="max-h-[70vh] overflow-y-auto pr-1">
                {categoriaActiva && categoriaActiva.productos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {categoriaActiva.productos.map((prod) => {
                      const cantidad = getCantidadCatalogo(prod.productoId);
                      return (
                        <div
                          key={prod.productoId}
                          className="
                            flex flex-col justify-between
                            rounded-[var(--radius-md)]
                            border border-[var(--border-color)]
                            bg-[var(--bg-elevated)] px-3 py-3
                            hover:bg-[var(--bg-hover)] transition
                            gap-2
                          "
                        >
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
                            <span className="text-xs font-bold text-[var(--text-main)] whitespace-nowrap rounded-full border border-[var(--border-color)] px-2 py-1">
                              Q {prod.precio.toFixed(2)}
                            </span>
                          </div>

                          {/* Selector de cantidad + botón Agregar (touch friendly) */}
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <div
                              className="
                                inline-flex items-center
                                rounded-full border border-[var(--border-color)]
                                bg-[var(--bg-card)] px-2 py-1
                              "
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarCantidadCatalogo(
                                    prod.productoId,
                                    -1
                                  )
                                }
                                disabled={procesandoAccion}
                                className="
                                  p-1 rounded-full
                                  hover:bg-[var(--bg-hover)]
                                  active:scale-95
                                "
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={99}
                                className="
                                  w-12 mx-1 text-center text-sm
                                  bg-transparent border-none
                                  focus:outline-none
                                "
                                value={cantidad}
                                onChange={(e) =>
                                  setCantidadCatalogoDirecto(
                                    prod.productoId,
                                    Number(e.target.value)
                                  )
                                }
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarCantidadCatalogo(
                                    prod.productoId,
                                    1
                                  )
                                }
                                disabled={procesandoAccion}
                                className="
                                  p-1 rounded-full
                                  hover:bg-[var(--bg-hover)]
                                  active:scale-95
                                "
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

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
                                bg-emerald-500 px-3 py-2 text-xs font-semibold text-white
                                hover:bg-emerald-600
                                disabled:opacity-60 disabled:cursor-not-allowed
                                active:scale-[0.97] transition
                              "
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              <span>Agregar</span>
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

        {/* COMANDA ACTUAL */}
        <div
          className="
            rounded-[var(--radius-lg)] border
            border-[var(--border-color)] bg-[var(--bg-card)]
            shadow-[var(--shadow-card)] p-4
          "
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">
              Detalle de la comanda
            </h2>
            {cargandoDetalles && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Cargando...</span>
              </span>
            )}
          </div>

          {detalles.length === 0 && !cargandoDetalles ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Aún no has agregado productos a esta comanda.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="max-h-[50vh] overflow-y-auto border border-[var(--border-color)] rounded-[var(--radius-md)]">
                <table className="min-w-full text-xs">
                  <thead className="bg-[var(--bg-elevated)]">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold text-[var(--text-secondary)]">
                        Producto
                      </th>
                      <th className="px-2 py-2 text-center font-semibold text-[var(--text-secondary)]">
                        Cant.
                      </th>
                      <th className="px-2 py-2 text-right font-semibold text-[var(--text-secondary)]">
                        P. Unit.
                      </th>
                      <th className="px-2 py-2 text-right font-semibold text-[var(--text-secondary)]">
                        Subtotal
                      </th>
                      <th className="px-2 py-2 text-center font-semibold text-[var(--text-secondary)]">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((d) => (
                      <tr
                        key={d.pedidoDetalleId}
                        className="border-t border-[var(--border-color)]"
                      >
                        <td className="px-2 py-2 align-top">
                          <p className="font-medium text-[var(--text-main)]">
                            {d.nombreProducto}
                          </p>
                          {d.categoriaNombre && (
                            <p className="text-[11px] text-[var(--text-muted)]">
                              {d.categoriaNombre}
                            </p>
                          )}
                        </td>
                        <td className="px-2 py-2 align-middle text-center">
                          <input
                            type="number"
                            min={0}
                            className="
                              w-16 rounded-[var(--radius-sm)]
                              border border-[var(--border-color)]
                              bg-[var(--bg-elevated)]
                              px-1 py-1 text-center text-xs
                              focus:outline-none focus:ring-1 focus:ring-emerald-500
                            "
                            value={d.cantidad}
                            onChange={(e) =>
                              handleCambiarCantidad(
                                d,
                                Number(e.target.value)
                              )
                            }
                            disabled={procesandoAccion}
                          />
                        </td>
                        <td className="px-2 py-2 align-middle text-right">
                          Q {d.precioUnitario.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 align-middle text-right">
                          Q{' '}
                          {(
                            d.subtotal ??
                            d.cantidad * d.precioUnitario
                          ).toFixed(2)}
                        </td>
                        <td className="px-2 py-2 align-middle text-center">
                          <button
                            type="button"
                            onClick={() => handleEliminarDetalle(d)}
                            disabled={procesandoAccion}
                            className="
                              inline-flex items-center justify-center
                              rounded-full p-1.5
                              text-red-400 hover:bg-red-500/10
                              disabled:opacity-60 disabled:cursor-not-allowed
                            "
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTAL */}
              <div className="flex items-center justify-between">
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

      {cargando && (
        <div className="mt-2 text-xs text-[var(--text-muted)]">
          Cargando información de la comanda...
        </div>
      )}
    </section>
  );
}
