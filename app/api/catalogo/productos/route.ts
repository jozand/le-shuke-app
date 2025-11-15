// app/api/catalogo/productos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

/* ============================================================
   Tipos de respuesta (DTO)
============================================================ */

interface ProductoCatalogoDTO {
  productoId: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
}

interface CategoriaCatalogoDTO {
  categoriaId: number;
  nombre: string;
  productos: ProductoCatalogoDTO[];
}

interface ApiResponse {
  ok: boolean;
  data: CategoriaCatalogoDTO[];
}

/* ============================================================
   GET /api/catalogo/productos
============================================================ */
export async function GET(_req: NextRequest) {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
      include: {
        productos: {
          where: { activo: true },
          orderBy: { nombre: 'asc' },
          select: {
            productoId: true,
            nombre: true,
            descripcion: true,
            precio: true,
          },
        },
      },
    });

    const data: CategoriaCatalogoDTO[] = categorias.map((cat) => ({
      categoriaId: cat.categoriaId,
      nombre: cat.nombre,
      productos: cat.productos.map((p) => ({
        productoId: p.productoId,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: Number(p.precio),
      })),
    }));

    const response: ApiResponse = {
      ok: true,
      data,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error('[GET /api/catalogo/productos]', error);

    return NextResponse.json(
      {
        ok: false,
        mensaje: 'Error al obtener catálogo de productos',
      },
      { status: 500 }
    );
  }
}
