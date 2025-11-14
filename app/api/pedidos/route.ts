import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { EstadoPedido } from '@/app/generated/prisma'; // 👈 importamos el enum generado por Prisma

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mesaId, usuarioId, observaciones } = body;

    if (!mesaId || !usuarioId) {
      return NextResponse.json(
        { mensaje: 'mesaId y usuarioId son obligatorios' },
        { status: 400 }
      );
    }

    // 🔎 Validar que la mesa NO tenga ya una comanda ABIERTA
    const pedidoAbierto = await prisma.pedido.findFirst({
      where: {
        mesaId,
        estado: EstadoPedido.ABIERTA, // 👈 usamos el enum, no string
      },
    });

    if (pedidoAbierto) {
      return NextResponse.json(
        { mensaje: 'La mesa ya tiene una comanda abierta' },
        { status: 409 }
      );
    }

    // 🆕 Crear pedido en estado ABIERTA
    const nuevoPedido = await prisma.pedido.create({
      data: {
        mesaId,
        usuarioId,
        estado: EstadoPedido.ABIERTA, // 👈 enum otra vez
        total: 0,
        observaciones: observaciones ?? null,
      },
    });

    return NextResponse.json({ data: nuevoPedido }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/pedidos:', error);
    return NextResponse.json(
      { mensaje: 'Error al crear el pedido' },
      { status: 500 }
    );
  }
}
