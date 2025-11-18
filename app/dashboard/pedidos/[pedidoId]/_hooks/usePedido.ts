'use client';

import { useEffect, useMemo, useState } from 'react';
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

export function usePedido(pedidoId: number) {
  const { showToast } = useToast();

  const [catalogo, setCatalogo] = useState<CategoriaConProductosDTO[]>([]);
  const [detalles, setDetalles] = useState<PedidoDetalleDTO[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPagoDTO[]>([]);

  const [categoriaActivaId, setCategoriaActivaId] = useState<number | null>(null);
  const [metodoPagoSeleccionadoId, setMetodoPagoSeleccionadoId] = useState<number | null>(null);

  const [cantidadesCatalogo, setCantidadesCatalogo] = useState<Record<number, number>>({});

  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [cargandoMetodosPago, setCargandoMetodosPago] = useState(false);

  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔵 TOTAL
  const total = useMemo(
    () =>
      detalles.reduce(
        (acc, d) => acc + (d.subtotal ?? d.cantidad * d.precioUnitario),
        0
      ),
    [detalles]
  );

  const cargandoTodo =
    cargandoCatalogo || cargandoDetalles || (!catalogo.length && !detalles.length);

  // ======================================================
  //  Helpers de cantidades (catálogo)
  // ======================================================
  function getCantidadCatalogo(id: number) {
    return cantidadesCatalogo[id] ?? 1;
  }

  function cambiarCantidadCatalogo(id: number, delta: number) {
    setCantidadesCatalogo(prev => {
      const actual = prev[id] ?? 1;
      const nuevo = Math.min(Math.max(actual + delta, 1), 99);
      return { ...prev, [id]: nuevo };
    });
  }

  function setCantidadCatalogoDirecto(id: number, valor: number) {
    if (!Number.isFinite(valor) || valor < 1) valor = 1;
    setCantidadesCatalogo(prev => ({
      ...prev,
      [id]: Math.min(Math.max(Math.round(valor), 1), 99),
    }));
  }

  // ======================================================
  //  Cargar datos
  // ======================================================
  async function cargarCatalogo() {
    try {
      setCargandoCatalogo(true);
      const data = await obtenerCatalogoConProductos();
      setCatalogo(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar catálogo';
      setError(msg);
      showToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setCargandoCatalogo(false);
    }
  }

  async function cargarDetalles() {
    try {
      setCargandoDetalles(true);
      const data = await obtenerPedidoDetalle(pedidoId);
      setDetalles(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar la comanda';
      setError(msg);
      showToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setCargandoDetalles(false);
    }
  }

  async function cargarMetodosPago() {
    try {
      setCargandoMetodosPago(true);
      const data = await obtenerMetodosPago();
      setMetodosPago(data);

      if (data.length === 1) {
        setMetodoPagoSeleccionadoId(data[0].metodoPagoId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar métodos de pago';
      showToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setCargandoMetodosPago(false);
    }
  }

  // ============ Cargar todo al inicio ============
  useEffect(() => {
    if (!pedidoId || Number.isNaN(pedidoId)) return;

    setError(null);
    cargarCatalogo();
    cargarDetalles();
    cargarMetodosPago();
  }, [pedidoId]);

  // ============ Seleccionar categoría por defecto ============
  useEffect(() => {
    if (catalogo.length > 0 && categoriaActivaId === null) {
      setCategoriaActivaId(catalogo[0].categoriaId);
    }
  }, [catalogo, categoriaActivaId]);

  // ======================================================
  //  Acciones: agregar, cambiar cantidad, eliminar
  // ======================================================
  async function handleAgregarProducto(
    productoId: number,
    nombre: string,
    cantidad: number
  ) {
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

  async function handleCambiarCantidad(detalle: PedidoDetalleDTO, nuevaCantidad: number) {
    if (nuevaCantidad <= 0) {
      const confirmar = await new Promise<boolean>(resolve => {
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

  async function handleEliminarDetalle(detalle: PedidoDetalleDTO) {
    const confirmar = await new Promise<boolean>(resolve => {
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

  // ======================================================
  //  Finalizar pedido
  // ======================================================
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

    const metodo = metodosPago.find(
      m => m.metodoPagoId === metodoPagoSeleccionadoId
    );

    const confirmar = await new Promise<boolean>(resolve => {
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo finalizar.';
      showToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setFinalizando(false);
    }
  }

  return {
    // estado
    catalogo,
    detalles,
    categoriaActivaId,
    setCategoriaActivaId,
    metodosPago,
    metodoPagoSeleccionadoId,
    setMetodoPagoSeleccionadoId,
    total,
    error,

    // loading
    cargandoTodo,
    procesandoAccion,
    finalizando,

    // helpers cantidades
    getCantidadCatalogo,
    cambiarCantidadCatalogo,
    setCantidadCatalogoDirecto,

    // acciones
    handleAgregarProducto,
    handleCambiarCantidad,
    handleEliminarDetalle,
    handleFinalizarPedido,
  };
}
