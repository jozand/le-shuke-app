// app/api/usuarios/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: { rol: true },
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json({ ok: true, data: usuarios });
  } catch (error) {
    console.error('Error GET /usuarios', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { nombre, email, password, rolId, activo } = await req.json();

    if (!nombre || !email || !password || !rolId) {
      return NextResponse.json(
        { ok: false, mensaje: 'Nombre, email, contraseña y rol son obligatorios' },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hash,
        rolId,
        activo: activo ?? true,
      },
    });

    // No regresamos el password
    const { password: _, ...rest } = usuario;

    return NextResponse.json({ ok: true, data: rest }, { status: 201 });
  } catch (error) {
    console.error('Error POST /usuarios', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
