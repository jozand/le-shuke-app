// app/api/mesas/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// ⬇️ En Next 16, params viene como Promise<{ id: string }>
type ParamsContext = {
  params: Promise<{ id: string }>;
};

// Helper para leer y validar el ID desde params (async)
async function getMesaIdFromParams(
  paramsPromise: Promise<{ id: string }>
): Promise<number> {
  const { id } = await paramsPromise; // 👈 aquí hacemos el await de params
  const mesaId = parseInt(id, 10);

  if (!Number.isFinite(mesaId)) {
    throw new Error(`ID de mesa inválido en la ruta: "${id}"`);
  }

  return mesaId;
}

// =====================
// GET /api/mesas/[id]
// =====================
export async function GET(_req: Request, { params }: ParamsContext) {
  try {
    const mesaId = await getMesaIdFromParams(params);

    const mesa = await prisma.mesa.findUnique({
      where: { mesaId }, // PK de tu modelo Mesa
    });

    if (!mesa) {
      return NextResponse.json(
        { ok: false, mensaje: 'Mesa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: mesa });
  } catch (error) {
    console.error('Error GET /mesas/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener mesa' },
      { status: 500 }
    );
  }
}

// =====================
// PUT /api/mesas/[id]
// =====================
export async function PUT(req: Request, { params }: ParamsContext) {
  try {
    const mesaId = await getMesaIdFromParams(params);
    const { numero, nombre, capacidad, activa } = await req.json();

    const mesa = await prisma.mesa.update({
      where: { mesaId }, // 👈 importante: usa la PK correcta
      data: {
        numero,
        nombre: nombre ?? null,
        capacidad: capacidad ?? null,
        activa,
      },
    });

    return NextResponse.json({ ok: true, data: mesa });
  } catch (error) {
    console.error('Error PUT /mesas/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al actualizar mesa' },
      { status: 500 }
    );
  }
}

// ========================
// DELETE /api/mesas/[id]
// ========================
export async function DELETE(_req: Request, { params }: ParamsContext) {
  try {
    const mesaId = await getMesaIdFromParams(params);

    const mesa = await prisma.mesa.update({
      where: { mesaId },
      data: { activa: false },
    });

    return NextResponse.json({ ok: true, data: mesa });
  } catch (error) {
    console.error('Error DELETE /mesas/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al eliminar mesa' },
      { status: 500 }
    );
  }
}
