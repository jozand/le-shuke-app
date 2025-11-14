// app/api/categorias/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// 🔹 Helper para validar / convertir id
function getIdFromString(rawId: string | undefined) {
  if (!rawId) return null;

  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

// 🔹 GET /api/categorias/[id]
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params; // 👈 aquí el await
    const id = getIdFromString(rawId);

    if (!id) {
      return NextResponse.json(
        { ok: false, mensaje: 'ID de categoría inválido' },
        { status: 400 }
      );
    }

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

// 🔹 PUT /api/categorias/[id]
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params; // 👈 aquí el await
    const id = getIdFromString(rawId);

    if (!id) {
      return NextResponse.json(
        { ok: false, mensaje: 'ID de categoría inválido' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { nombre, descripcion, activa } = body ?? {};

    if (!nombre || typeof nombre !== 'string') {
      return NextResponse.json(
        { ok: false, mensaje: 'El nombre de la categoría es obligatorio' },
        { status: 400 }
      );
    }

    const categoria = await prisma.categoria.update({
      where: { categoriaId: id },
      data: {
        nombre,
        descripcion: descripcion === '' ? null : descripcion ?? null,
        activa: typeof activa === 'boolean' ? activa : true,
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

// 🔹 DELETE /api/categorias/[id]
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params; // 👈 aquí el await
    const id = getIdFromString(rawId);

    if (!id) {
      return NextResponse.json(
        { ok: false, mensaje: 'ID de categoría inválido' },
        { status: 400 }
      );
    }

    // Baja lógica: marcar como inactiva
    const categoria = await prisma.categoria.update({
      where: { categoriaId: id },
      data: { activa: false },
    });

    // Borrado físico (si algún día lo quisieras):
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
