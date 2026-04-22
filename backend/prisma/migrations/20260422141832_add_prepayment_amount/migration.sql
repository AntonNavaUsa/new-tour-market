/*
  Warnings:

  - Added the required column `prepayment_amount` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "prepayment_percent" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "orders" ADD COLUMN     "prepayment_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;
-- Backfill: set prepayment_amount = ceil(amount * 0.2 / 100) * 100 for existing rows
UPDATE "orders" SET "prepayment_amount" = CEIL("amount" * 0.2 / 100) * 100;
