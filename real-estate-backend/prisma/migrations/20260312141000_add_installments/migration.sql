-- CreateTable
CREATE TABLE `Installment` (
    `id` VARCHAR(191) NOT NULL,
    `saleId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `number` INTEGER NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `status` ENUM('DUE', 'PAID', 'WAIVED') NOT NULL DEFAULT 'DUE',
    `paidAt` DATETIME(3) NULL,
    `paidAmount` DECIMAL(12, 2) NULL,
    `method` ENUM('CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'CARD', 'OTHER') NULL,
    `reference` VARCHAR(191) NULL,
    `receivedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Installment_saleId_number_key`(`saleId`, `number`),
    INDEX `Installment_companyId_dueDate_idx`(`companyId`, `dueDate`),
    INDEX `Installment_companyId_status_dueDate_idx`(`companyId`, `status`, `dueDate`),
    INDEX `Installment_saleId_status_idx`(`saleId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Installment` ADD CONSTRAINT `Installment_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Installment` ADD CONSTRAINT `Installment_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Installment` ADD CONSTRAINT `Installment_receivedById_fkey` FOREIGN KEY (`receivedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

