// app/api/mesas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Helper para convertir ID
async function getMesaIdFromParams(
  paramsPromise: Promise<{ id: string }>
): Promise<number> {
  const { id } = await paramsPromise;
  const mesaId = Number(id);

  if (!mesaId || Number.isNaN(mesaId)) {
    throw new Error(`ID de mesa inválido: "${id}"`);
  }

  return mesaId;
}

/* ============================================
   GET /api/mesas/[id]
============================================ */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const mesaId = await getMesaIdFromParams(params);

    const mesa = await prisma.mesa.findUnique({
      where: { mesaId },
    });

    if (!mesa) {
      return NextResponse.json(
        { ok: false, mensaje: 'Mesa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: mesa });
  } catch (error) {
    console.error('[GET /mesas/[id]]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener mesa' },
      { status: 500 }
    );
  }
}

/* ============================================
   PUT /api/mesas/[id]
============================================ */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const mesaId = await getMesaIdFromParams(params);
    const body = await req.json();
    const { numero, nombre, capacidad, activa } = body;

    const mesa = await prisma.mesa.update({
      where: { mesaId },
      data: {
        numero,
        nombre: nombre ?? null,
        capacidad: capacidad ?? null,
        activa,
      },
    });

    return NextResponse.json({ ok: true, data: mesa });
  } catch (error) {
    console.error('[PUT /mesas/[id]]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al actualizar mesa' },
      { status: 500 }
    );
  }
}

/* ============================================
   DELETE /api/mesas/[id]
============================================ */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const mesaId = await getMesaIdFromParams(params);

    const mesa = await prisma.mesa.update({
      where: { mesaId },
      data: { activa: false },
    });

    return NextResponse.json({ ok: true, data: mesa });
  } catch (error) {
    console.error('[DELETE /mesas/[id]]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al eliminar mesa' },
      { status: 500 }
    );
  }
}
