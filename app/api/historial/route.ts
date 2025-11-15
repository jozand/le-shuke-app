// app/api/historial/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import type { Prisma } from '@/app/generated/prisma';

// =========================
// TIPO CORRECTO DEL PEDIDO
// =========================
type PedidoConTodo = Prisma.PedidoGetPayload<{
  include: {
    mesa: true;
    usuario: true;
    detalles: {
      include: { producto: true };
    };
  };
}>;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const desde = url.searchParams.get('desde');
    const hasta = url.searchParams.get('hasta');

    // Filtro de fechas
    const fechaFilter: { gte?: Date; lte?: Date } = {};

    if (desde) fechaFilter.gte = new Date(desde);
    if (hasta) {
      const h = new Date(hasta);
      h.setHours(23, 59, 59, 999);
      fechaFilter.lte = h;
    }

    const where: Prisma.PedidoWhereInput = {};

    if (desde || hasta) {
      where.fechaHora = fechaFilter;
    }

    // ===============================
    // CONSULTA CORRECTAMENTE TIPADA
    // ===============================
    const pedidos: PedidoConTodo[] = await prisma.pedido.findMany({
      where,
      include: {
        mesa: true,
        usuario: true,
        detalles: {
          include: { producto: true },
        },
      },
      orderBy: { fechaHora: 'desc' },
    });

    const data = pedidos.map((p) => ({
      pedidoId: p.pedidoId,
      mesaNumero: p.mesa?.numero ?? 0,
      mesaNombre: p.mesa?.nombre ?? null,
      fecha: p.fechaHora.toISOString(),
      usuarioNombre: p.usuario?.nombre ?? 'N/D',
      total: Number(p.total),
      estado: p.estado,
      detalles: p.detalles.map((d) => ({
        pedidoDetalleId: d.pedidoDetalleId,
        productoNombre: d.producto?.nombre ?? 'Producto',
        cantidad: d.cantidad,
        precioUnitario: Number(d.precioUnitario),
        subtotal: Number(d.cantidad) * Number(d.precioUnitario),
      })),
    }));

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('Error en GET /api/historial', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al cargar historial de comandas' },
      { status: 500 }
    );
  }
}
