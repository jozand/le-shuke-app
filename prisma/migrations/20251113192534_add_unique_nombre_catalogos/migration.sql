/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `Categoria` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre]` on the table `MetodoPago` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre]` on the table `Rol` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Categoria_nombre_key` ON `Categoria`(`nombre`);

-- CreateIndex
CREATE UNIQUE INDEX `MetodoPago_nombre_key` ON `MetodoPago`(`nombre`);

-- CreateIndex
CREATE UNIQUE INDEX `Rol_nombre_key` ON `Rol`(`nombre`);
