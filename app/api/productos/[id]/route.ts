// app/api/productos/[id]/route.ts
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

// 🔹 GET /api/productos/[id]
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params; // 👈 importante el await
    const id = getIdFromString(rawId);

    if (!id) {
      return NextResponse.json(
        { ok: false, mensaje: 'ID de producto inválido' },
        { status: 400 }
      );
    }

    const producto = await prisma.producto.findUnique({
      where: { productoId: id },
      include: { categoria: true },
    });

    if (!producto) {
      return NextResponse.json(
        { ok: false, mensaje: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: producto });
  } catch (error) {
    console.error('Error GET /productos/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener producto' },
      { status: 500 }
    );
  }
}

// 🔹 PUT /api/productos/[id]
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params; // 👈 importante el await
    const id = getIdFromString(rawId);

    if (!id) {
      return NextResponse.json(
        { ok: false, mensaje: 'ID de producto inválido' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { nombre, descripcion, precio, activo, categoriaId } = body ?? {};

    if (!nombre || typeof nombre !== 'string') {
      return NextResponse.json(
        { ok: false, mensaje: 'El nombre del producto es obligatorio' },
        { status: 400 }
      );
    }

    if (precio === undefined || precio === null || isNaN(Number(precio))) {
      return NextResponse.json(
        { ok: false, mensaje: 'El precio del producto es inválido' },
        { status: 400 }
      );
    }

    if (!categoriaId || !Number.isInteger(Number(categoriaId))) {
      return NextResponse.json(
        { ok: false, mensaje: 'La categoría del producto es inválida' },
        { status: 400 }
      );
    }

    const producto = await prisma.producto.update({
      where: { productoId: id },
      data: {
        nombre,
        descripcion: descripcion === '' ? null : descripcion ?? null,
        // Prisma Decimal admite number o string, lo normalizamos
        precio: Number(precio),
        activo: typeof activo === 'boolean' ? activo : true,
        categoriaId: Number(categoriaId),
      },
    });

    return NextResponse.json({ ok: true, data: producto });
  } catch (error) {
    console.error('Error PUT /productos/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

// 🔹 DELETE /api/productos/[id]
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params; // 👈 importante el await
    const id = getIdFromString(rawId);

    if (!id) {
      return NextResponse.json(
        { ok: false, mensaje: 'ID de producto inválido' },
        { status: 400 }
      );
    }

    // Baja lógica: marcar como inactivo
    const producto = await prisma.producto.update({
      where: { productoId: id },
      data: { activo: false },
    });

    // Si quisieras borrado físico:
    // const producto = await prisma.producto.delete({ where: { productoId: id } });

    return NextResponse.json({ ok: true, data: producto });
  } catch (error) {
    console.error('Error DELETE /productos/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}
