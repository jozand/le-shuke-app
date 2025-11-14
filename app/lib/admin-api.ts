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
   AQUÍ LUEGO PUEDES AGREGAR:
   - Categorías
   - Productos
   - Usuarios
   reutilizando el mismo patrón
   ========================= */
