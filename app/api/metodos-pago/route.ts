// app/api/metodos-pago/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const metodos = await prisma.metodoPago.findMany({
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json({ ok: true, data: metodos });
  } catch (error) {
    console.error('Error GET /metodos-pago', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener métodos de pago' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { nombre, descripcion, activo } = await req.json();

    if (!nombre) {
      return NextResponse.json(
        { ok: false, mensaje: 'El nombre es obligatorio' },
        { status: 400 }
      );
    }

    const metodo = await prisma.metodoPago.create({
      data: {
        nombre,
        descripcion: descripcion ?? null,
        activo: activo ?? true,
      },
    });

    return NextResponse.json({ ok: true, data: metodo }, { status: 201 });
  } catch (error) {
    console.error('Error POST /metodos-pago', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al crear método de pago' },
      { status: 500 }
    );
  }
}
