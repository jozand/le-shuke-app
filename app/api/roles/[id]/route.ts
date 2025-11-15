// app/api/roles/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Helper para convertir ID y validar
async function getIdFromParams(
  paramsPromise: Promise<{ id: string }>
): Promise<number> {
  const { id } = await paramsPromise;
  const rolId = Number(id);

  if (!rolId || Number.isNaN(rolId)) {
    throw new Error(`ID de rol inválido: "${id}"`);
  }

  return rolId;
}

/* ============================================================
   GET /api/roles/[id]
============================================================ */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rolId = await getIdFromParams(params);

    const rol = await prisma.rol.findUnique({
      where: { rolId },
    });

    if (!rol) {
      return NextResponse.json(
        { ok: false, mensaje: 'Rol no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: rol });
  } catch (error) {
    console.error('[GET /roles/[id]]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener rol' },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUT /api/roles/[id]
============================================================ */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rolId = await getIdFromParams(params);
    const body = await req.json();

    const { nombre, descripcion, estado } = body;

    const rol = await prisma.rol.update({
      where: { rolId },
      data: {
        nombre,
        descripcion: descripcion ?? null,
        estado,
      },
    });

    return NextResponse.json({ ok: true, data: rol });
  } catch (error) {
    console.error('[PUT /roles/[id]]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al actualizar rol' },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE /api/roles/[id]
============================================================ */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rolId = await getIdFromParams(params);

    const rol = await prisma.rol.update({
      where: { rolId },
      data: { estado: false },
    });

    return NextResponse.json({ ok: true, data: rol });
  } catch (error) {
    console.error('[DELETE /roles/[id]]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al eliminar rol' },
      { status: 500 }
    );
  }
}
