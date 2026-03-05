-- CreateIndex
CREATE INDEX `Booking_status_idx` ON `Booking`(`status`);

-- CreateIndex
CREATE INDEX `Booking_bookingDate_idx` ON `Booking`(`bookingDate`);

-- CreateIndex
CREATE INDEX `Booking_agentId_status_idx` ON `Booking`(`agentId`, `status`);

-- CreateIndex
CREATE INDEX `Plot_status_idx` ON `Plot`(`status`);

-- CreateIndex
CREATE INDEX `Plot_isActive_idx` ON `Plot`(`isActive`);

-- CreateIndex
CREATE INDEX `Plot_status_isActive_idx` ON `Plot`(`status`, `isActive`);

-- CreateIndex
CREATE INDEX `Project_status_idx` ON `Project`(`status`);

-- CreateIndex
CREATE INDEX `Project_isActive_idx` ON `Project`(`isActive`);

-- CreateIndex
CREATE INDEX `Project_status_isActive_idx` ON `Project`(`status`, `isActive`);

-- CreateIndex
CREATE INDEX `RefreshToken_isActive_idx` ON `RefreshToken`(`isActive`);

-- CreateIndex
CREATE INDEX `RefreshToken_expiresAt_idx` ON `RefreshToken`(`expiresAt`);

-- CreateIndex
CREATE INDEX `Sale_createdAt_idx` ON `Sale`(`createdAt`);

-- CreateIndex
CREATE INDEX `Sale_companyId_createdAt_idx` ON `Sale`(`companyId`, `createdAt`);

-- CreateIndex
CREATE INDEX `Sale_agentId_createdAt_idx` ON `Sale`(`agentId`, `createdAt`);

-- CreateIndex
CREATE INDEX `User_role_idx` ON `User`(`role`);

-- CreateIndex
CREATE INDEX `User_isActive_idx` ON `User`(`isActive`);

-- CreateIndex
CREATE INDEX `User_role_isActive_idx` ON `User`(`role`, `isActive`);
