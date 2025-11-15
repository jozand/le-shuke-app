'use client';

import React, { useEffect, useState } from 'react';
import {
  obtenerMesasEstado,
  abrirComanda,
  type MesaEstadoDTO,
  type PedidoDTO,
} from '@/app/lib/admin-api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type MesaConPedido = MesaEstadoDTO & {
  pedidoId?: number | null;
  pedidoIdActivo?: number | null;
};

function obtenerPedidoIdActiva(mesa: MesaConPedido): number | null {
  return mesa.pedidoIdActivo ?? mesa.pedidoId ?? null;
}

export default function MesasPage() {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [mesas, setMesas] = useState<MesaEstadoDTO[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [cargandoMesaId, setCargandoMesaId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cargarMesas() {
    try {
      setError(null);
      setCargandoLista(true);
      const data = await obtenerMesasEstado();
      setMesas(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar mesas';

      console.error(err);
      setError(message);

      showToast({
        type: 'error',
        title: 'Error',
        message,
      });
    } finally {
      setCargandoLista(false);
    }
  }

  useEffect(() => {
    cargarMesas();
  }, []);

  async function manejarClickMesa(mesa: MesaEstadoDTO) {
    if (!usuario) {
      showToast({
        type: 'warning',
        title: 'Sesión requerida',
        message: 'Debes iniciar sesión para gestionar comandas.',
      });
      return;
    }

    const pedidoId = obtenerPedidoIdActiva(mesa);

    // 🟥 Caso 1: Mesa ocupada → ir al pedido ya existente
    if (mesa.ocupada) {
      if (!pedidoId) {
        showToast({
          type: 'info',
          title: 'Mesa ocupada',
          message:
            `La mesa ${mesa.numero} ya está ocupada, ` +
            'pero no se recibió su pedido activo.',
        });
        return;
      }

      showToast({
        type: 'info',
        title: 'Comanda activa',
        message: `Abriendo la comanda #${pedidoId}.`,
      });

      router.push(`/dashboard/pedidos/${pedidoId}`);
      return;
    }

    // 🟩 Caso 2: Mesa libre → abrir comanda
    const confirmar = await new Promise<boolean>((resolve) => {
      showToast({
        type: 'confirm',
        title: 'Abrir comanda',
        message: `¿Deseas abrir una nueva comanda para la mesa ${mesa.numero}?`,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

    if (!confirmar) return;

    try {
      setCargandoMesaId(mesa.mesaId);

      const pedido: PedidoDTO = await abrirComanda({
        mesaId: mesa.mesaId,
        usuarioId: usuario.usuarioId,
      });

      showToast({
        type: 'success',
        title: 'Comanda creada',
        message: `Se abrió la comanda #${pedido.pedidoId} para la mesa ${mesa.numero}.`,
      });

      await cargarMesas();

      router.push(`/dashboard/pedidos/${pedido.pedidoId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo abrir la comanda.';

      console.error(err);

      showToast({
        type: 'error',
        title: 'Error',
        message,
      });
    } finally {
      setCargandoMesaId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            Mesas
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Visualización de mesas para crear y gestionar comandas.
          </p>
        </div>

        <button
          type="button"
          onClick={cargarMesas}
          disabled={cargandoLista}
          className="
            inline-flex items-center gap-2 rounded-[var(--radius-md)]
            border border-[var(--border-color)]
            bg-[var(--bg-elevated)] px-3 py-1.5 text-sm
            text-[var(--text-main)] hover:bg-[var(--bg-hover)]
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {cargandoLista && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          <span>Actualizar</span>
        </button>
      </div>

      {error && (
        <div
          className="
            flex items-center gap-2 rounded-[var(--radius-md)]
            border border-red-500/40 bg-red-500/10 px-3 py-2
            text-sm text-red-400
          "
        >
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div
        className="
          rounded-[var(--radius-lg)] border
          border-[var(--border-color)] bg-[var(--bg-card)]
          shadow-[var(--shadow-card)] p-4
        "
      >
        {cargandoLista && mesas.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Cargando mesas...</span>
            </div>
          </div>
        ) : mesas.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            No hay mesas configuradas. Crea mesas desde la sección de
            Administración &gt; Mesas.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {mesas.map((mesa) => {
              const ocupada = mesa.ocupada;
              const estaCargando = cargandoMesaId === mesa.mesaId;

              return (
                <button
                  key={mesa.mesaId}
                  type="button"
                  onClick={() => manejarClickMesa(mesa)}
                  disabled={estaCargando}
                  className={`
                    relative flex flex-col items-start justify-between
                    rounded-[var(--radius-lg)] border p-3 text-left
                    transition-all
                    ${ocupada
                      ? 'border-red-500/40 bg-red-500/5 hover:bg-red-500/10'
                      : 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10'
                    }
                    disabled:opacity-60 disabled:cursor-not-allowed
                  `}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                        Mesa
                      </p>
                      <p className="text-lg font-semibold text-[var(--text-main)]">
                        {mesa.numero}
                      </p>
                      {mesa.nombre && (
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {mesa.nombre}
                        </p>
                      )}
                    </div>

                    <span
                      className={`
                        inline-flex items-center rounded-full px-2 py-0.5
                        text-xs font-semibold border
                        ${ocupada
                          ? 'border-red-500/40 bg-red-500/20 text-red-100'
                          : 'border-emerald-500/40 bg-emerald-500/20 text-emerald-100'
                        }
                      `}
                    >
                      {ocupada ? 'Ocupada' : 'Libre'}
                    </span>
                  </div>

                  <div className="mt-3 flex w-full items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>
                      Capacidad:{' '}
                      {mesa.capacidad ? `${mesa.capacidad} pers.` : 'N/D'}
                    </span>
                    {estaCargando && (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Abriendo...</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
