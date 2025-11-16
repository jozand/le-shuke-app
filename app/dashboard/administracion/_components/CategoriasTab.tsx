// app/dashboard/administracion/_components/CategoriasTab.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  type CategoriaDTO,
} from '@/app/lib/admin-api';
import { Loader2, Pencil, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function CategoriasTab() {
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    activa: true,
  });

  const { showToast } = useToast();

  // ===============================
  // Cargar categorías al inicio
  // ===============================
  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        setError(null);
        const data = await obtenerCategorias();
        setCategorias(data);
      } catch (err: unknown) {
        const mensaje =
          err instanceof Error
            ? err.message
            : 'Error al cargar categorías';
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
      nombre: '',
      descripcion: '',
      activa: true,
    });
    setEditandoId(null);
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'activa') {
      setForm((prev) => ({ ...prev, activa: value === 'true' }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ===============================
  // Submit crear/actualizar
  // ===============================
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      const mensaje = 'El nombre de la categoría es obligatorio';
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
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        activa: form.activa,
      };

      if (editandoId) {
        const catActualizada = await actualizarCategoria(editandoId, payload);

        setCategorias((prev) =>
          prev.map((c) =>
            c.categoriaId === editandoId ? catActualizada : c
          )
        );

        showToast({
          type: 'success',
          message: `La categoría "${catActualizada.nombre}" se actualizó correctamente.`,
        });
      } else {
        const nuevaCat = await crearCategoria(payload);

        setCategorias((prev) =>
          [...prev, nuevaCat].sort((a, b) =>
            a.nombre.localeCompare(b.nombre)
          )
        );

        showToast({
          type: 'success',
          message: `La categoría "${nuevaCat.nombre}" se creó correctamente.`,
        });
      }

      limpiarForm();
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error ? err.message : 'Error al guardar la categoría';
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
  const onEditar = (cat: CategoriaDTO) => {
    setEditandoId(cat.categoriaId);
    setForm({
      nombre: cat.nombre,
      descripcion: cat.descripcion ?? '',
      activa: cat.activa,
    });

    showToast({
      type: 'info',
      message: `Editando la categoría "${cat.nombre}".`,
    });
  };

  // ===============================
  // Eliminar (desactivar)
  // ===============================
  const onEliminar = (cat: CategoriaDTO) => {
    showToast({
      type: 'confirm',
      message: `¿Deseas desactivar la categoría "${cat.nombre}"?`,
      onConfirm: async () => {
        try {
          setCargando(true);
          setError(null);

          const catEliminada = await eliminarCategoria(cat.categoriaId);

          setCategorias((prev) =>
            prev.map((c) =>
              c.categoriaId === catEliminada.categoriaId ? catEliminada : c
            )
          );

          showToast({
            type: 'success',
            message: `La categoría "${cat.nombre}" fue desactivada correctamente.`,
          });
        } catch (err: unknown) {
          const mensaje =
            err instanceof Error ? err.message : 'Error al eliminar categoría';
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
          grid gap-3
          md:grid-cols-[1.2fr_2fr_auto]
          items-end
        "
      >
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Nombre de categoría *
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
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={onChange}
            rows={1}
            className="
              w-full rounded-[var(--radius-md)] border
              border-[var(--border-color)] bg-[var(--bg-main)]
              px-3 py-2 text-sm text-[var(--text-main)]
              resize-none
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
          TABLA DE CATEGORÍAS
      =============================== */}
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-color)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--bg-main)]/60">
            <tr className="text-left text-xs uppercase text-[var(--text-secondary)]">
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Descripción</th>
              <th className="px-3 py-2 text-center">Estado</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 && !cargando && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-4 text-center text-xs text-[var(--text-secondary)]"
                >
                  No hay categorías registradas.
                </td>
              </tr>
            )}

            {categorias.map((cat) => (
              <tr
                key={cat.categoriaId}
                className="border-t border-[var(--border-color)] text-[var(--text-main)]"
              >
                <td className="px-3 py-2">{cat.nombre}</td>
                <td className="px-3 py-2">
                  {cat.descripcion || (
                    <span className="text-[var(--text-secondary)]">—</span>
                  )}
                </td>

                <td className="px-3 py-2 text-center">
                  {cat.activa ? (
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
                      onClick={() => onEditar(cat)}
                      className="
                        inline-flex items-center rounded-full bg-[var(--bg-main)]
                        p-1.5 text-[var(--text-secondary)]
                        hover:bg-[var(--accent-primary)] hover:text-white
                      "
                      title="Editar categoría"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => onEliminar(cat)}
                      className="
                        inline-flex items-center rounded-full bg-[var(--bg-main)]
                        p-1.5 text-red-300 hover:bg-red-500 hover:text-white
                      "
                      title="Desactivar categoría"
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
                  colSpan={4}
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
  );
}
