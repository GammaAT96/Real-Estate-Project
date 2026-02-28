/*
  Warnings:

  - You are about to drop the column `clientName` on the `sale` table. All the data in the column will be lost.
  - You are about to drop the column `saleDate` on the `sale` table. All the data in the column will be lost.
  - Added the required column `companyId` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saleAmount` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `sale` DROP COLUMN `clientName`,
    DROP COLUMN `saleDate`,
    ADD COLUMN `companyId` VARCHAR(191) NOT NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `saleAmount` DECIMAL(12, 2) NOT NULL;

-- AddForeignKey
ALTER TABLE `Sale` ADD CONSTRAINT `Sale_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
