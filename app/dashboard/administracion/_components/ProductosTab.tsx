// app/dashboard/administracion/_components/ProductosTab.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerCategorias,
  type ProductoDTO,
  type CategoriaDTO,
} from '@/app/lib/admin-api';
import { Loader2, Pencil, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function ProductosTab() {
  const [productos, setProductos] = useState<ProductoDTO[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoriaId: '',
    activo: true,
  });

  const { showToast } = useToast();

  // ========================================
  // Cargar productos + categorías
  // ========================================
  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        setError(null);

        const [prods, cats] = await Promise.all([
          obtenerProductos(),
          obtenerCategorias(),
        ]);

        setProductos(prods);
        setCategorias(cats);
      } catch (err: unknown) {
        const mensaje =
          err instanceof Error
            ? err.message
            : 'Error al cargar productos';

        setError(mensaje);
        showToast({ type: 'error', message: mensaje });
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
      precio: '',
      categoriaId: '',
      activo: true,
    });
    setEditandoId(null);
  };

  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === 'activo') {
      setForm((prev) => ({ ...prev, activo: value === 'true' }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ========================================
  // Submit (crear/actualizar)
  // ========================================
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      const mensaje = 'El nombre del producto es obligatorio';
      setError(mensaje);
      showToast({ type: 'error', message: mensaje });
      return;
    }

    if (!form.precio || isNaN(Number(form.precio))) {
      const mensaje = 'El precio es obligatorio y debe ser numérico';
      setError(mensaje);
      showToast({ type: 'error', message: mensaje });
      return;
    }

    if (!form.categoriaId) {
      const mensaje = 'Debe seleccionar una categoría';
      setError(mensaje);
      showToast({ type: 'error', message: mensaje });
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        precio: Number(form.precio),
        categoriaId: Number(form.categoriaId),
        activo: form.activo,
      };

      if (editandoId) {
        const prodActualizado = await actualizarProducto(editandoId, payload);

        setProductos((prev) =>
          prev.map((p) =>
            p.productoId === editandoId ? prodActualizado : p
          )
        );

        showToast({
          type: 'success',
          message: `El producto "${prodActualizado.nombre}" se actualizó correctamente.`,
        });
      } else {
        const nuevoProd = await crearProducto(payload);

        setProductos((prev) =>
          [...prev, nuevoProd].sort((a, b) =>
            a.nombre.localeCompare(b.nombre)
          )
        );

        showToast({
          type: 'success',
          message: `El producto "${nuevoProd.nombre}" se creó correctamente.`,
        });
      }

      limpiarForm();
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error
          ? err.message
          : 'Error al guardar el producto';

      setError(mensaje);
      showToast({ type: 'error', message: mensaje });
    } finally {
      setCargando(false);
    }
  };

  // ========================================
  // Editar
  // ========================================
  const onEditar = (prod: ProductoDTO) => {
    setEditandoId(prod.productoId);
    setForm({
      nombre: prod.nombre,
      descripcion: prod.descripcion ?? '',
      precio: String(prod.precio),
      categoriaId: String(prod.categoriaId),
      activo: prod.activo,
    });

    showToast({
      type: 'info',
      message: `Editando el producto "${prod.nombre}".`,
    });
  };

  // ========================================
  // Eliminar (desactivar)
  // ========================================
  const onEliminar = (prod: ProductoDTO) => {
    showToast({
      type: 'confirm',
      message: `¿Deseas desactivar el producto "${prod.nombre}"?`,
      onConfirm: async () => {
        try {
          setCargando(true);
          setError(null);

          const prodEliminado = await eliminarProducto(prod.productoId);

          setProductos((prev) =>
            prev.map((p) =>
              p.productoId === prodEliminado.productoId
                ? prodEliminado
                : p
            )
          );

          showToast({
            type: 'success',
            message: `El producto "${prod.nombre}" fue desactivado correctamente.`,
          });
        } catch (err: unknown) {
          const mensaje =
            err instanceof Error
              ? err.message
              : 'Error al eliminar producto';

          setError(mensaje);
          showToast({ type: 'error', message: mensaje });
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

  // ========================================
  // Helper categoría
  // ========================================
  const getNombreCategoria = (categoriaId: number) => {
    const cat = categorias.find((c) => c.categoriaId === categoriaId);
    return cat?.nombre ?? '—';
  };

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="space-y-4">
      {/* ========================================
        FORMULARIO
      ======================================== */}
      <form
        onSubmit={onSubmit}
        className="
          grid gap-3
          md:grid-cols-[1.2fr_1.5fr_0.8fr_1fr_auto]
          items-end
        "
      >
        {/* Nombre */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Nombre del producto *
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

        {/* Descripción */}
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

        {/* Precio */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Precio *
          </label>
          <input
            type="number"
            step="0.01"
            name="precio"
            value={form.precio}
            onChange={onChange}
            className="
              w-full rounded-[var(--radius-md)] border
              border-[var(--border-color)] bg-[var(--bg-main)]
              px-3 py-2 text-sm text-[var(--text-main)]
            "
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Categoría *
          </label>
          <select
            name="categoriaId"
            value={form.categoriaId}
            onChange={onChange}
            className="
              w-full rounded-[var(--radius-md)] border
              border-[var(--border-color)] bg-[var(--bg-main)]
              px-3 py-2 text-sm text-[var(--text-main)]
            "
          >
            <option value="">Seleccione...</option>
            {categorias.map((cat) => (
              <option key={cat.categoriaId} value={cat.categoriaId}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div className="flex items-center gap-2 md:flex-col md:items-stretch">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Estado
            </label>
            <select
              name="activo"
              value={String(form.activo)}
              onChange={onChange}
              className="
                w-full rounded-[var(--radius-md)] border
                border-[var(--border-color)] bg-[var(--bg-main)]
                px-3 py-2 text-sm text-[var(--text-main)]
              "
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2 md:pt-0 md:justify-end">
            <button
              type="submit"
              disabled={cargando}
              className="
                inline-flex items-center gap-2 rounded-[var(--radius-md)]
                bg-[var(--accent-primary)] px-3 py-2 text-xs font-medium
                text-white shadow-sm hover:brightness-110
                disabled:opacity-70
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

      {/* ERROR INLINE */}
      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* ========================================
        LISTA RESPONSIVA
      ======================================== */}

      {/* MOBILE: CARDS */}
      <div className="space-y-2 md:hidden">
        {cargando && (
          <div className="flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-color)]
            bg-[var(--bg-main)]/40 px-3 py-3 text-xs text-[var(--text-secondary)]">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Cargando productos...
          </div>
        )}

        {!cargando && productos.length === 0 && (
          <div className="rounded-[var(--radius-md)] border border-[var(--border-color)]
            bg-[var(--bg-main)]/40 px-3 py-3 text-xs text-[var(--text-secondary)] text-center">
            No hay productos registrados.
          </div>
        )}

        {productos.map((prod) => (
          <div
            key={prod.productoId}
            className="
              rounded-[var(--radius-md)] border border-[var(--border-color)]
              bg-[var(--bg-card)] px-3 py-2 text-xs flex flex-col gap-2
            "
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[var(--text-main)]">
                  {prod.nombre}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                  {prod.descripcion || 'Sin descripción'}
                </p>

                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                  Categoría: {getNombreCategoria(prod.categoriaId)}
                </p>

                <p className="mt-0.5 font-semibold text-[var(--text-main)]">
                  Q {Number(prod.precio).toFixed(2)}
                </p>
              </div>

              <div className="shrink-0">
                {prod.activo ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10
                    px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    <Check className="h-3 w-3" /> Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10
                    px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                    Inactivo
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => onEditar(prod)}
                className="
                  inline-flex items-center gap-1 rounded-full bg-[var(--bg-main)]
                  px-2 py-1 text-[11px] text-[var(--text-secondary)]
                  hover:bg-[var(--accent-primary)] hover:text-white
                "
              >
                <Pencil className="h-3 w-3" /> Editar
              </button>

              <button
                onClick={() => onEliminar(prod)}
                className="
                  inline-flex items-center gap-1 rounded-full bg-[var(--bg-main)]
                  px-2 py-1 text-[11px] text-red-300 hover:bg-red-500 hover:text-white
                "
              >
                <Trash2 className="h-3 w-3" /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP/TABLET: TABLA */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-color)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--bg-main)]/60">
              <tr className="text-left text-xs uppercase text-[var(--text-secondary)]">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2 text-right">Precio</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {!cargando && productos.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-xs text-[var(--text-secondary)]"
                  >
                    No hay productos registrados.
                  </td>
                </tr>
              )}

              {productos.map((prod) => (
                <tr
                  key={prod.productoId}
                  className="border-t border-[var(--border-color)] text-[var(--text-main)]"
                >
                  <td className="px-3 py-2">{prod.nombre}</td>
                  <td className="px-3 py-2">
                    {getNombreCategoria(prod.categoriaId)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    Q {Number(prod.precio).toFixed(2)}
                  </td>

                  <td className="px-3 py-2 text-center">
                    {prod.activo ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10
                        px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        <Check className="h-3 w-3" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10
                        px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                        Inactivo
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onEditar(prod)}
                        className="
                          inline-flex items-center rounded-full bg-[var(--bg-main)]
                          p-1.5 text-[var(--text-secondary)]
                          hover:bg-[var(--accent-primary)] hover:text-white
                        "
                        title="Editar producto"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>

                      <button
                        onClick={() => onEliminar(prod)}
                        className="
                          inline-flex items-center rounded-full bg-[var(--bg-main)]
                          p-1.5 text-red-300 hover:bg-red-500 hover:text-white
                        "
                        title="Desactivar producto"
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
