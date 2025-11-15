// app/api/historial/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import type { Prisma } from '@/app/generated/prisma'; // ⬅️ si usas @prisma/client cámbialo a '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const desde = url.searchParams.get('desde');
    const hasta = url.searchParams.get('hasta');

    // Filtro de fechas opcional
    const fechaFilter: { gte?: Date; lte?: Date } = {};
    if (desde) {
      fechaFilter.gte = new Date(desde);
    }
    if (hasta) {
      const hastaDate = new Date(hasta);
      hastaDate.setHours(23, 59, 59, 999); // incluir todo el día
      fechaFilter.lte = hastaDate;
    }

    // ✅ Sin any: usamos el tipo de Prisma
    const where: Prisma.PedidoWhereInput = {};

    if (desde || hasta) {
      // ⬅️ tu modelo tiene fechaHora (no fechaSistema)
      where.fechaHora = fechaFilter;
    }

    // ✅ Tipamos también los argumentos de findMany
    const findArgs: Prisma.PedidoFindManyArgs = {
      where,
      include: {
        mesa: true,
        usuario: true,
        // 👇 Ajusta el nombre de la relación si en tu schema no se llama "detalles"
        detalles: {
          include: {
            producto: true,
          },
        },
      },
      // ⬅️ ordenar por fechaHora, que sí existe
      orderBy: {
        fechaHora: 'desc',
      },
    };

    const pedidos = await prisma.pedido.findMany(findArgs);

    const data = pedidos.map((p) => ({
      pedidoId: p.pedidoId,
      mesaNumero: p.mesa?.numero ?? 0,
      mesaNombre: p.mesa?.nombre ?? null,
      fecha: p.fechaHora.toISOString(),
      usuarioNombre: p.usuario?.nombre ?? 'N/D',
      total: Number(p.total), // ⬅️ ya tienes campo total en el modelo
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
