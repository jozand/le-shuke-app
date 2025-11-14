// app/api/usuarios/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const usuario = await prisma.usuario.findUnique({
      where: { usuarioId: id },
      include: { rol: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { ok: false, mensaje: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const { password, ...rest } = usuario;
    return NextResponse.json({ ok: true, data: rest });
  } catch (error) {
    console.error('Error GET /usuarios/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const { nombre, email, password, rolId, activo } = await req.json();

    const data: any = {
      nombre,
      email,
      rolId,
      activo,
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { usuarioId: id },
      data,
      include: { rol: true },
    });

    const { password: _, ...rest } = usuario;
    return NextResponse.json({ ok: true, data: rest });
  } catch (error) {
    console.error('Error PUT /usuarios/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);

    const usuario = await prisma.usuario.update({
      where: { usuarioId: id },
      data: { activo: false },
      include: { rol: true },
    });

    const { password, ...rest } = usuario;
    return NextResponse.json({ ok: true, data: rest });
  } catch (error) {
    console.error('Error DELETE /usuarios/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
