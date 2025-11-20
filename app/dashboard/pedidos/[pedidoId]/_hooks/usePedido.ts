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
import { useRouter } from 'next/navigation';

// ⭐ IMPORTACIÓN ESTRICTA DE TIPOS PDFMAKE (corrección final)
import type { PdfMakeStatic, TDocumentDefinitions } from "pdfmake/build/pdfmake";

//-------------------------------------------------------
// HOOK PRINCIPAL
//-------------------------------------------------------
export function usePedido(pedidoId: number) {
  const { showToast } = useToast();
  const router = useRouter();

  const [catalogo, setCatalogo] = useState<CategoriaConProductosDTO[]>([]);
  const [detalles, setDetalles] = useState<PedidoDetalleDTO[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPagoDTO[]>([]);

  const [categoriaActivaId, setCategoriaActivaId] = useState<number | null>(null);
  const [metodoPagoSeleccionadoId, setMetodoPagoSeleccionadoId] =
    useState<number | null>(null);

  const [cantidadesCatalogo, setCantidadesCatalogo] = useState<
    Record<number, number>
  >({});

  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [cargandoMetodosPago, setCargandoMetodosPago] = useState(false);

  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //-------------------------------------------------------
  // TOTAL
  //-------------------------------------------------------
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

  //-------------------------------------------------------
  // Helpers cantidades
  //-------------------------------------------------------
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

  //-------------------------------------------------------
  // Cargar datos
  //-------------------------------------------------------
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
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar métodos de pago',
      });
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

  //-------------------------------------------------------
  // Acciones CRUD
  //-------------------------------------------------------
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
      const msg = err instanceof Error ? err.message : 'No se pudo agregar.';
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

      if (!confirmar) return handleEliminarDetalle(detalle);
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
        message: `¿Eliminar "${detalle.nombreProducto}"?`,
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

  //-------------------------------------------------------
  // Finalizar pedido
  //-------------------------------------------------------
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

      router.push('/dashboard/mesas');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo finalizar.';
      showToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setFinalizando(false);
    }
  }

  //-------------------------------------------------------
  // Helpers PDF
  //-------------------------------------------------------
  async function obtenerBase64(ruta: string): Promise<string> {
    const blob = await fetch(ruta).then(res => res.blob());
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  function imprimirPDF(pdfMake: PdfMakeStatic, docDefinition: TDocumentDefinitions) {
    const pdf = pdfMake.createPdf(docDefinition);

    pdf.getBlob((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const win = window.open(url);

      if (!win) return;
      win.onload = () => {
        win.focus();
        win.print();
      };
    });
  }

  //-------------------------------------------------------
  // IMPRIMIR COMANDA
  //-------------------------------------------------------
  async function imprimirComanda() {
    try {
      if (!detalles.length) {
        return showToast({
          type: 'warning',
          title: 'Sin productos',
          message: 'No hay productos para imprimir.',
        });
      }

      const { default: pdfMake } = await import('pdfmake/build/pdfmake');
      const fonts = await import('pdfmake/build/vfs_fonts');

      pdfMake.vfs = fonts.vfs;

      const logoBase64 = await obtenerBase64('/images/logo-le-shuke.png');

      // 🔥 QR ÚNICO PARA LA COMANDA
      const qrValue = `COMANDA-${pedidoId}-${Date.now()}`;

      const doc: TDocumentDefinitions = {
        pageSize: { width: 226, height: 'auto' },
        pageMargins: [10, 10, 10, 10],
        content: [
          // LOGO
          { image: logoBase64, width: 80, alignment: 'center', margin: [0, 0, 0, 10] },

          // TITULO
          { text: 'COMANDA - COCINA', alignment: 'center', bold: true, fontSize: 14 },
          { text: `Pedido #${pedidoId}`, alignment: 'center', margin: [0, 0, 0, 10] },

          // TABLA DE PRODUCTOS
          {
            table: {
              widths: ['auto', '*', 'auto'],
              body: [
                [
                  { text: 'Cant', bold: true },
                  { text: 'Producto', bold: true },
                  { text: 'Subtotal', bold: true }
                ],
                ...detalles.map(d => [
                  d.cantidad.toString(),
                  d.nombreProducto,
                  `Q ${(d.subtotal ?? 0).toFixed(2)}`
                ])
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 10, 0, 10]
          },

          // TOTAL
          {
            text: `Total: Q ${total.toFixed(2)}`,
            alignment: 'right',
            bold: true,
            fontSize: 14,
            margin: [0, 0, 0, 10]
          },

          // 🔥 **QR AÑADIDO**
          { qr: qrValue, fit: 80, alignment: 'center', margin: [0, 10] }
        ]
      };

      imprimirPDF(pdfMake, doc);
    } catch (e) {
      console.error('Error imprimir comanda:', e);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo imprimir.',
      });
    }
  }


  //-------------------------------------------------------
  // IMPRIMIR TICKET CLIENTE
  //-------------------------------------------------------
  async function imprimirTicketCliente() {
    try {
      if (!detalles.length) {
        return showToast({
          type: 'warning',
          title: 'Sin productos',
          message: 'No hay productos para imprimir.',
        });
      }

      const { default: pdfMake } = await import('pdfmake/build/pdfmake');
      const fonts = await import('pdfmake/build/vfs_fonts');

      pdfMake.vfs = fonts.vfs;

      const logoBase64 = await obtenerBase64('/images/logo-le-shuke.png');
      const qrValue = `${pedidoId}-${Date.now()}`;


      const doc: TDocumentDefinitions = {
        pageSize: { width: 226, height: 'auto' },
        pageMargins: [10, 10, 10, 10],
        content: [
          { image: logoBase64, width: 80, alignment: 'center', margin: [0, 0, 0, 10] },
          { text: 'COMANDA - COCINA', alignment: 'center', bold: true, fontSize: 14 },
          { text: `Pedido #${pedidoId}`, alignment: 'center', margin: [0, 0, 0, 10] },

          /* TABLA */
          {
            table: {
              widths: ['auto', '*', 'auto'],
              body: [
                [
                  { text: 'Cant', bold: true },
                  { text: 'Producto', bold: true },
                  { text: 'Subtotal', bold: true },
                ],
                ...detalles.map(d => [
                  d.cantidad.toString(),
                  d.nombreProducto,
                  `Q ${(d.subtotal ?? 0).toFixed(2)}`,
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 10, 0, 10],
          },

          /* TOTAL */
          {
            text: `Total: Q ${total.toFixed(2)}`,
            alignment: 'right',
            bold: true,
            fontSize: 14,
          },

          /* QR AÑADIDO */
          {
            qr: qrValue,
            fit: 70,
            alignment: 'center',
            margin: [0, 10, 0, 0],
          },
        ],
      };

      imprimirPDF(pdfMake, doc);
    } catch (e) {
      console.error('Error imprimir ticket:', e);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo imprimir.',
      });
    }
  }

  //-------------------------------------------------------
  // RETURN
  //-------------------------------------------------------
  return {
    catalogo,
    detalles,
    categoriaActivaId,
    setCategoriaActivaId,
    metodosPago,
    metodoPagoSeleccionadoId,
    setMetodoPagoSeleccionadoId,
    total,
    error,
    cargandoTodo,
    procesandoAccion,
    finalizando,
    getCantidadCatalogo,
    cambiarCantidadCatalogo,
    setCantidadCatalogoDirecto,
    handleAgregarProducto,
    handleCambiarCantidad,
    handleEliminarDetalle,
    handleFinalizarPedido,
    imprimirComanda,
    imprimirTicketCliente,
  };
}
