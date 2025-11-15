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
  _req: NextRequest,
  context: { params: Promise<{ pedidoId: string }> }
) {
  const { pedidoId } = await context.params; // 👈 FIX Next.js 15
  const id = Number(pedidoId);

  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ mensaje: 'pedidoId inválido' }, { status: 400 });
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

    // Ya finalizado = idempotente
    if (pedido.estado === 'CERRADA') {
      return NextResponse.json({
        data: { pedidoId: pedido.pedidoId, estado: pedido.estado },
      });
    }

    const actualizado = await prisma.pedido.update({
      where: { pedidoId: id },
      data: { estado: 'CERRADA' },
    });

    return NextResponse.json({
      data: { pedidoId: actualizado.pedidoId, estado: actualizado.estado },
    });
  } catch (error) {
    console.error('Error al finalizar pedido:', error);
    return NextResponse.json(
      { mensaje: 'Error al finalizar el pedido' },
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
