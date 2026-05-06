-- AlterTable
ALTER TABLE "cards" ADD COLUMN "accommodation_description" TEXT;

-- CreateTable
CREATE TABLE "accommodation_photos" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accommodation_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accommodation_photos_card_id_sort_order_idx" ON "accommodation_photos"("card_id", "sort_order");

-- AddForeignKey
ALTER TABLE "accommodation_photos" ADD CONSTRAINT "accommodation_photos_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
