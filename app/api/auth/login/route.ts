// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { firmarToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

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

    // 🔐 Comparar la contraseña enviada con el hash almacenado
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return NextResponse.json(
        { ok: false, mensaje: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // 🎯 Construimos el token SOLO con los campos definidos en JwtPayload
    const token = firmarToken({
      usuarioId: usuario.usuarioId,
      nombre: usuario.nombre,
      rol: usuario.rol?.nombre || 'Usuario',
    });

    // 🎯 Respuesta de login
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

    // 🍪 Guardamos cookie HTTP-only
    resp.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: false, // ⚠️ en localhost false; en producción true
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
