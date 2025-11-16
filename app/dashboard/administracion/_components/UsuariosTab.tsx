// app/dashboard/administracion/_components/UsuariosTab.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  type UsuarioDTO,
} from '@/app/lib/admin-api';
import { Loader2, Pencil, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

// ======================================
// DTO del Rol
// ======================================
type RolDTO = {
  rolId: number;
  nombre: string;
  descripcion?: string | null;
  estado: boolean;
};

export default function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [roles, setRoles] = useState<RolDTO[]>([]);

  const [cargando, setCargando] = useState(false);
  const [cargandoRoles, setCargandoRoles] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rolId: '',
    activo: true,
  });

  const { showToast } = useToast();

  // ======================================
  // Cargar usuarios
  // ======================================
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        setCargando(true);
        setError(null);

        const data = await obtenerUsuarios();
        setUsuarios(data);
      } catch (err: unknown) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al cargar usuarios';

        setError(mensaje);
        showToast({ type: 'error', message: mensaje });
      } finally {
        setCargando(false);
      }
    };

    cargarUsuarios();
  }, [showToast]);

  // ======================================
  // Cargar roles
  // ======================================
  useEffect(() => {
    const cargarRoles = async () => {
      try {
        setCargandoRoles(true);

        const res = await fetch('/api/roles');
        if (!res.ok) throw new Error('No se pudieron cargar los roles');

        const json = await res.json();
        const data = (json.data ?? []) as RolDTO[];
        setRoles(data);
      } catch (err: unknown) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al cargar roles';
        showToast({ type: 'error', message: mensaje });
      } finally {
        setCargandoRoles(false);
      }
    };

    cargarRoles();
  }, [showToast]);

  // ======================================
  // Helpers
  // ======================================
  const limpiarForm = () => {
    setForm({
      nombre: '',
      email: '',
      password: '',
      rolId: '',
      activo: true,
    });
    setEditandoId(null);
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'activo') {
      setForm((prev) => ({ ...prev, activo: value === 'true' }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ======================================
  // Submit
  // ======================================
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      const msg = 'El nombre es obligatorio';
      setError(msg);
      showToast({ type: 'error', message: msg });
      return;
    }

    if (!form.email.trim()) {
      const msg = 'El correo electrónico es obligatorio';
      setError(msg);
      showToast({ type: 'error', message: msg });
      return;
    }

    if (!form.rolId) {
      const msg = 'Debe seleccionar un rol';
      setError(msg);
      showToast({ type: 'error', message: msg });
      return;
    }

    if (!editandoId && !form.password.trim()) {
      const msg = 'La contraseña es obligatoria al crear usuario';
      setError(msg);
      showToast({ type: 'error', message: msg });
      return;
    }

    try {
      setCargando(true);
      setError(null);

      if (editandoId) {
        const payload: {
          nombre: string;
          email: string;
          rolId: number;
          activo: boolean;
          password?: string;
        } = {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          rolId: Number(form.rolId),
          activo: form.activo,
        };

        if (form.password.trim()) payload.password = form.password.trim();

        const usrActualizado = await actualizarUsuario(editandoId, payload);

        setUsuarios((prev) =>
          prev.map((u) =>
            u.usuarioId === editandoId ? usrActualizado : u
          )
        );

        showToast({
          type: 'success',
          message: `El usuario "${usrActualizado.nombre}" se actualizó correctamente.`,
        });
      } else {
        const nuevoUsuario = await crearUsuario({
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
          rolId: Number(form.rolId),
          activo: form.activo,
        });

        setUsuarios((prev) =>
          [...prev, nuevoUsuario].sort((a, b) =>
            a.nombre.localeCompare(b.nombre)
          )
        );

        showToast({
          type: 'success',
          message: `El usuario "${nuevoUsuario.nombre}" fue creado correctamente.`,
        });
      }

      limpiarForm();
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error ? err.message : 'Error al guardar usuario';

      setError(mensaje);
      showToast({ type: 'error', message: mensaje });
    } finally {
      setCargando(false);
    }
  };

  // ======================================
  // Editar
  // ======================================
  const onEditar = (usr: UsuarioDTO) => {
    setEditandoId(usr.usuarioId);
    setForm({
      nombre: usr.nombre,
      email: usr.email,
      password: '',
      rolId: String(usr.rolId),
      activo: usr.activo,
    });

    showToast({
      type: 'info',
      message: `Editando el usuario "${usr.nombre}".`,
    });
  };

  // ======================================
  // Eliminar
  // ======================================
  const onEliminar = (usr: UsuarioDTO) => {
    showToast({
      type: 'confirm',
      message: `¿Deseas desactivar al usuario "${usr.nombre}"?`,
      onConfirm: async () => {
        try {
          setCargando(true);
          setError(null);

          const usrEliminado = await eliminarUsuario(usr.usuarioId);

          setUsuarios((prev) =>
            prev.map((u) =>
              u.usuarioId === usrEliminado.usuarioId ? usrEliminado : u
            )
          );

          showToast({
            type: 'success',
            message: `El usuario "${usr.nombre}" fue desactivado.`,
          });
        } catch (err: unknown) {
          const mensaje =
            err instanceof Error
              ? err.message
              : 'Error al eliminar usuario';

          setError(mensaje);
          showToast({ type: 'error', message: mensaje });
        } finally {
          setCargando(false);
        }
      },
      onCancel: () => {
        showToast({
          type: 'info',
          message: 'Acción cancelada.',
        });
      },
    });
  };

  // ======================================
  // Render
  // ======================================
  return (
    <div className="space-y-4">

      {/* ======================================================== */}
      {/* FORMULARIO RESPONSIVE */}
      {/* ======================================================== */}
      <form
        onSubmit={onSubmit}
        className="
          grid gap-4
          sm:grid-cols-1
          md:grid-cols-2
          lg:grid-cols-[1fr_1fr_1fr_auto]
          items-end
        "
      >
        {/* campos */}
        {/* ... (SIN CAMBIOS, TU FORMULARIO ESTÁ PERFECTO) */}
      </form>

      {/* ERROR */}
      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* ======================================================== */}
      {/* RESPONSIVE LISTA: CARDS EN MÓVIL */}
      {/* ======================================================== */}
      <div className="space-y-2 md:hidden">
        {cargando && (
          <div className="flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-main)]/40 px-3 py-3 text-xs text-[var(--text-secondary)]">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Cargando usuarios...
          </div>
        )}

        {!cargando && usuarios.length === 0 && (
          <div className="rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-main)]/40 px-3 py-3 text-xs text-[var(--text-secondary)] text-center">
            No hay usuarios registrados.
          </div>
        )}

        {usuarios.map((usr) => {
          const rol = roles.find((r) => r.rolId === usr.rolId);

          return (
            <div
              key={usr.usuarioId}
              className="
                rounded-[var(--radius-md)] border border-[var(--border-color)]
                bg-[var(--bg-card)] px-3 py-2 text-xs
                flex flex-col gap-2
              "
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--text-main)]">
                    {usr.nombre}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                    {usr.email}
                  </p>

                  <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                    Rol: {rol ? rol.nombre : `#${usr.rolId}`}
                  </p>
                </div>

                <div className="shrink-0">
                  {usr.activo ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      <Check className="h-3 w-3" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                      Inactivo
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onEditar(usr)}
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
                  onClick={() => onEliminar(usr)}
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
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* RESPONSIVE: TABLA SOLO EN PC/TABLET */}
      {/* ======================================================== */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-color)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--bg-main)]/60">
              <tr className="text-left text-xs uppercase text-[var(--text-secondary)]">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Correo</th>
                <th className="px-3 py-2 text-center">Rol</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.length === 0 && !cargando && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-xs text-[var(--text-secondary)]"
                  >
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}

              {usuarios.map((usr) => {
                const rol = roles.find((r) => r.rolId === usr.rolId);

                return (
                  <tr
                    key={usr.usuarioId}
                    className="border-t border-[var(--border-color)] text-[var(--text-main)]"
                  >
                    <td className="px-3 py-2">{usr.nombre}</td>
                    <td className="px-3 py-2">{usr.email}</td>

                    <td className="px-3 py-2 text-center">
                      {rol ? rol.nombre : `Rol #${usr.rolId}`}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {usr.activo ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          <Check className="h-3 w-3" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                          Inactivo
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-3">

                        <button
                          onClick={() => onEditar(usr)}
                          className="
                            inline-flex items-center justify-center
                            rounded-full bg-[var(--bg-main)]
                            p-2 sm:p-2 md:p-1.5
                            text-[var(--text-secondary)]
                            hover:bg-[var(--accent-primary)] hover:text-white
                            active:scale-95 transition
                          "
                          style={{ minWidth: 40, minHeight: 40 }}
                          title="Editar usuario"
                        >
                          <Pencil className="h-4 w-4 md:h-3 md:w-3" />
                        </button>

                        <button
                          onClick={() => onEliminar(usr)}
                          className="
                            inline-flex items-center justify-center
                            rounded-full bg-[var(--bg-main)]
                            p-2 sm:p-2 md:p-1.5
                            text-red-300 hover:bg-red-500 hover:text-white
                            active:scale-95 transition
                          "
                          style={{ minWidth: 40, minHeight: 40 }}
                          title="Desactivar usuario"
                        >
                          <Trash2 className="h-4 w-4 md:h-3 md:w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

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
