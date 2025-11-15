// app/api/categorias/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json({ ok: true, data: categorias });
  } catch (error) {
    console.error('Error GET /categorias', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { nombre, descripcion, activa } = await req.json();

    if (!nombre) {
      return NextResponse.json(
        { ok: false, mensaje: 'El nombre es obligatorio' },
        { status: 400 }
      );
    }

    const categoria = await prisma.categoria.create({
      data: {
        nombre,
        descripcion: descripcion ?? null,
        activa: activa ?? true,
      },
    });

    return NextResponse.json({ ok: true, data: categoria }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error POST /categorias', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}
