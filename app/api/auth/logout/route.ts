// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const resp = NextResponse.json(
    { ok: true, mensaje: 'Sesión cerrada' },
    { status: 200 }
  );

  // Borrar cookie
  resp.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return resp;
}
