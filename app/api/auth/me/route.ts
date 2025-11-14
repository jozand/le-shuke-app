// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verificarToken } from '@/app/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, mensaje: 'No autenticado' },
        { status: 401 }
      );
    }

    const payload = verificarToken(token);

    if (!payload) {
      return NextResponse.json(
        { ok: false, mensaje: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { usuarioId: payload.usuarioId },
      include: { rol: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { ok: false, mensaje: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          usuarioId: usuario.usuarioId,
          nombre: usuario.nombre,
          email: usuario.email,
          rolId: usuario.rolId,
          rol: usuario.rol?.nombre,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en /api/auth/me:', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error interno' },
      { status: 500 }
    );
  }
}
