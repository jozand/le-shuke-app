// app/login/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext'; // 👈 IMPORTANTE
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
  const router = useRouter();

  const { setUsuario } = useAuth(); // 👈 AHORA TENEMOS ACCESO AL CONTEXTO

  const [email, setEmail] = useState('admin@restaurante.com');
  const [password, setPassword] = useState('123456');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();

  // Verificar si ya hay sesión activa
  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const resp = await fetch('/api/auth/me');
        if (!resp.ok) return;

        const data = await resp.json();
        if (data?.ok) router.replace('/dashboard');
      } catch (err) {
        console.warn('Error verificando sesión:', err);
      }
    };

    verificarSesion();
  }, [router]);

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data?.ok) {
        setError(data?.mensaje || 'Usuario o contraseña incorrectos');
        return;
      }

      // 👇 Guardamos el usuario en AuthContext
      setUsuario({
        usuarioId: data.data.usuarioId,
        nombre: data.data.nombre,
        correo: data.data.email,
        rol: data.data.rol,
      });

      // Espera mínima para evitar glitches
      setTimeout(() => router.push('/dashboard'), 80);
      showToast({
        type: 'success',
        message: 'Bienvenido a Le Shuké App.'
      });

    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl px-10 py-12 overflow-hidden">

        {/* Glow decorativo de fondo */}
        <div className="pointer-events-none absolute inset-x-10 -top-24 h-40 bg-blue-500/30 blur-3xl" />

        {/* LOGO con efecto */}
        <div className="relative flex justify-center mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-blue-500/25 blur-2xl" />
          </div>

          <Image
            src="/images/logo-le-shuke.png"
            alt="Le Shuke App Logo"
            width={96}
            height={96}
            className="rounded-full bg-white/80 p-1 shadow-xl ring-2 ring-white/40 
                       transition-transform duration-300 ease-out hover:scale-105 hover:-translate-y-0.5"
          />
        </div>

        {/* Encabezado */}
        <h1 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">
          Le Shulé App
        </h1>
        <p className="text-center text-slate-200 mb-8 text-sm">
          Sistema de control de comandas
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-200 bg-red-900/50 border border-red-600 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={manejarSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full rounded-lg px-4 py-3 bg-white/20 text-white placeholder-slate-300 border border-white/20 
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full rounded-lg px-4 py-3 bg-white/20 text-white placeholder-slate-300 border border-white/20 
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 rounded-lg text-white font-semibold tracking-wide 
                       bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl 
                       disabled:bg-blue-400 disabled:cursor-not-allowed transition-all"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
