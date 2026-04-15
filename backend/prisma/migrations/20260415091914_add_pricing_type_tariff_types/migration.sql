-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('PER_GROUP', 'PER_PERSON');

-- AlterTable
ALTER TABLE "prices" ADD COLUMN     "min_price" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "pricing_type" "PricingType" NOT NULL DEFAULT 'PER_PERSON',
ADD COLUMN     "tariff_type_id" TEXT;

-- CreateTable
CREATE TABLE "tariff_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "age_from" INTEGER,
    "age_to" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tariff_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tariff_types_name_key" ON "tariff_types"("name");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tariff_type_id_fkey" FOREIGN KEY ("tariff_type_id") REFERENCES "tariff_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
