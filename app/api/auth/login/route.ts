import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { firmarToken } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, mensaje: 'Credenciales requeridas' },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true },
    });

    if (!usuario || !usuario.activo) {
      return NextResponse.json(
        { ok: false, mensaje: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    if (usuario.password !== password) {
      return NextResponse.json(
        { ok: false, mensaje: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const token = firmarToken({
      usuarioId: usuario.usuarioId,
      rolId: usuario.rolId,
      email: usuario.email,
    });

    const resp = NextResponse.json(
      {
        ok: true,
        mensaje: 'Login correcto',
        data: {
          usuarioId: usuario.usuarioId,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol?.nombre,
        },
      },
      { status: 200 }
    );

    resp.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: false, // ⚠️ EN LOCALHOST debe ser false
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 4, // 4 horas
    });

    return resp;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error interno' },
      { status: 500 }
    );
  }
}
