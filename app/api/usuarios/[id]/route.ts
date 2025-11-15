// app/api/usuarios/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

// Helper para validar y obtener ID
async function getUserId(
  paramsPromise: Promise<{ id: string }>
): Promise<number> {
  const { id } = await paramsPromise;
  const usuarioId = Number(id);

  if (!usuarioId || Number.isNaN(usuarioId)) {
    throw new Error(`ID de usuario inválido: "${id}"`);
  }

  return usuarioId;
}

/* ============================================================
   GET /api/usuarios/[id]
============================================================ */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioId = await getUserId(params);

    const usuario = await prisma.usuario.findUnique({
      where: { usuarioId },
      include: { rol: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { ok: false, mensaje: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const { password, ...resto } = usuario;
    return NextResponse.json({ ok: true, data: resto });
  } catch (error) {
    console.error('[GET /usuarios/[id]]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUT /api/usuarios/[id]
============================================================ */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioId = await getUserId(params);
    const body = await req.json();

    const { nombre, email, password, rolId, activo } = body;

    const data: {
      nombre: string;
      email: string;
      rolId: number;
      activo: boolean;
      password?: string;
    } = { nombre, email, rolId, activo };

    if (password && password.trim() !== '') {
      data.password = await bcrypt.hash(password, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { usuarioId },
      data,
      include: { rol: true },
    });

    const { password: _, ...resto } = usuario;
    return NextResponse.json({ ok: true, data: resto });
  } catch (error) {
    console.error('[PUT /usuarios/[id]]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE /api/usuarios/[id]
============================================================ */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioId = await getUserId(params);

    const usuario = await prisma.usuario.update({
      where: { usuarioId },
      data: { activo: false },
      include: { rol: true },
    });

    const { password, ...resto } = usuario;
    return NextResponse.json({ ok: true, data: resto });
  } catch (error) {
    console.error('[DELETE /usuarios/[id]]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
