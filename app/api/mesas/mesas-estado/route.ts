import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Estados que indican que un pedido sigue activo (ocupa la mesa)
const ESTADOS_ACTIVOS = ['ABIERTA'];

export async function GET() {
  try {
    const mesas = await prisma.mesa.findMany({
      where: {
        activa: true,
      },
      include: {
        pedidos: {
          select: {
            pedidoId: true,
            estado: true,
            fechaHora: true,
          },
          orderBy: {
            fechaHora: 'desc',
          },
        },
      },
      orderBy: {
        numero: 'asc',
      },
    });

    const data = mesas.map((m) => {
      // Filtrar pedidos ACTIVOS según tu enum real
      const pedidosAbiertos = m.pedidos.filter((p) =>
        ESTADOS_ACTIVOS.includes(p.estado)
      );

      return {
        mesaId: m.mesaId,
        numero: m.numero,
        nombre: m.nombre,
        capacidad: m.capacidad,
        ocupada: pedidosAbiertos.length > 0,
        pedidoIdActivo: pedidosAbiertos[0]?.pedidoId ?? null,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error en GET /api/mesas-estado:', error);
    return NextResponse.json(
      { mensaje: 'Error al obtener el estado de las mesas' },
      { status: 500 }
    );
  }
}
