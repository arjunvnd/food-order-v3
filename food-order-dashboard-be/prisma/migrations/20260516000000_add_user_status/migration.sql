-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE');

-- AlterTable: add column with default ACTIVE so all existing users remain accessible
ALTER TABLE "users" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "users" ADD COLUMN "requestNote" TEXT;

-- Switch default to PENDING for new self-signup rows going forward
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'PENDING';
