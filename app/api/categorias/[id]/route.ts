// app/api/categorias/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const categoria = await prisma.categoria.findUnique({
      where: { categoriaId: id },
    });

    if (!categoria) {
      return NextResponse.json(
        { ok: false, mensaje: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: categoria });
  } catch (error) {
    console.error('Error GET /categorias/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener categoría' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const { nombre, descripcion, activa } = await req.json();

    const categoria = await prisma.categoria.update({
      where: { categoriaId: id },
      data: {
        nombre,
        descripcion: descripcion ?? null,
        activa,
      },
    });

    return NextResponse.json({ ok: true, data: categoria });
  } catch (error) {
    console.error('Error PUT /categorias/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al actualizar categoría' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);

    // Si prefieres baja lógica:
    const categoria = await prisma.categoria.update({
      where: { categoriaId: id },
      data: { activa: false },
    });

    // O borrado físico:
    // const categoria = await prisma.categoria.delete({ where: { categoriaId: id } });

    return NextResponse.json({ ok: true, data: categoria });
  } catch (error) {
    console.error('Error DELETE /categorias/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al eliminar categoría' },
      { status: 500 }
    );
  }
}
