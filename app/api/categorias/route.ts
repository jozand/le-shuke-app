// app/api/categorias/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(
      {
        ok: true,
        data: categorias,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return NextResponse.json(
      {
        ok: false,
        message: 'Error al obtener categorías',
      },
      { status: 500 }
    );
  }
}
