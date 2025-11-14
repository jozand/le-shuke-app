// app/api/mesas/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const mesas = await prisma.mesa.findMany({
      orderBy: { numero: 'asc' },
    });
    return NextResponse.json({ ok: true, data: mesas });
  } catch (error) {
    console.error('Error GET /mesas', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener mesas' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { numero, nombre, capacidad, activa } = await req.json();

    if (!numero) {
      return NextResponse.json(
        { ok: false, mensaje: 'El número de mesa es obligatorio' },
        { status: 400 }
      );
    }

    const mesa = await prisma.mesa.create({
      data: {
        numero,
        nombre: nombre ?? null,
        capacidad: capacidad ?? null,
        activa: activa ?? true,
      },
    });

    return NextResponse.json({ ok: true, data: mesa }, { status: 201 });
  } catch (error) {
    console.error('Error POST /mesas', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al crear mesa' },
      { status: 500 }
    );
  }
}
