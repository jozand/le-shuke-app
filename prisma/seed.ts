// prisma/seed.ts
import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed personalizado...');

  // Fecha fija según tus INSERTs
  const fecha = new Date('2025-11-14T23:24:56.925Z');

  /* ================================
     1. ROLES
  ================================== */
  await prisma.rol.upsert({
    where: { rolId: 1 },
    update: {},
    create: {
      rolId: 1,
      nombre: 'Administrador',
      descripcion: 'Acceso total al sistema',
      estado: true,
      fechaSistema: fecha,
    },
  });

  await prisma.rol.upsert({
    where: { rolId: 2 },
    update: {},
    create: {
      rolId: 2,
      nombre: 'Mesero',
      descripcion: 'Acceso parcial',
      estado: true,
      fechaSistema: fecha,
    },
  });

  /* ================================
     2. USUARIO ADMINISTRADOR
  ================================== */
  await prisma.usuario.upsert({
    where: { usuarioId: 1 },
    update: {},
    create: {
      usuarioId: 1,
      nombre: 'Administrador General',
      email: 'admin@leshuke.com',
      password:
        '$2b$10$4tJxjw1OUD5VtnPKJHkE/OPjy5d..UW7sgNFQroRaSiVzjtU.hdu2',
      rolId: 1,
      activo: true,
      fechaSistema: new Date('2025-11-14T23:24:56.949Z'),
    },
  });

  /* ================================
     3. MÉTODOS DE PAGO
  ================================== */

  const fechaMP = new Date('2025-11-14T23:24:56.991Z');

  await prisma.metodoPago.upsert({
    where: { metodoPagoId: 1 },
    update: {},
    create: {
      metodoPagoId: 1,
      nombre: 'Tarjeta',
      descripcion: null,
      activo: true,
      fechaSistema: fechaMP,
    },
  });

  await prisma.metodoPago.upsert({
    where: { metodoPagoId: 2 },
    update: {},
    create: {
      metodoPagoId: 2,
      nombre: 'Efectivo',
      descripcion: null,
      activo: true,
      fechaSistema: fechaMP,
    },
  });

  await prisma.metodoPago.upsert({
    where: { metodoPagoId: 3 },
    update: {},
    create: {
      metodoPagoId: 3,
      nombre: 'Transferencia',
      descripcion: null,
      activo: true,
      fechaSistema: fechaMP,
    },
  });

  console.log('✅ Seed ejecutado con éxito.');
}

main()
  .catch((err) => {
    console.error('❌ Error ejecutando seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
