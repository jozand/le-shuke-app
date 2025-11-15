// app/dashboard/historial/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Calendar,
  XCircle,
  Printer,
  FileDown,
} from 'lucide-react';

type HistorialDetalleDTO = {
  pedidoDetalleId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

type HistorialComandaDTO = {
  pedidoId: number;
  mesaNumero: number;
  mesaNombre: string | null;
  fecha: string; // ISO string
  usuarioNombre: string;
  total: number;
  estado: 'ABIERTA' | 'CERRADA' | 'CANCELADA' | string;
  detalles: HistorialDetalleDTO[];
};

type MesaOption = {
  mesaId: number;
  numero: number;
  nombre: string | null;
};

export default function HistorialPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'Administrador';

  const [comandas, setComandas] = useState<HistorialComandaDTO[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroMesa, setFiltroMesa] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [mesas, setMesas] = useState<MesaOption[]>([]);
  const [cargandoMesas, setCargandoMesas] = useState(false);

  useEffect(() => {
    cargarHistorial();
    cargarMesas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarHistorial() {
    try {
      setCargando(true);
      setError(null);

      const res = await fetch('/api/historial');

      if (!res.ok) {
        let mensaje = 'Error al cargar historial de comandas';
        try {
          const body = await res.json();
          if (body?.mensaje) mensaje = body.mensaje;
        } catch {
          /* ignore */
        }
        throw new Error(mensaje);
      }

      const json = await res.json();
      const data = (json.data || []) as HistorialComandaDTO[];

      data.sort((a, b) => {
        const fa = new Date(a.fecha).getTime();
        const fb = new Date(b.fecha).getTime();
        return fb - fa;
      });

      setComandas(data);

    } catch (err: unknown) {
      console.error('Error cargando historial:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error inesperado al cargar historial');
      }
    }
  }

  async function cargarMesas() {
    try {
      setCargandoMesas(true);
      const res = await fetch('/api/mesas');

      if (!res.ok) {
        console.error('Error cargando mesas para filtros');
        return;
      }

      const json = await res.json();
      const data = (json.data || []) as MesaOption[];

      data.sort((a, b) => a.numero - b.numero);
      setMesas(data);

    } catch (err: unknown) {
      console.error('Error cargando mesas para filtros:', err);
    } finally {
      setCargandoMesas(false);
    }
  }

  function limpiarFiltros() {
    setFechaDesde('');
    setFechaHasta('');
    setFiltroMesa('');
    setFiltroUsuario('');
    setExpandedId(null);
  }

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function formatearFecha(valor: string) {
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return valor;
    return new Intl.DateTimeFormat('es-GT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  }

  function formatearMoneda(valor: number) {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(valor);
  }

  function badgeEstado(estado: string) {
    const base =
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
    switch (estado) {
      case 'CERRADA':
        return (
          <span
            className={`${base} bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300`}
          >
            CERRADA
          </span>
        );
      case 'CANCELADA':
        return (
          <span
            className={`${base} bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300`}
          >
            CANCELADA
          </span>
        );
      case 'ABIERTA':
        return (
          <span
            className={`${base} bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300`}
          >
            ABIERTA
          </span>
        );
      default:
        return (
          <span
            className={`${base} bg-slate-100/80 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200`}
          >
            {estado}
          </span>
        );
    }
  }

  const comandasFiltradas = useMemo(() => {
    return comandas.filter((c) => {
      if (!esAdmin && usuario?.nombre) {
        const nombreUsuario = usuario.nombre.toLowerCase().trim();
        const nombreComanda = (c.usuarioNombre || '').toLowerCase().trim();
        if (nombreComanda !== nombreUsuario) return false;
      }

      if (fechaDesde && new Date(c.fecha) < new Date(fechaDesde)) return false;
      if (fechaHasta &&
        new Date(c.fecha) > new Date(fechaHasta + 'T23:59:59'))
        return false;

      if (filtroMesa) {
        const mesaStr = String(c.mesaNumero ?? '');
        if (mesaStr !== filtroMesa) return false;
      }

      if (filtroUsuario && esAdmin) {
        if (
          !c.usuarioNombre
            .toLowerCase()
            .includes(filtroUsuario.toLowerCase())
        )
          return false;
      }

      return true;
    });
  }, [
    comandas,
    fechaDesde,
    fechaHasta,
    filtroMesa,
    filtroUsuario,
    esAdmin,
    usuario?.nombre,
  ]);

  // imprimirComanda sin cambios...

  // exportarExcel sin cambios...

  return (
    <>
      {/* ... todo tu JSX intacto ... */}
    </>
  );
}
