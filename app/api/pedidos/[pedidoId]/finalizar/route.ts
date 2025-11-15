import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET opcional para probar
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ pedidoId: string }> }
) {
  const { pedidoId } = await context.params; // 👈 FIX Next.js 15
  const id = Number(pedidoId);

  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ mensaje: 'pedidoId inválido' }, { status: 400 });
  }

  const pedido = await prisma.pedido.findUnique({ where: { pedidoId: id } });
  if (!pedido) {
    return NextResponse.json({ mensaje: 'Pedido no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ data: pedido });
}

// PUT: Finalizar pedido
export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ pedidoId: string }>;
  }
) {
  try {
    const { pedidoId } = await params;
    const id = Number(pedidoId);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { mensaje: 'ID de pedido inválido.' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const metodoPagoId = Number(body?.metodoPagoId);

    if (!metodoPagoId || Number.isNaN(metodoPagoId)) {
      return NextResponse.json(
        { mensaje: 'Debe indicar un método de pago válido.' },
        { status: 400 }
      );
    }

    // Verificar que el pedido exista y esté ABIERTA
    const pedido = await prisma.pedido.findUnique({
      where: { pedidoId: id },
    });

    if (!pedido) {
      return NextResponse.json(
        { mensaje: 'Pedido no encontrado.' },
        { status: 404 }
      );
    }

    if (pedido.estado !== 'ABIERTA') {
      return NextResponse.json(
        { mensaje: 'Solo se pueden finalizar pedidos en estado ABIERTA.' },
        { status: 400 }
      );
    }

    // Verificar que el método de pago exista
    const metodoPago = await prisma.metodoPago.findUnique({
      where: { metodoPagoId },
    });

    if (!metodoPago) {
      return NextResponse.json(
        { mensaje: 'Método de pago no encontrado.' },
        { status: 404 }
      );
    }

    // Obtener detalles para calcular el total
    const detalles = await prisma.pedidoDetalle.findMany({
      where: { pedidoId: id },
    });

    if (!detalles.length) {
      return NextResponse.json(
        { mensaje: 'No se puede finalizar un pedido sin detalles.' },
        { status: 400 }
      );
    }

    const total = detalles.reduce(
      (acc, d) => acc + d.cantidad * d.precioUnitario,
      0
    );

    // Finalizar pedido y registrar pago en una transacción
    const [pedidoActualizado, pago] = await prisma.$transaction([
      prisma.pedido.update({
        where: { pedidoId: id },
        data: {
          estado: 'CERRADA',
        },
      }),
      prisma.pago.create({
        data: {
          pedidoId: id,
          metodoPagoId,
          monto: total,
          // fecha se deja con default(now()) en Prisma
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        pedido: pedidoActualizado,
        pago,
        total,
      },
    });
  } catch (error) {
    console.error('Error al finalizar pedido:', error);
    return NextResponse.json(
      { mensaje: 'Error interno al finalizar el pedido.' },
      { status: 500 }
    );
  }
}

// POST → Delegamos al PUT por si tu frontend lo usa
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ pedidoId: string }> }
) {
  return PUT(req, context);
}
