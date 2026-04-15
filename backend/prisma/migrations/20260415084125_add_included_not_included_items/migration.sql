-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "included_items" JSONB,
ADD COLUMN     "not_included_items" JSONB;
