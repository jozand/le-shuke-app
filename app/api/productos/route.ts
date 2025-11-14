// app/api/productos/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: true,
      },
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json({ ok: true, data: productos });
  } catch (error) {
    console.error('Error GET /productos', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { nombre, descripcion, precio, activo, categoriaId } = await req.json();

    if (!nombre || !precio || !categoriaId) {
      return NextResponse.json(
        { ok: false, mensaje: 'Nombre, precio y categoría son obligatorios' },
        { status: 400 }
      );
    }

    const producto = await prisma.producto.create({
      data: {
        nombre,
        descripcion: descripcion ?? null,
        precio,
        activo: activo ?? true,
        categoriaId,
      },
    });

    return NextResponse.json({ ok: true, data: producto }, { status: 201 });
  } catch (error) {
    console.error('Error POST /productos', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al crear producto' },
      { status: 500 }
    );
  }
}
