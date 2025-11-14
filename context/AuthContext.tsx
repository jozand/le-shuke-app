// context/AuthContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

interface Usuario {
  usuarioId: number;
  nombre: string;
  correo: string;
  rol: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  isAuth: boolean;
  cargando: boolean;
  cerrarSesion: () => Promise<void>;
  setUsuario: (u: Usuario | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarUsuario = async () => {
    try {
      const resp = await fetch('/api/auth/me');
      if (!resp.ok) {
        setUsuario(null);
        return;
      }

      const data = await resp.json();

      // Esperamos algo como:
      // { ok: true, data: { usuarioId, nombre, email, rol } }
      if (data.ok && data.data) {
        const u = data.data;

        setUsuario({
          usuarioId: u.usuarioId,
          nombre: u.nombre,
          correo: u.email,
          rol: u.rol,
        });
      } else {
        setUsuario(null);
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    } finally {
      setUsuario(null);
      router.push('/login');
    }
  };

  useEffect(() => {
    cargarUsuario();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        isAuth: !!usuario,
        cerrarSesion,
        setUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
