/*
  Warnings:

  - You are about to alter the column `estado` on the `Pedido` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `Pedido` MODIFY `estado` ENUM('ABIERTA', 'CERRADA', 'CANCELADA') NOT NULL DEFAULT 'ABIERTA';
