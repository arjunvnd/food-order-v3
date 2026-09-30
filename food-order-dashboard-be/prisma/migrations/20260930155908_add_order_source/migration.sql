-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('CUSTOMER', 'VENDOR');

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_tableId_fkey";

-- DropForeignKey
ALTER TABLE "tables" DROP CONSTRAINT "tables_mallId_fkey";

-- DropForeignKey
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_mallId_fkey";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "source" "OrderSource" NOT NULL DEFAULT 'CUSTOMER';

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_mallId_fkey" FOREIGN KEY ("mallId") REFERENCES "malls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_mallId_fkey" FOREIGN KEY ("mallId") REFERENCES "malls"("id") ON DELETE SET NULL ON UPDATE CASCADE;
