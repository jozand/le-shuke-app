import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// 👇 Este DTO debe coincidir con lo que usas en admin-api y en PedidoPage
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
 * GET /api/pedidos/[pedidoId]/detalles
 *
 * Devuelve SOLO el listado de detalles del pedido:
 *   { data: PedidoDetalleDTO[] }
 */
export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ pedidoId: string }>;
  }
) {
  // Next 15: params es Promise -> hay que hacer await
  const { pedidoId } = await params;

  const id = Number(pedidoId);
  if (Number.isNaN(id) || id <= 0) {
    return NextResponse.json(
      { mensaje: 'El parámetro pedidoId no es válido' },
      { status: 400 }
    );
  }

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { pedidoId: id },
      include: {
        detalles: {
          include: {
            producto: {
              include: {
                categoria: true,
              },
            },
          },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { mensaje: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Mapeamos SOLO los detalles al formato que espera el frontend
    const detalles: PedidoDetalleDTO[] = pedido.detalles.map((d) => ({
      pedidoDetalleId: d.pedidoDetalleId,
      pedidoId: d.pedidoId,
      productoId: d.productoId,
      nombreProducto: d.producto?.nombre ?? 'Producto',
      categoriaNombre: d.producto?.categoria?.nombre ?? null,
      cantidad: d.cantidad,
      precioUnitario: Number(d.precioUnitario),
      subtotal: Number(d.subtotal),
    }));

    // Muy importante: devolver un ARRAY en data
    return NextResponse.json(
      {
        data: detalles,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al obtener detalles de pedido:', error);
    return NextResponse.json(
      {
        mensaje: 'Error al obtener los detalles del pedido',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ pedidoId: string }>;
  }
) {
  const { pedidoId } = await params;

  const id = Number(pedidoId);
  if (Number.isNaN(id) || id <= 0) {
    return NextResponse.json(
      { mensaje: 'El parámetro pedidoId no es válido' },
      { status: 400 }
    );
  }

  let body: { productoId?: number; cantidad?: number };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { mensaje: 'Body inválido. Se esperaba JSON.' },
      { status: 400 }
    );
  }

  const productoId = Number(body.productoId);
  const cantidad = Number(body.cantidad ?? 1);

  if (!Number.isFinite(productoId) || productoId <= 0) {
    return NextResponse.json(
      { mensaje: 'productoId es requerido y debe ser numérico.' },
      { status: 400 }
    );
  }

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return NextResponse.json(
      { mensaje: 'cantidad debe ser un número mayor a cero.' },
      { status: 400 }
    );
  }

  try {
    // Verificamos que el pedido exista y esté abierto (opcional, pero recomendado)
    const pedido = await prisma.pedido.findUnique({
      where: { pedidoId: id },
    });

    if (!pedido) {
      return NextResponse.json(
        { mensaje: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    if (pedido.estado !== 'ABIERTA') {
      return NextResponse.json(
        {
          mensaje:
            'No se pueden agregar productos a un pedido que no está ABIERTA.',
        },
        { status: 400 }
      );
    }

    // Obtenemos el producto para conocer el precio
    const producto = await prisma.producto.findUnique({
      where: { productoId },
      include: { categoria: true },
    });

    if (!producto) {
      return NextResponse.json(
        { mensaje: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const precioUnitario = Number(producto.precio);

    // ¿Ya existe una línea con este producto en este pedido?
    const detalleExistente = await prisma.pedidoDetalle.findFirst({
      where: {
        pedidoId: id,
        productoId,
      },
    });

    let detalleActualizado;

    if (detalleExistente) {
      const nuevaCantidad = detalleExistente.cantidad + cantidad;
      const nuevoSubtotal = precioUnitario * nuevaCantidad;

      detalleActualizado = await prisma.pedidoDetalle.update({
        where: { pedidoDetalleId: detalleExistente.pedidoDetalleId },
        data: {
          cantidad: nuevaCantidad,
          precioUnitario,
          subtotal: nuevoSubtotal,
        },
        include: {
          producto: {
            include: {
              categoria: true,
            },
          },
        },
      });
    } else {
      // Creamos nuevo detalle
      detalleActualizado = await prisma.pedidoDetalle.create({
        data: {
          pedidoId: id,
          productoId,
          cantidad,
          precioUnitario,
          subtotal: precioUnitario * cantidad,
        },
        include: {
          producto: {
            include: {
              categoria: true,
            },
          },
        },
      });
    }

    // Recalculamos el total del pedido en base a todos los detalles
    const todosDetalles = await prisma.pedidoDetalle.findMany({
      where: { pedidoId: id },
    });

    const nuevoTotal = todosDetalles.reduce(
      (acc, d) => acc + Number(d.subtotal),
      0
    );

    await prisma.pedido.update({
      where: { pedidoId: id },
      data: {
        total: nuevoTotal,
      },
    });

    // Mapeamos el detalle a DTO para la respuesta
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
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al agregar detalle al pedido:', error);
    return NextResponse.json(
      {
        mensaje: 'Error al agregar producto al pedido',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pedidos/[pedidoId]/detalles
 * Body: { pedidoDetalleId: number, cantidad: number }
 *
 * Actualiza la cantidad de un detalle existente y recalcula
 * el subtotal y el total del pedido.
 */
export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ pedidoId: string }>;
  }
) {
  const { pedidoId } = await params;
  const id = Number(pedidoId);

  if (Number.isNaN(id) || id <= 0) {
    return NextResponse.json(
      { mensaje: 'El parámetro pedidoId no es válido' },
      { status: 400 }
    );
  }

  let body: { pedidoDetalleId?: number; cantidad?: number };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { mensaje: 'Body inválido. Se esperaba JSON.' },
      { status: 400 }
    );
  }

  const pedidoDetalleId = Number(body.pedidoDetalleId);
  const cantidad = Number(body.cantidad);

  if (!Number.isFinite(pedidoDetalleId) || pedidoDetalleId <= 0) {
    return NextResponse.json(
      {
        mensaje:
          'pedidoDetalleId es requerido y debe ser un número válido.',
      },
      { status: 400 }
    );
  }

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return NextResponse.json(
      {
        mensaje: 'cantidad debe ser un número mayor a cero.',
      },
      { status: 400 }
    );
  }

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { pedidoId: id },
    });

    if (!pedido) {
      return NextResponse.json(
        { mensaje: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    if (pedido.estado !== 'ABIERTA') {
      return NextResponse.json(
        {
          mensaje:
            'No se pueden modificar productos de un pedido que no está ABIERTA.',
        },
        { status: 400 }
      );
    }

    const detalle = await prisma.pedidoDetalle.findUnique({
      where: { pedidoDetalleId },
      include: {
        producto: {
          include: { categoria: true },
        },
      },
    });

    if (!detalle || detalle.pedidoId !== id) {
      return NextResponse.json(
        {
          mensaje:
            'Detalle no encontrado para este pedido.',
        },
        { status: 404 }
      );
    }

    const precioUnitario = Number(detalle.precioUnitario);
    const nuevoSubtotal = precioUnitario * cantidad;

    const detalleActualizado = await prisma.pedidoDetalle.update({
      where: { pedidoDetalleId },
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

    const todosDetalles = await prisma.pedidoDetalle.findMany({
      where: { pedidoId: id },
    });

    const nuevoTotal = todosDetalles.reduce(
      (acc, d) => acc + Number(d.subtotal),
      0
    );

    await prisma.pedido.update({
      where: { pedidoId: id },
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