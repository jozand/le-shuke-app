// app/api/catalogo/productos/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    /**
     * Traemos las categorías ACTIVAS con sus productos ACTIVOS.
     * Ajusta `where` si quieres incluir inactivos.
     */
    const categorias = await prisma.categoria.findMany({
      where: {
        activa: true,
      },
      orderBy: {
        nombre: 'asc',
      },
      include: {
        productos: {
          where: {
            activo: true,
          },
          orderBy: {
            nombre: 'asc',
          },
          select: {
            productoId: true,
            nombre: true,
            descripcion: true,
            precio: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        data: categorias.map((cat) => ({
          categoriaId: cat.categoriaId,
          nombre: cat.nombre,
          productos: cat.productos.map((p) => ({
            productoId: p.productoId,
            nombre: p.nombre,
            descripcion: p.descripcion,
            // Decimal → number
            precio: Number(p.precio),
          })),
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error en GET /api/catalogo/productos:', error);

    return NextResponse.json(
      {
        ok: false,
        mensaje: 'Error al obtener catálogo de productos',
      },
      { status: 500 }
    );
  }
}
