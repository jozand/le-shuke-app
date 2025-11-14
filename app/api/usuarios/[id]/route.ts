// app/api/usuarios/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

// 👇 En Next 15, params es una Promise
interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface UsuarioUpdateBody {
  nombre: string;
  email: string;
  password?: string;
  rolId: number;
  activo: boolean;
}

/* =========================
   GET /api/usuarios/[id]
   ========================= */
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    // 👇 Desempaquetamos la Promise de params
    const { id } = await params;
    const usuarioId = Number(id);

    if (Number.isNaN(usuarioId)) {
      return NextResponse.json(
        { ok: false, mensaje: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

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

    const { password, ...restoUsuario } = usuario;
    return NextResponse.json({ ok: true, data: restoUsuario });
  } catch (error) {
    console.error('Error GET /usuarios/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

/* =========================
   PUT /api/usuarios/[id]
   ========================= */
export async function PUT(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const usuarioId = Number(id);

    if (Number.isNaN(usuarioId)) {
      return NextResponse.json(
        { ok: false, mensaje: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    const body: UsuarioUpdateBody = await req.json();
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

    const { password: _omit, ...restoUsuario } = usuario;
    return NextResponse.json({ ok: true, data: restoUsuario });
  } catch (error) {
    console.error('Error PUT /usuarios/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE /api/usuarios/[id]
   (baja lógica: activo = false)
   ========================= */
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const usuarioId = Number(id);

    if (Number.isNaN(usuarioId)) {
      return NextResponse.json(
        { ok: false, mensaje: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.update({
      where: { usuarioId },
      data: { activo: false },
      include: { rol: true },
    });

    const { password, ...restoUsuario } = usuario;
    return NextResponse.json({ ok: true, data: restoUsuario });
  } catch (error) {
    console.error('Error DELETE /usuarios/[id]', error);
    return NextResponse.json(
      { ok: false, mensaje: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
