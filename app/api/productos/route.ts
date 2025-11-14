// app/api/productos/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json(
      {
        ok: true,
        data: productos,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json(
      {
        ok: false,
        message: 'Error al obtener productos',
      },
      { status: 500 }
    );
  }
}
