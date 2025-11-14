// app/lib/admin-api.ts

// Helper genérico
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let mensaje = 'Error al consumir API';
    try {
      const body = await res.json();
      if (body?.mensaje) mensaje = body.mensaje;
    } catch {
      // ignore
    }
    throw new Error(mensaje);
  }

  const json = await res.json();
  return json.data as T;
}

/* =========================
   MESAS
   ========================= */

export interface MesaDTO {
  mesaId: number;
  numero: number;
  nombre: string | null;
  capacidad: number | null;
  activa: boolean;
  fechaSistema: string;
}

export async function obtenerMesas(): Promise<MesaDTO[]> {
  const res = await fetch('/api/mesas', { cache: 'no-store' });
  return handleResponse<MesaDTO[]>(res);
}

export async function crearMesa(data: {
  numero: number;
  nombre?: string;
  capacidad?: number;
  activa?: boolean;
}): Promise<MesaDTO> {
  const res = await fetch('/api/mesas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<MesaDTO>(res);
}

export async function actualizarMesa(
  id: number,
  data: {
    numero: number;
    nombre?: string;
    capacidad?: number;
    activa?: boolean;
  }
): Promise<MesaDTO> {
  const res = await fetch(`/api/mesas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<MesaDTO>(res);
}

export async function eliminarMesa(id: number): Promise<MesaDTO> {
  const res = await fetch(`/api/mesas/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<MesaDTO>(res);
}

/* =========================
   CATEGORÍAS
   ========================= */

export interface CategoriaDTO {
  categoriaId: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  fechaSistema: string;
}

export async function obtenerCategorias(): Promise<CategoriaDTO[]> {
  const res = await fetch('/api/categorias', { cache: 'no-store' });
  return handleResponse<CategoriaDTO[]>(res);
}

export async function crearCategoria(data: {
  nombre: string;
  descripcion?: string;
  activa?: boolean;
}): Promise<CategoriaDTO> {
  const res = await fetch('/api/categorias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<CategoriaDTO>(res);
}

export async function actualizarCategoria(
  id: number,
  data: {
    nombre: string;
    descripcion?: string;
    activa?: boolean;
  }
): Promise<CategoriaDTO> {
  const res = await fetch(`/api/categorias/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<CategoriaDTO>(res);
}

export async function eliminarCategoria(id: number): Promise<CategoriaDTO> {
  const res = await fetch(`/api/categorias/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<CategoriaDTO>(res);
}

/* =========================
   PRODUCTOS
   ========================= */

export interface ProductoDTO {
  productoId: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  activo: boolean;
  categoriaId: number;
  fechaSistema: string;
  // Si tu API devuelve la categoría populada, podrías luego agregar:
  // categoriaNombre?: string;
}

export async function obtenerProductos(): Promise<ProductoDTO[]> {
  const res = await fetch('/api/productos', { cache: 'no-store' });
  return handleResponse<ProductoDTO[]>(res);
}

export async function crearProducto(data: {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoriaId: number;
  activo?: boolean;
}): Promise<ProductoDTO> {
  const res = await fetch('/api/productos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<ProductoDTO>(res);
}

export async function actualizarProducto(
  id: number,
  data: {
    nombre: string;
    descripcion?: string;
    precio: number;
    categoriaId: number;
    activo?: boolean;
  }
): Promise<ProductoDTO> {
  const res = await fetch(`/api/productos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<ProductoDTO>(res);
}

export async function eliminarProducto(id: number): Promise<ProductoDTO> {
  const res = await fetch(`/api/productos/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<ProductoDTO>(res);
}

/* =========================
   USUARIOS
   ========================= */

export interface UsuarioDTO {
  usuarioId: number;
  nombre: string;
  email: string;
  rolId: number;
  activo: boolean;
  fechaSistema: string;
  // Si tu endpoint de usuarios devuelve el nombre del rol:
  // rolNombre?: string;
}

export async function obtenerUsuarios(): Promise<UsuarioDTO[]> {
  const res = await fetch('/api/usuarios', { cache: 'no-store' });
  return handleResponse<UsuarioDTO[]>(res);
}

export async function crearUsuario(data: {
  nombre: string;
  email: string;
  password: string;
  rolId: number;
  activo?: boolean;
}): Promise<UsuarioDTO> {
  const res = await fetch('/api/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<UsuarioDTO>(res);
}

export async function actualizarUsuario(
  id: number,
  data: {
    nombre: string;
    email: string;
    rolId: number;
    activo?: boolean;
    password?: string; // opcional, por si permites cambiarla desde admin
  }
): Promise<UsuarioDTO> {
  const res = await fetch(`/api/usuarios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<UsuarioDTO>(res);
}

export async function eliminarUsuario(id: number): Promise<UsuarioDTO> {
  const res = await fetch(`/api/usuarios/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<UsuarioDTO>(res);
}


/* =========================
   MESAS - ESTADO PARA MAPA
   ========================= */

export interface MesaEstadoDTO {
  mesaId: number;
  numero: number;
  nombre: string | null;
  capacidad: number | null;
  ocupada: boolean;
  pedidoIdActivo: number | null;
}

// GET /api/mesas-estado
export async function obtenerMesasEstado(): Promise<MesaEstadoDTO[]> {
  const res = await fetch('/api/mesas/mesas-estado', { cache: 'no-store' });
  return handleResponse<MesaEstadoDTO[]>(res);
}

/* =========================
   PEDIDOS - COMANDAS
   ========================= */

export interface PedidoDTO {
  pedidoId: number;
  mesaId: number;
  usuarioId: number;
  estado: string;
  total: string; // viene como string desde Decimal
  fechaHora: string;
  observaciones: string | null;
}

// POST /api/pedidos - Abrir una nueva comanda
export async function abrirComanda(params: {
  mesaId: number;
  usuarioId: number;
  observaciones?: string;
}): Promise<PedidoDTO> {
  const res = await fetch('/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return handleResponse<PedidoDTO>(res);
}
