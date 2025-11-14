// app/api/roles/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const rol = await prisma.rol.findUnique({
      where: { rolId: id },
    });

    if (!rol) {
      return NextResponse.json(
        { ok: false, mensaje: 'Rol no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: rol });
  } catch (error) {
    console.error('Error GET /roles/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener rol' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const { nombre, descripcion, estado } = await req.json();

    const rol = await prisma.rol.update({
      where: { rolId: id },
      data: {
        nombre,
        descripcion: descripcion ?? null,
        estado,
      },
    });

    return NextResponse.json({ ok: true, data: rol });
  } catch (error) {
    console.error('Error PUT /roles/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al actualizar rol' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);

    const rol = await prisma.rol.update({
      where: { rolId: id },
      data: { estado: false },
    });

    return NextResponse.json({ ok: true, data: rol });
  } catch (error) {
    console.error('Error DELETE /roles/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al eliminar rol' },
      { status: 500 }
    );
  }
}
