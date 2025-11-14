// app/api/metodos-pago/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const metodo = await prisma.metodoPago.findUnique({
      where: { metodoPagoId: id },
    });

    if (!metodo) {
      return NextResponse.json(
        { ok: false, mensaje: 'Método de pago no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: metodo });
  } catch (error) {
    console.error('Error GET /metodos-pago/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener método de pago' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const { nombre, descripcion, activo } = await req.json();

    const metodo = await prisma.metodoPago.update({
      where: { metodoPagoId: id },
      data: {
        nombre,
        descripcion: descripcion ?? null,
        activo,
      },
    });

    return NextResponse.json({ ok: true, data: metodo });
  } catch (error) {
    console.error('Error PUT /metodos-pago/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al actualizar método de pago' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);

    const metodo = await prisma.metodoPago.update({
      where: { metodoPagoId: id },
      data: { activo: false },
    });

    return NextResponse.json({ ok: true, data: metodo });
  } catch (error) {
    console.error('Error DELETE /metodos-pago/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al eliminar método de pago' },
      { status: 500 }
    );
  }
}
