-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('MALL_VENDOR', 'STANDALONE', 'TAKEAWAY');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY');

-- AlterTable: vendors — make mallId optional, add qrToken and vendorType
ALTER TABLE "vendors" ALTER COLUMN "mallId" DROP NOT NULL;
ALTER TABLE "vendors" ADD COLUMN "qrToken" TEXT;
ALTER TABLE "vendors" ADD COLUMN "vendorType" "VendorType" NOT NULL DEFAULT 'MALL_VENDOR';

-- AlterTable: tables — make mallId optional, add vendorId FK
ALTER TABLE "tables" ALTER COLUMN "mallId" DROP NOT NULL;
ALTER TABLE "tables" ADD COLUMN "vendorId" TEXT;

-- AlterTable: orders — make tableId optional, add orderType
ALTER TABLE "orders" ALTER COLUMN "tableId" DROP NOT NULL;
ALTER TABLE "orders" ADD COLUMN "orderType" "OrderType" NOT NULL DEFAULT 'DINE_IN';

-- CreateIndex: unique vendor qrToken (partial — only non-NULL values)
CREATE UNIQUE INDEX "vendors_qrToken_key" ON "vendors"("qrToken");

-- CreateIndex: unique (tableNumber, vendorId) for standalone tables
CREATE UNIQUE INDEX "tables_tableNumber_vendorId_key" ON "tables"("tableNumber", "vendorId");

-- AddForeignKey: tables.vendorId -> vendors.id
ALTER TABLE "tables" ADD CONSTRAINT "tables_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
