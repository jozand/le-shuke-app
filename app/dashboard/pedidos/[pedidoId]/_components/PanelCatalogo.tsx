'use client';

import React from 'react';
import type { CategoriaConProductosDTO } from '@/app/lib/admin-api';
import { Minus, Plus } from 'lucide-react';

interface Props {
  catalogo: CategoriaConProductosDTO[];
  categoriaActivaId: number | null;
  setCategoriaActivaId: (id: number) => void;

  procesandoAccion: boolean;

  getCantidadCatalogo: (id: number) => number;
  cambiarCantidadCatalogo: (id: number, delta: number) => void;
  setCantidadCatalogoDirecto: (id: number, valor: number) => void;

  onAgregarProducto: (productoId: number, nombre: string, cantidad: number) => void;

  /** clases de order para el responsive */
  order: string;
}

export default function PanelCatalogo({
  catalogo,
  categoriaActivaId,
  setCategoriaActivaId,
  procesandoAccion,
  getCantidadCatalogo,
  cambiarCantidadCatalogo,
  setCantidadCatalogoDirecto,
  onAgregarProducto,
  order,
}: Props) {

  const categoriaActiva =
    categoriaActivaId !== null
      ? catalogo.find(c => c.categoriaId === categoriaActivaId) ?? null
      : null;

  return (
    <div
      className={`
        rounded-[var(--radius-lg)] border border-[var(--border-color)]
        bg-[var(--bg-card)] shadow-[var(--shadow-card)]
        p-3 sm:p-4 w-full overflow-x-hidden
        ${order}
      `}
    >
      {/* Título */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[var(--text-main)]">
          Catálogo de productos
        </h2>
      </div>

      {/* Si no hay catálogo */}
      {catalogo.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          No hay productos disponibles.
        </p>
      ) : (
        <>
          {/* ======================
              TABS CATEGORÍAS
          ====================== */}
          <div className="mb-3 border-b border-[var(--border-color)]">
            <div
              className="
                flex gap-2 overflow-x-auto pb-1 
                no-scrollbar
              "
            >
              {catalogo.map(cat => {
                const activa = cat.categoriaId === categoriaActivaId;

                return (
                  <button
                    key={cat.categoriaId}
                    type="button"
                    onClick={() => setCategoriaActivaId(cat.categoriaId)}
                    className={`
                      relative inline-flex items-center whitespace-nowrap
                      rounded-full px-3 py-1.5 text-xs font-medium border transition
                      touch-manipulation
                      ${activa
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }
                    `}
                  >
                    {cat.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ======================
              PRODUCTOS POR CATEGORÍA
          ====================== */}
          <div className="max-h-[65vh] overflow-y-auto pr-1 w-full overflow-x-hidden">
            {categoriaActiva && categoriaActiva.productos.length > 0 ? (
              <div
                className="
                  grid 
                  grid-cols-1 
                  sm:grid-cols-2 
                  xl:grid-cols-3 
                  gap-3
                "
              >
                {categoriaActiva.productos.map(prod => {
                  const cantidad = getCantidadCatalogo(prod.productoId);

                  return (
                    <div
                      key={prod.productoId}
                      className="
                        flex flex-col justify-between gap-2
                        rounded-[var(--radius-md)]
                        border border-[var(--border-color)]
                        bg-[var(--bg-elevated)]
                        px-3 py-3
                        hover:bg-[var(--bg-hover)] transition
                        w-full 
                        touch-manipulation
                      "
                    >
                      {/* Nombre + descripción + precio */}
                      <div className="flex w-full items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-main)] truncate">
                            {prod.nombre}
                          </p>

                          {prod.descripcion && (
                            <p className="mt-1 text-[11px] text-[var(--text-muted)] line-clamp-3">
                              {prod.descripcion}
                            </p>
                          )}
                        </div>

                        <span
                          className="
                            text-xs font-bold text-[var(--text-main)]
                            whitespace-nowrap rounded-full
                            border border-[var(--border-color)]
                            px-2 py-1
                          "
                        >
                          Q {prod.precio.toFixed(2)}
                        </span>
                      </div>

                      {/* Selector + agregar */}
                      <div className="mt-1 flex flex-col gap-2 sm:gap-3">
                        {/* Selector táctil */}
                        <div
                          className="
                            inline-flex items-center justify-between
                            rounded-full border border-[var(--border-color)]
                            bg-[var(--bg-card)] px-2 py-1
                            w-full sm:w-auto
                          "
                        >
                          {/* - */}
                          <button
                            type="button"
                            onClick={() =>
                              cambiarCantidadCatalogo(prod.productoId, -1)
                            }
                            disabled={procesandoAccion}
                            className="
                              flex items-center justify-center rounded-full 
                              bg-[var(--bg-elevated)] active:bg-[var(--bg-hover)]
                              transition active:scale-95
                              touch-manipulation
                            "
                            style={{ width: 36, height: 36 }}
                          >
                            <Minus className="h-5 w-5" />
                          </button>

                          {/* INPUT */}
                          <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={1}
                            max={99}
                            className="
                              w-14 mx-1 text-center text-base
                              bg-transparent border-none 
                              focus:outline-none appearance-none
                              touch-manipulation
                            "
                            style={{ fontSize: 16 }}
                            value={cantidad}
                            onChange={e =>
                              setCantidadCatalogoDirecto(
                                prod.productoId,
                                Number(e.target.value)
                              )
                            }
                          />

                          {/* + */}
                          <button
                            type="button"
                            onClick={() =>
                              cambiarCantidadCatalogo(prod.productoId, 1)
                            }
                            disabled={procesandoAccion}
                            className="
                              flex items-center justify-center rounded-full 
                              bg-[var(--bg-elevated)] active:bg-[var(--bg-hover)]
                              transition active:scale-95
                              touch-manipulation
                            "
                            style={{ width: 36, height: 36 }}
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Botón agregar */}
                        <button
                          type="button"
                          disabled={procesandoAccion}
                          onClick={() =>
                            onAgregarProducto(prod.productoId, prod.nombre, cantidad)
                          }
                          className="
                            inline-flex items-center justify-center
                            rounded-[var(--radius-md)]
                            bg-emerald-500 px-3 py-2 
                            text-xs font-semibold text-white
                            hover:bg-emerald-600
                            disabled:opacity-55 disabled:cursor-not-allowed
                            active:scale-[0.97] transition
                            w-full sm:w-auto sm:self-end
                            touch-manipulation
                          "
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">
                No hay productos configurados para esta categoría.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
