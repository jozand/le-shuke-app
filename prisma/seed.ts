// prisma/seed.ts
import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Roles
  const adminRol = await prisma.rol.upsert({
    where: { nombre: 'Administrador' },
    update: {},
    create: {
      nombre: 'Administrador',
      descripcion: 'Acceso total al sistema',
    },
  });

  const meseroRol = await prisma.rol.upsert({
    where: { nombre: 'Mesero' },
    update: {},
    create: {
      nombre: 'Mesero',
      descripcion: 'Toma pedidos y atiende mesas',
    },
  });

  const cajeroRol = await prisma.rol.upsert({
    where: { nombre: 'Cajero' },
    update: {},
    create: {
      nombre: 'Cajero',
      descripcion: 'Procesa pagos y facturación',
    },
  });

  // 2. Usuario Administrador
  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@restaurante.com' },
    update: {},
    create: {
      nombre: 'Administrador General',
      email: 'admin@restaurante.com',
      password: '123456', // ⚠️ cámbialo luego por hash
      rolId: adminRol.rolId,
    },
  });

  // 3. Categorías
  const categorias = await Promise.all([
    prisma.categoria.upsert({
      where: { nombre: 'Entradas' },
      update: {},
      create: { nombre: 'Entradas' },
    }),
    prisma.categoria.upsert({
      where: { nombre: 'Platos Fuertes' },
      update: {},
      create: { nombre: 'Platos Fuertes' },
    }),
    prisma.categoria.upsert({
      where: { nombre: 'Bebidas' },
      update: {},
      create: { nombre: 'Bebidas' },
    }),
  ]);

  // 4. Productos de ejemplo
  const productos = await Promise.all([
    prisma.producto.create({
      data: {
        nombre: 'Hamburguesa Especial',
        descripcion: 'Carne 1/4 lb, queso, bacon y papas.',
        precio: 55.00,
        categoriaId: categorias[1].categoriaId,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: 'Ensalada César',
        descripcion: 'Clásica con pollo.',
        precio: 35.00,
        categoriaId: categorias[0].categoriaId,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: 'Limonada',
        descripcion: 'Fresca y natural.',
        precio: 10.00,
        categoriaId: categorias[2].categoriaId,
      },
    }),
  ]);

  // 5. Mesas de ejemplo
  await Promise.all([
    prisma.mesa.create({ data: { numero: 1, nombre: 'Mesa 1' } }),
    prisma.mesa.create({ data: { numero: 2, nombre: 'Mesa 2' } }),
    prisma.mesa.create({ data: { numero: 3, nombre: 'Mesa 3' } }),
  ]);

  // 6. Métodos de pago
  await Promise.all([
    prisma.metodoPago.upsert({
      where: { nombre: 'Efectivo' },
      update: {},
      create: { nombre: 'Efectivo' },
    }),
    prisma.metodoPago.upsert({
      where: { nombre: 'Tarjeta' },
      update: {},
      create: { nombre: 'Tarjeta' },
    }),
    prisma.metodoPago.upsert({
      where: { nombre: 'Transferencia' },
      update: {},
      create: { nombre: 'Transferencia' },
    }),
  ]);

  console.log('🌱 Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
