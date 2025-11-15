// app/lib/auth.ts
import jwt, { JwtPayload as JwtPayloadJWT, SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  usuarioId: number;
  nombre: string;
  rol: string;
}

// ✅ Forzamos a que sea string y tronamos si no existe
const JWT_SECRET: string = process.env.JWT_SECRET ?? '';

if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET no está definido en las variables de entorno. Configúralo antes de iniciar la app.'
  );
}

// Opcional: tiempo de expiración configurable por env
const rawExpires = process.env.JWT_EXPIRES_IN;

// Aceptamos number o string, validando por seguridad
let JWT_EXPIRES_IN: SignOptions['expiresIn'];

if (rawExpires && /^[0-9]+[smhd]$/.test(rawExpires)) {
  JWT_EXPIRES_IN = rawExpires as SignOptions['expiresIn']; // <-- CAST seguro
} else {
  JWT_EXPIRES_IN = '8h'; // <-- también se castea automáticamente
}


export function firmarToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verificarToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadJWT & JwtPayload;

    // Normalizamos lo que devolvemos, por si acaso
    return {
      usuarioId: decoded.usuarioId,
      nombre: decoded.nombre,
      rol: decoded.rol,
    };
  } catch {
    return null;
  }
}
