import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Debe ser consistente con tu DTO del frontend
export interface PedidoDetalleDTO {
  pedidoDetalleId: number;
  pedidoId: number;
  productoId: number;
  nombreProducto: string;
  categoriaNombre: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/**
 * PUT /api/pedidos/detalles/[pedidoDetalleId]
 * Body: { cantidad: number }
 *
 * Actualiza la cantidad de un detalle EXISTENTE y recalcula
 * el subtotal y el total del pedido.
 */
export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ pedidoDetalleId: string }>;
  }
) {
  const { pedidoDetalleId } = await params;
  const idDetalle = Number(pedidoDetalleId);

  if (Number.isNaN(idDetalle) || idDetalle <= 0) {
    return NextResponse.json(
      { mensaje: 'El parámetro pedidoDetalleId no es válido' },
      { status: 400 }
    );
  }

  let body: { cantidad?: number };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { mensaje: 'Body inválido. Se esperaba JSON.' },
      { status: 400 }
    );
  }

  const cantidad = Number(body.cantidad);

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return NextResponse.json(
      {
        mensaje: 'cantidad debe ser un número mayor a cero.',
      },
      { status: 400 }
    );
  }

  try {
    // Traemos el detalle con su pedido y producto
    const detalle = await prisma.pedidoDetalle.findUnique({
      where: { pedidoDetalleId: idDetalle },
      include: {
        pedido: true,
        producto: {
          include: { categoria: true },
        },
      },
    });

    if (!detalle) {
      return NextResponse.json(
        { mensaje: 'Detalle no encontrado' },
        { status: 404 }
      );
    }

    if (!detalle.pedido) {
      return NextResponse.json(
        {
          mensaje:
            'El detalle no tiene un pedido asociado válido.',
        },
        { status: 500 }
      );
    }

    // Validamos que el pedido esté ABIERTA
    if (detalle.pedido.estado !== 'ABIERTA') {
      return NextResponse.json(
        {
          mensaje:
            'No se pueden modificar productos de un pedido que no está ABIERTA.',
        },
        { status: 400 }
      );
    }

    const precioUnitario = Number(detalle.precioUnitario);
    const nuevoSubtotal = precioUnitario * cantidad;

    const detalleActualizado = await prisma.pedidoDetalle.update({
      where: { pedidoDetalleId: idDetalle },
      data: {
        cantidad,
        subtotal: nuevoSubtotal,
      },
      include: {
        producto: {
          include: { categoria: true },
        },
      },
    });

    // Recalculamos el total del pedido
    const todosDetalles = await prisma.pedidoDetalle.findMany({
      where: { pedidoId: detalle.pedidoId },
    });

    const nuevoTotal = todosDetalles.reduce(
      (acc, d) => acc + Number(d.subtotal),
      0
    );

    await prisma.pedido.update({
      where: { pedidoId: detalle.pedidoId },
      data: {
        total: nuevoTotal,
      },
    });

    const dto: PedidoDetalleDTO = {
      pedidoDetalleId: detalleActualizado.pedidoDetalleId,
      pedidoId: detalleActualizado.pedidoId,
      productoId: detalleActualizado.productoId,
      nombreProducto:
        detalleActualizado.producto?.nombre ?? 'Producto',
      categoriaNombre:
        detalleActualizado.producto?.categoria?.nombre ?? null,
      cantidad: detalleActualizado.cantidad,
      precioUnitario: Number(detalleActualizado.precioUnitario),
      subtotal: Number(detalleActualizado.subtotal),
    };

    return NextResponse.json(
      {
        data: dto,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al actualizar cantidad del detalle:', error);
    return NextResponse.json(
      {
        mensaje: 'Error al actualizar la cantidad del detalle',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pedidos/detalles/[pedidoDetalleId]
 *
 * Elimina un detalle del pedido y recalcula el total.
 * (Probablemente tu eliminarDetallePedido usa esta misma ruta).
 */
export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ pedidoDetalleId: string }>;
  }
) {
  const { pedidoDetalleId } = await params;
  const idDetalle = Number(pedidoDetalleId);

  if (Number.isNaN(idDetalle) || idDetalle <= 0) {
    return NextResponse.json(
      { mensaje: 'El parámetro pedidoDetalleId no es válido' },
      { status: 400 }
    );
  }

  try {
    // Obtenemos el detalle para conocer el pedidoId
    const detalle = await prisma.pedidoDetalle.findUnique({
      where: { pedidoDetalleId: idDetalle },
    });

    if (!detalle) {
      return NextResponse.json(
        { mensaje: 'Detalle no encontrado' },
        { status: 404 }
      );
    }

    const pedidoId = detalle.pedidoId;

    // Eliminamos el detalle
    await prisma.pedidoDetalle.delete({
      where: { pedidoDetalleId: idDetalle },
    });

    // Recalculamos el total
    const todosDetalles = await prisma.pedidoDetalle.findMany({
      where: { pedidoId },
    });

    const nuevoTotal = todosDetalles.reduce(
      (acc, d) => acc + Number(d.subtotal),
      0
    );

    await prisma.pedido.update({
      where: { pedidoId },
      data: {
        total: nuevoTotal,
      },
    });

    return NextResponse.json(
      { data: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar detalle del pedido:', error);
    return NextResponse.json(
      {
        mensaje: 'Error al eliminar el detalle del pedido',
      },
      { status: 500 }
    );
  }
}
