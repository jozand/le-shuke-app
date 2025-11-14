// app/api/productos/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
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

export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const { nombre, descripcion, precio, activo, categoriaId } = await req.json();

    const producto = await prisma.producto.update({
      where: { productoId: id },
      data: {
        nombre,
        descripcion: descripcion ?? null,
        precio,
        activo,
        categoriaId,
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

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);

    // Baja lógica
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
