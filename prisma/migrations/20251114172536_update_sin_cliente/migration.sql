/*
  Warnings:

  - You are about to drop the column `clienteId` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reserva` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `mesaId` on table `Pedido` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Pedido` DROP FOREIGN KEY `Pedido_clienteId_fkey`;

-- DropForeignKey
ALTER TABLE `Pedido` DROP FOREIGN KEY `Pedido_mesaId_fkey`;

-- DropForeignKey
ALTER TABLE `Reserva` DROP FOREIGN KEY `Reserva_clienteId_fkey`;

-- DropForeignKey
ALTER TABLE `Reserva` DROP FOREIGN KEY `Reserva_mesaId_fkey`;

-- DropIndex
DROP INDEX `Pedido_clienteId_fkey` ON `Pedido`;

-- DropIndex
DROP INDEX `Pedido_mesaId_fkey` ON `Pedido`;

-- AlterTable
ALTER TABLE `Pedido` DROP COLUMN `clienteId`,
    MODIFY `mesaId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `Cliente`;

-- DropTable
DROP TABLE `Reserva`;

-- AddForeignKey
ALTER TABLE `Pedido` ADD CONSTRAINT `Pedido_mesaId_fkey` FOREIGN KEY (`mesaId`) REFERENCES `Mesa`(`mesaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
