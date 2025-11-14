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
import { Loader2, Plus, Trash2, ArrowLeft, CheckCircle2 } from 'lucide-react';

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

  const total = useMemo(
    () => detalles.reduce((acc, d) => acc + (d.subtotal ?? d.cantidad * d.precioUnitario), 0),
    [detalles]
  );

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

  async function handleAgregarProducto(
    productoId: number,
    nombreProducto: string
  ) {
    if (!pedidoId) return;

    const cantidadStr = window.prompt(
      `¿Cuántas unidades de "${nombreProducto}" deseas agregar?`,
      '1'
    );
    if (!cantidadStr) return;

    const cantidad = Number(cantidadStr);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      showToast({
        type: 'warning',
        title: 'Cantidad inválida',
        message: 'Ingresa una cantidad numérica mayor a cero.',
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
      // Si es 0, preguntamos si desea eliminar
      const confirmarEliminar = window.confirm(
        `La cantidad es 0. ¿Deseas eliminar "${detalle.nombreProducto}" de la comanda?`
      );
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
    const confirmar = window.confirm(
      `¿Deseas eliminar "${detalle.nombreProducto}" de la comanda?`
    );
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

      // Al finalizar, regresamos a las mesas
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
    cargandoCatalogo || cargandoDetalles || (!catalogo.length && !detalles.length);

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
              bg-[var(--bg-elevated)] px-2 py-1 text-xs
              text-[var(--text-main)] hover:bg-[var(--bg-hover)]
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
              Agrega productos a la comanda, ajusta cantidades y finaliza el pedido.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFinalizarPedido}
          disabled={finalizando || procesandoAccion || detalles.length === 0}
          className="
            inline-flex items-center gap-2 rounded-[var(--radius-md)]
            bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white
            hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {finalizando && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          <CheckCircle2 className="h-4 w-4" />
          <span>Finalizar pedido</span>
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}

      {/* CONTENIDO PRINCIPAL: IZQUIERDA CATÁLOGO / DERECHA COMANDA */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
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
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {catalogo.map((cat) => (
                <div key={cat.categoriaId} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    {cat.nombre}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.productos.map((prod) => (
                      <button
                        key={prod.productoId}
                        type="button"
                        disabled={procesandoAccion}
                        onClick={() =>
                          handleAgregarProducto(
                            prod.productoId,
                            prod.nombre
                          )
                        }
                        className="
                          flex flex-col items-start rounded-[var(--radius-md)]
                          border border-[var(--border-color)]
                          bg-[var(--bg-elevated)] px-3 py-2 text-left
                          hover:bg-[var(--bg-hover)] transition
                          disabled:opacity-60 disabled:cursor-not-allowed
                        "
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-[var(--text-main)]">
                              {prod.nombre}
                            </p>
                            {prod.descripcion && (
                              <p className="mt-0.5 text-[11px] text-[var(--text-muted)] line-clamp-2">
                                {prod.descripcion}
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-[var(--text-main)] whitespace-nowrap">
                            Q {prod.precio.toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                          <Plus className="h-3 w-3" />
                          <span>Agregar a comanda</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
                              px-1 py-0.5 text-center text-xs
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
                              rounded-full p-1
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
                <span className="text-lg font-semibold text-[var(--text-main)]">
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
