// app/api/metodos-pago/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Helper para obtener y validar el ID
async function getIdFromParams(
  paramsPromise: Promise<{ id: string }>
): Promise<number> {
  const { id } = await paramsPromise;
  const metodoPagoId = Number(id);

  if (!metodoPagoId || Number.isNaN(metodoPagoId)) {
    throw new Error(`ID inválido: "${id}"`);
  }

  return metodoPagoId;
}

/* ============================================================
   GET /api/metodos-pago/[id]
============================================================ */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const metodoPagoId = await getIdFromParams(params);

    const metodo = await prisma.metodoPago.findUnique({
      where: { metodoPagoId },
    });

    if (!metodo) {
      return NextResponse.json(
        { ok: false, mensaje: 'Método de pago no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: metodo });
  } catch (error) {
    console.error('[GET /metodos-pago/[id]]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener método de pago' },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUT /api/metodos-pago/[id]
============================================================ */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const metodoPagoId = await getIdFromParams(params);
    const { nombre, descripcion, activo } = await req.json();

    const metodo = await prisma.metodoPago.update({
      where: { metodoPagoId },
      data: {
        nombre,
        descripcion: descripcion ?? null,
        activo,
      },
    });

    return NextResponse.json({ ok: true, data: metodo });
  } catch (error) {
    console.error('[PUT /metodos-pago/[id]]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al actualizar método de pago' },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE /api/metodos-pago/[id]
============================================================ */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const metodoPagoId = await getIdFromParams(params);

    const metodo = await prisma.metodoPago.update({
      where: { metodoPagoId },
      data: { activo: false },
    });

    return NextResponse.json({ ok: true, data: metodo });
  } catch (error) {
    console.error('[DELETE /metodos-pago/[id]]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al eliminar método de pago' },
      { status: 500 }
    );
  }
}
