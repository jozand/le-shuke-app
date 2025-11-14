// app/api/roles/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const roles = await prisma.rol.findMany({
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json({ ok: true, data: roles });
  } catch (error) {
    console.error('Error GET /roles', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener roles' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { nombre, descripcion, estado } = await req.json();

    if (!nombre) {
      return NextResponse.json(
        { ok: false, mensaje: 'El nombre es obligatorio' },
        { status: 400 }
      );
    }

    const rol = await prisma.rol.create({
      data: {
        nombre,
        descripcion: descripcion ?? null,
        estado: estado ?? true,
      },
    });

    return NextResponse.json({ ok: true, data: rol }, { status: 201 });
  } catch (error) {
    console.error('Error POST /roles', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al crear rol' },
      { status: 500 }
    );
  }
}
