-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `price` INTEGER NOT NULL DEFAULT 0,
    `order` INTEGER NOT NULL DEFAULT 0,
    `categoryId` VARCHAR(128) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `IDX_24dbc6126a28ff948da33e97d3`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deleted_orders` (
    `id` VARCHAR(36) NOT NULL,
    `orderNumber` VARCHAR(128) NOT NULL,
    `type` VARCHAR(128) NOT NULL,
    `status` VARCHAR(128) NOT NULL,
    `reason` VARCHAR(512) NOT NULL,
    `total` INTEGER NOT NULL DEFAULT 0,
    `discount` INTEGER NOT NULL DEFAULT 0,
    `commission` INTEGER NOT NULL DEFAULT 0,
    `net` INTEGER NOT NULL DEFAULT 0,
    `items` JSON NOT NULL,
    `waiter` VARCHAR(128) NULL,
    `payment` VARCHAR(128) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `IDX_2011f80e5e7e6c0cc802da2500`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discounts` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,
    `items` JSON NULL,
    `categories` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `autoApply` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `IDX_66c522004212dc814d6e2f14ec`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `price` INTEGER NOT NULL DEFAULT 0,
    `order` INTEGER NOT NULL DEFAULT 0,
    `categories` JSON NULL,
    `tags` JSON NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `IDX_ba5885359424c15ca6b9e79bcf`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `migrations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `timestamp` BIGINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_details` (
    `orderId` VARCHAR(36) NOT NULL,
    `itemId` VARCHAR(36) NOT NULL,
    `categoryId` VARCHAR(36) NOT NULL,
    `category` VARCHAR(128) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `price` INTEGER NOT NULL DEFAULT 0,
    `originalPrice` INTEGER NOT NULL DEFAULT 0,
    `totalAmount` INTEGER NOT NULL DEFAULT 0,

    INDEX `IDX_3d2bea6797aab2d1248a4827e7`(`orderId`, `itemId`, `categoryId`),
    PRIMARY KEY (`orderId`, `itemId`, `categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(36) NOT NULL,
    `orderNumber` VARCHAR(128) NOT NULL,
    `type` VARCHAR(128) NOT NULL,
    `status` VARCHAR(128) NOT NULL,
    `waiter` VARCHAR(128) NULL,
    `customer` VARCHAR(128) NULL,
    `payment` VARCHAR(128) NULL,
    `total` INTEGER NOT NULL DEFAULT 0,
    `discountValue` INTEGER NOT NULL DEFAULT 0,
    `commission` INTEGER NOT NULL DEFAULT 0,
    `tip` INTEGER NOT NULL DEFAULT 0,
    `net` INTEGER NOT NULL DEFAULT 0,
    `shiftId` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `discounts` JSON NULL,

    INDEX `IDX_75531bd58d48f8818039c5b4ce`(`id`, `shiftId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shifts` (
    `id` VARCHAR(36) NOT NULL,
    `openAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `closeAt` DATETIME(0) NULL,
    `openingStaff` VARCHAR(128) NOT NULL,
    `closingStaff` VARCHAR(128) NULL,
    `openingBalance` INTEGER NOT NULL,
    `closingBalance` INTEGER NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `IDX_84d692e367e4d6cdf045828768`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `phone` VARCHAR(128) NOT NULL,
    `commission` INTEGER NOT NULL DEFAULT 0,
    `isServing` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `IDX_e4ee98bb552756c180aec1e854`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `order_details` ADD CONSTRAINT `fk_order_details_order` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
