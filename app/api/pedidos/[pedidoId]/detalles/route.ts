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
