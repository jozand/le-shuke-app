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


/* =========================
   PRODUCTOS / CATÁLOGO
   ========================= */

export interface ProductoCatalogoDTO {
  productoId: number;
  nombre: string;
  descripcion?: string | null;
  precio: number; // Precio de venta
}

/**
 * Categoría con su lista de productos
 */
export interface CategoriaConProductosDTO {
  categoriaId: number;
  nombre: string;
  productos: ProductoCatalogoDTO[];
}

/* =========================
   PEDIDO DETALLE
   ========================= */

export interface PedidoDetalleDTO {
  pedidoDetalleId: number;
  pedidoId: number;
  productoId: number;

  nombreProducto: string;
  categoriaNombre?: string | null;

  cantidad: number;
  precioUnitario: number;

  /**
   * Subtotal calculado en backend. Si viene null,
   * en el frontend usamos cantidad * precioUnitario.
   */
  subtotal?: number | null;
}

/* =========================
   INPUTS PARA ACCIONES
   ========================= */

export interface AgregarProductoAPedidoInput {
  pedidoId: number;
  productoId: number;
  cantidad: number;
}

export interface ActualizarCantidadDetalleInput {
  pedidoDetalleId: number;
  cantidad: number;
}


/* =========================
   CATÁLOGO DE PRODUCTOS
   ========================= */

/**
 * Devuelve el catálogo de productos agrupado por categoría.
 * Endpoint sugerido: GET /api/catalogo/productos
 */
export async function obtenerCatalogoConProductos(): Promise<CategoriaConProductosDTO[]> {
  const res = await fetch('/api/catalogo/productos', {
    method: 'GET',
    cache: 'no-store',
  });

  return handleResponse<CategoriaConProductosDTO[]>(res);
}

/* =========================
   DETALLE DEL PEDIDO
   ========================= */

/**
 * Devuelve el detalle de la comanda/pedido.
 * Endpoint sugerido: GET /api/pedidos/[pedidoId]/detalles
 */
export async function obtenerPedidoDetalle(
  pedidoId: number
): Promise<PedidoDetalleDTO[]> {
  const res = await fetch(`/api/pedidos/${pedidoId}/detalles`, {
    method: 'GET',
    cache: 'no-store',
  });

  return handleResponse<PedidoDetalleDTO[]>(res);
}

/**
 * Agrega un producto al pedido con la cantidad indicada.
 * Endpoint sugerido: POST /api/pedidos/[pedidoId]/detalles
 */
export async function agregarProductoAPedido(
  input: AgregarProductoAPedidoInput
): Promise<PedidoDetalleDTO> {
  const { pedidoId, productoId, cantidad } = input;

  const res = await fetch(`/api/pedidos/${pedidoId}/detalles`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productoId, cantidad }),
  });

  return handleResponse<PedidoDetalleDTO>(res);
}

/**
 * Actualiza la cantidad de un detalle de pedido.
 * Endpoint sugerido: PUT /api/pedidos/detalles/[pedidoDetalleId]
 */
export async function actualizarCantidadDetalle(
  input: ActualizarCantidadDetalleInput
): Promise<PedidoDetalleDTO> {
  const { pedidoDetalleId, cantidad } = input;

  const res = await fetch(`/api/pedidos/detalles/${pedidoDetalleId}`, {
    method: 'PUT',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cantidad }),
  });

  return handleResponse<PedidoDetalleDTO>(res);
}

/**
 * Elimina un producto (detalle) de la comanda.
 * Endpoint sugerido: DELETE /api/pedidos/detalles/[pedidoDetalleId]
 */
export async function eliminarDetallePedido(
  pedidoDetalleId: number
): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/pedidos/detalles/${pedidoDetalleId}`, {
    method: 'DELETE',
    cache: 'no-store',
  });

  return handleResponse<{ ok: boolean }>(res);
}

/**
 * Finaliza el pedido/comanda.
 * Endpoint sugerido: POST /api/pedidos/[pedidoId]/finalizar
 */
export async function finalizarPedido(
  pedidoId: number,
  metodoPagoId: number
): Promise<void> {
  const res = await fetch(`/api/pedidos/${pedidoId}/finalizar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ metodoPagoId }),
  });

  // Usamos tu helper genérico
  await handleResponse<unknown>(res);
}

export interface DashboardKPIs {
  totalPedidos: number;
  totalVentas: number;
  ticketPromedio: number;
  pedidosAbiertos: number;
  pedidosCerrados: number;
  pedidosCancelados: number;
}

export interface DashboardVentaDia {
  fecha: string;          // 'YYYY-MM-DD'
  totalVentas: number;
  totalPedidos: number;
}

export interface DashboardMetodoPago {
  metodoPagoId: number;
  nombre: string;
  total: number;
}

export interface DashboardTopProducto {
  productoId: number;
  nombre: string;
  cantidadVendida: number;
  montoTotal: number;
}

export interface DashboardTopMesero {
  usuarioId: number;
  nombre: string;
  totalVentas: number;
  totalPedidos: number;
}

export interface DashboardResponse {
  periodo: {
    desde: string;
    hasta: string;
  };
  filtros: {
    esAdmin: boolean;
    usuarioId: number | null;
  };
  kpis: DashboardKPIs;
  ventasPorDia: DashboardVentaDia[];
  ventasPorMetodoPago: DashboardMetodoPago[];
  topProductos: DashboardTopProducto[];
  topMeseros: DashboardTopMesero[];
}

export async function obtenerDashboard(
  desde?: string,
  hasta?: string,
  rol?: string,
  usuarioId?: number
): Promise<DashboardResponse> {
  const params = new URLSearchParams();
  if (desde) params.append('desde', desde);
  if (hasta) params.append('hasta', hasta);

  const res = await fetch(`/api/dashboard?${params.toString()}`, {
    method: 'GET',
    headers: {
      ...(rol ? { 'x-rol': rol } : {}),
      ...(usuarioId ? { 'x-usuario-id': String(usuarioId) } : {}),
    },
  });

  if (!res.ok) {
    let mensaje = 'Error al obtener dashboard';
    try {
      const body = await res.json();
      if (body?.mensaje) mensaje = body.mensaje;
    } catch {
      // ignore
    }
    throw new Error(mensaje);
  }

  const json = await res.json();
  return json.data as DashboardResponse;
}
