// app/dashboard/administracion/_components/MesasTab.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  obtenerMesas,
  crearMesa,
  actualizarMesa,
  eliminarMesa,
  type MesaDTO,
} from '@/app/lib/admin-api';
import { Loader2, Pencil, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function MesasTab() {
  const [mesas, setMesas] = useState<MesaDTO[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [form, setForm] = useState({
    numero: '',
    nombre: '',
    capacidad: '',
    activa: true,
  });

  const { showToast } = useToast();

  // ===============================
  // Cargar mesas al inicio
  // ===============================
  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        setError(null);
        const data = await obtenerMesas();
        setMesas(data);
      } catch (err: unknown) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al cargar mesas';
        setError(mensaje);
        showToast({
          type: 'error',
          message: mensaje,
        });
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [showToast]);

  const limpiarForm = () => {
    setForm({
      numero: '',
      nombre: '',
      capacidad: '',
      activa: true,
    });
    setEditandoId(null);
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'activa') {
      setForm((prev) => ({ ...prev, activa: value === 'true' }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ===============================
  // Crear / Actualizar
  // ===============================
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.numero) {
      const mensaje = 'El número de mesa es obligatorio';
      setError(mensaje);
      showToast({
        type: 'error',
        message: mensaje,
      });
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const payload = {
        numero: Number(form.numero),
        nombre: form.nombre || undefined,
        capacidad: form.capacidad ? Number(form.capacidad) : undefined,
        activa: form.activa,
      };

      if (editandoId) {
        const mesaActualizada = await actualizarMesa(editandoId, payload);
        setMesas((prev) =>
          prev.map((m) => (m.mesaId === editandoId ? mesaActualizada : m))
        );

        showToast({
          type: 'success',
          message: `La mesa ${mesaActualizada.numero} se actualizó correctamente.`,
        });
      } else {
        const nuevaMesa = await crearMesa(payload);
        setMesas((prev) =>
          [...prev, nuevaMesa].sort((a, b) => a.numero - b.numero)
        );

        showToast({
          type: 'success',
          message: `La mesa ${nuevaMesa.numero} se creó correctamente.`,
        });
      }

      limpiarForm();
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error ? err.message : 'Error al guardar la mesa';
      setError(mensaje);
      showToast({
        type: 'error',
        message: mensaje,
      });
    } finally {
      setCargando(false);
    }
  };

  // ===============================
  // Editar
  // ===============================
  const onEditar = (mesa: MesaDTO) => {
    setEditandoId(mesa.mesaId);
    setForm({
      numero: String(mesa.numero),
      nombre: mesa.nombre ?? '',
      capacidad: mesa.capacidad != null ? String(mesa.capacidad) : '',
      activa: mesa.activa,
    });

    showToast({
      type: 'info',
      message: `Editando la mesa ${mesa.numero}.`,
    });
  };

  // ===============================
  // Eliminar (desactivar)
  // ===============================
  const onEliminar = (mesa: MesaDTO) => {
    showToast({
      type: 'confirm',
      message: `¿Deseas desactivar la mesa ${mesa.numero}?`,
      onConfirm: async () => {
        try {
          setCargando(true);
          setError(null);

          const mesaEliminada = await eliminarMesa(mesa.mesaId);
          setMesas((prev) =>
            prev.map((m) =>
              m.mesaId === mesaEliminada.mesaId ? mesaEliminada : m
            )
          );

          showToast({
            type: 'success',
            message: `La mesa ${mesa.numero} fue desactivada correctamente.`,
          });
        } catch (err: unknown) {
          const mensaje =
            err instanceof Error ? err.message : 'Error al eliminar mesa';
          setError(mensaje);
          showToast({
            type: 'error',
            message: mensaje,
          });
        } finally {
          setCargando(false);
        }
      },
      onCancel: () => {
        showToast({
          type: 'info',
          message: 'Acción cancelada. No se realizaron cambios.',
        });
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* ===============================
          FORMULARIO
      =============================== */}
      <form
        onSubmit={onSubmit}
        className="
          grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]
          items-end
        "
      >
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Número de mesa *
          </label>
          <input
            type="number"
            name="numero"
            value={form.numero}
            onChange={onChange}
            className="
              w-full rounded-[var(--radius-md)] border
              border-[var(--border-color)] bg-[var(--bg-main)]
              px-3 py-2 text-sm text-[var(--text-main)]
            "
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Nombre / Alias
          </label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            className="
              w-full rounded-[var(--radius-md)] border
              border-[var(--border-color)] bg-[var(--bg-main)]
              px-3 py-2 text-sm text-[var(--text-main)]
            "
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Capacidad (personas)
          </label>
          <input
            type="number"
            name="capacidad"
            value={form.capacidad}
            onChange={onChange}
            className="
              w-full rounded-[var(--radius-md)] border
              border-[var(--border-color)] bg-[var(--bg-main)]
              px-3 py-2 text-sm text-[var(--text-main)]
            "
          />
        </div>

        <div className="flex items-center gap-2 md:flex-col md:items-stretch">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Estado
            </label>
            <select
              name="activa"
              value={String(form.activa)}
              onChange={onChange}
              className="
                w-full rounded-[var(--radius-md)] border
                border-[var(--border-color)] bg-[var(--bg-main)]
                px-3 py-2 text-sm text-[var(--text-main)]
              "
            >
              <option value="true">Activa</option>
              <option value="false">Inactiva</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2 md:pt-0 md:justify-end">
            <button
              type="submit"
              disabled={cargando}
              className="
                inline-flex items-center gap-2 rounded-[var(--radius-md)]
                bg-[var(--accent-primary)] px-3 py-2 text-xs font-medium
                text-white shadow-sm
                hover:brightness-110 disabled:opacity-70
              "
            >
              {cargando && <Loader2 className="h-3 w-3 animate-spin" />}
              {editandoId ? 'Actualizar' : 'Agregar'}
            </button>

            {editandoId && (
              <button
                type="button"
                onClick={limpiarForm}
                className="
                  inline-flex items-center gap-1 rounded-[var(--radius-md)]
                  border border-[var(--border-color)]
                  px-3 py-2 text-xs font-medium
                  text-[var(--text-secondary)]
                  hover:bg-[var(--bg-main)]
                "
              >
                <X className="h-3 w-3" />
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      {/* ===============================
          ERROR INLINE
      =============================== */}
      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* ===============================
          LISTA / TABLA RESPONSIVE
      =============================== */}

      {/* MÓVIL: Cards */}
      <div className="space-y-2 md:hidden">
        {cargando && (
          <div className="flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-main)]/40 px-3 py-3 text-xs text-[var(--text-secondary)]">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Cargando mesas...
          </div>
        )}

        {!cargando && mesas.length === 0 && (
          <div className="rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-main)]/40 px-3 py-3 text-xs text-[var(--text-secondary)] text-center">
            No hay mesas registradas.
          </div>
        )}

        {mesas.map((mesa) => (
          <div
            key={mesa.mesaId}
            className="
              rounded-[var(--radius-md)] border border-[var(--border-color)]
              bg-[var(--bg-card)] px-3 py-2 text-xs
              flex flex-col gap-2
            "
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[var(--text-main)]">
                  Mesa {mesa.numero}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                  {mesa.nombre || 'Sin alias'}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                  Capacidad:{' '}
                  {mesa.capacidad != null ? mesa.capacidad : 'No definida'}
                </p>
              </div>

              <div className="shrink-0">
                {mesa.activa ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    <Check className="h-3 w-3" />
                    Activa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                    Inactiva
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => onEditar(mesa)}
                className="
                  inline-flex items-center gap-1 rounded-full bg-[var(--bg-main)]
                  px-2 py-1 text-[11px] text-[var(--text-secondary)]
                  hover:bg-[var(--accent-primary)] hover:text-white
                "
              >
                <Pencil className="h-3 w-3" />
                Editar
              </button>

              <button
                onClick={() => onEliminar(mesa)}
                className="
                  inline-flex items-center gap-1 rounded-full bg-[var(--bg-main)]
                  px-2 py-1 text-[11px] text-red-300
                  hover:bg-red-500 hover:text-white
                "
              >
                <Trash2 className="h-3 w-3" />
                Desactivar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* TABLET / DESKTOP: Tabla clásica */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-color)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--bg-main)]/60">
              <tr className="text-left text-xs uppercase text-[var(--text-secondary)]">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2 text-center">Capacidad</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mesas.length === 0 && !cargando && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-xs text-[var(--text-secondary)]"
                  >
                    No hay mesas registradas.
                  </td>
                </tr>
              )}

              {mesas.map((mesa) => (
                <tr
                  key={mesa.mesaId}
                  className="border-t border-[var(--border-color)] text-[var(--text-main)]"
                >
                  <td className="px-3 py-2">{mesa.numero}</td>
                  <td className="px-3 py-2">
                    {mesa.nombre || (
                      <span className="text-[var(--text-secondary)]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {mesa.capacidad ?? (
                      <span className="text-[var(--text-secondary)]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {mesa.activa ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        <Check className="h-3 w-3" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onEditar(mesa)}
                        className="
                          inline-flex items-center rounded-full bg-[var(--bg-main)]
                          p-1.5 text-[var(--text-secondary)]
                          hover:bg-[var(--accent-primary)] hover:text-white
                        "
                        title="Editar mesa"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onEliminar(mesa)}
                        className="
                          inline-flex items-center rounded-full bg-[var(--bg-main)]
                          p-1.5 text-red-300 hover:bg-red-500 hover:text-white
                        "
                        title="Desactivar mesa"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {cargando && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-3 text-center text-xs text-[var(--text-secondary)]"
                  >
                    <Loader2 className="mr-2 inline h-3 w-3 animate-spin" />
                    Cargando...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
