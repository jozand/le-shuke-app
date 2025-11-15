// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // 🔹 Rango de fechas opcional (YYYY-MM-DD)
    const desdeStr = searchParams.get('desde');
    const hastaStr = searchParams.get('hasta');

    const hoy = new Date();

    // Primer día del mes actual
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const desde = desdeStr ? new Date(desdeStr) : primerDiaMes;
    const hastaBase = hastaStr ? new Date(hastaStr) : hoy;
    // Ajustamos hasta el final del día
    const hasta = new Date(
      hastaBase.getFullYear(),
      hastaBase.getMonth(),
      hastaBase.getDate(),
      23,
      59,
      59,
      999
    );

    // 🔹 Tomamos el usuarioId desde los headers
    const usuarioIdHeader = req.headers.get('x-usuario-id');
    const usuarioId = usuarioIdHeader ? Number(usuarioIdHeader) : null;

    // 🔹 Consultamos la BD para saber si realmente es Administrador
    let esAdmin = false;

    if (usuarioId) {
      const usuario = await prisma.usuario.findUnique({
        where: { usuarioId },
        include: { rol: true },
      });

      const rolNombre = usuario?.rol?.nombre ?? '';
      const rolNormalizado = rolNombre.trim().toLowerCase();

      // Aquí decides qué nombres de rol cuentan como admin
      esAdmin =
        rolNormalizado === 'administrador' ||
        rolNormalizado === 'administrador general' ||
        rolNormalizado === 'admin';
    }

    // 🔹 Filtro base para pedidos
    const wherePedidoBase: any = {
      fechaHora: {
        gte: desde,
        lte: hasta,
      },
    };

    // Si NO es admin, filtramos por usuario
    if (!esAdmin && usuarioId) {
      wherePedidoBase.usuarioId = usuarioId;
    }

    // 🔹 Filtro base para pagos
    const wherePagoBase: any = {
      fechaPago: {
        gte: desde,
        lte: hasta,
      },
      pedido: {
        ...wherePedidoBase,
      },
    };

    // ============================
    // 1) KPIs generales
    // ============================
    const [
      totalPedidos,
      totalVentasAgg,
      pedidosPorEstado,
      pedidosParaSeries,
      topProductosGrouped,
      pagosGrouped,
      topMeserosGrouped,
    ] = await Promise.all([
      // Total de pedidos en el período
      prisma.pedido.count({
        where: wherePedidoBase,
      }),

      // Suma total de ventas
      prisma.pedido.aggregate({
        where: wherePedidoBase,
        _sum: {
          total: true,
        },
      }),

      // Cantidad de pedidos por estado
      prisma.pedido.groupBy({
        where: wherePedidoBase,
        by: ['estado'],
        _count: {
          _all: true,
        },
      }),

      // Pedidos para armar series por día (gráfica de barras)
      prisma.pedido.findMany({
        where: wherePedidoBase,
        select: {
          fechaHora: true,
          total: true,
        },
        orderBy: {
          fechaHora: 'asc',
        },
      }),

      // Top productos vendidos
      prisma.pedidoDetalle.groupBy({
        by: ['productoId'],
        where: {
          pedido: wherePedidoBase,
        },
        _sum: {
          cantidad: true,
          subtotal: true,
        },
        orderBy: {
          _sum: {
            cantidad: 'desc',
          },
        },
        take: 5,
      }),

      // Ventas por método de pago
      prisma.pago.groupBy({
        by: ['metodoPagoId'],
        where: wherePagoBase,
        _sum: {
          monto: true,
        },
      }),

      // Top meseros / usuarios con más ventas
      prisma.pedido.groupBy({
        by: ['usuarioId'],
        where: wherePedidoBase,
        _sum: {
          total: true,
        },
        _count: {
          _all: true,
        },
        orderBy: {
          _sum: {
            total: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    const totalVentas = Number(totalVentasAgg._sum.total ?? 0);

    // KPIs por estado
    let pedidosAbiertos = 0;
    let pedidosCerrados = 0;
    let pedidosCancelados = 0;

    pedidosPorEstado.forEach((grupo) => {
      if (grupo.estado === 'ABIERTA') pedidosAbiertos = grupo._count._all;
      if (grupo.estado === 'CERRADA') pedidosCerrados = grupo._count._all;
      if (grupo.estado === 'CANCELADA') pedidosCancelados = grupo._count._all;
    });

    const ticketPromedio =
      totalPedidos > 0 ? totalVentas / totalPedidos : 0;

    // ============================
    // 2) Serie por día (ventas diarias)
    // ============================
    const mapaVentasPorDia = new Map<
      string,
      { totalVentas: number; totalPedidos: number }
    >();

    for (const p of pedidosParaSeries) {
      const fecha = p.fechaHora.toISOString().slice(0, 10); // YYYY-MM-DD
      const existente = mapaVentasPorDia.get(fecha) || {
        totalVentas: 0,
        totalPedidos: 0,
      };
      existente.totalVentas += Number(p.total);
      existente.totalPedidos += 1;
      mapaVentasPorDia.set(fecha, existente);
    }

    const ventasPorDia = Array.from(mapaVentasPorDia.entries())
      .map(([fecha, datos]) => ({
        fecha,
        totalVentas: datos.totalVentas,
        totalPedidos: datos.totalPedidos,
      }))
      .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

    // ============================
    // 3) Top productos más vendidos
    // ============================
    const productoIds = topProductosGrouped.map((x) => x.productoId);

    const productosInfo = await prisma.producto.findMany({
      where: {
        productoId: {
          in: productoIds,
        },
      },
      select: {
        productoId: true,
        nombre: true,
      },
    });

    const productosMap = new Map<number, string>();
    productosInfo.forEach((p) => productosMap.set(p.productoId, p.nombre));

    const topProductos = topProductosGrouped.map((row) => ({
      productoId: row.productoId,
      nombre: productosMap.get(row.productoId) || 'Producto',
      cantidadVendida: Number(row._sum.cantidad ?? 0),
      montoTotal: Number(row._sum.subtotal ?? 0),
    }));

    // ============================
    // 4) Ventas por método de pago
    // ============================
    const metodoPagoIds = pagosGrouped.map((p) => p.metodoPagoId);

    const metodosPagoInfo = await prisma.metodoPago.findMany({
      where: {
        metodoPagoId: {
          in: metodoPagoIds,
        },
      },
      select: {
        metodoPagoId: true,
        nombre: true,
      },
    });

    const metodosMap = new Map<number, string>();
    metodosPagoInfo.forEach((m) => metodosMap.set(m.metodoPagoId, m.nombre));

    const ventasPorMetodoPago = pagosGrouped.map((row) => ({
      metodoPagoId: row.metodoPagoId,
      nombre: metodosMap.get(row.metodoPagoId) || 'Método',
      total: Number(row._sum.monto ?? 0),
    }));

    // ============================
    // 5) Top meseros / usuarios
    // ============================
    const usuarioIds = topMeserosGrouped.map((x) => x.usuarioId);

    const usuariosInfo = await prisma.usuario.findMany({
      where: {
        usuarioId: {
          in: usuarioIds,
        },
      },
      select: {
        usuarioId: true,
        nombre: true,
      },
    });

    const usuariosMap = new Map<number, string>();
    usuariosInfo.forEach((u) => usuariosMap.set(u.usuarioId, u.nombre));

    const topMeseros = topMeserosGrouped.map((row) => ({
      usuarioId: row.usuarioId,
      nombre: usuariosMap.get(row.usuarioId) || 'Usuario',
      totalVentas: Number(row._sum.total ?? 0),
      totalPedidos: row._count._all,
    }));

    // ============================
    // RESPUESTA FINAL
    // ============================
    const data = {
      periodo: {
        desde: desde.toISOString(),
        hasta: hasta.toISOString(),
      },
      filtros: {
        esAdmin,
        usuarioId,
      },
      kpis: {
        totalPedidos,
        totalVentas,
        ticketPromedio,
        pedidosAbiertos,
        pedidosCerrados,
        pedidosCancelados,
      },
      ventasPorDia,
      ventasPorMetodoPago,
      topProductos,
      topMeseros,
    };

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('Error en /api/dashboard:', error);
    return NextResponse.json(
      {
        mensaje: 'Error al obtener datos de dashboard',
        detalle: error?.message || 'Error inesperado',
      },
      { status: 500 }
    );
  }
}
