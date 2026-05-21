-- CreateEnum
CREATE TYPE "AccommodationType" AS ENUM ('HOTEL', 'HOSTEL', 'GUESTHOUSE', 'APARTMENT', 'CAMPING', 'OTHER');

-- DropForeignKey (old accommodation_photos -> cards)
ALTER TABLE "accommodation_photos" DROP CONSTRAINT IF EXISTS "accommodation_photos_card_id_fkey";

-- Add accommodation_id column to accommodation_photos
ALTER TABLE "accommodation_photos" ADD COLUMN "accommodation_id" TEXT;

-- CreateTable: accommodations
CREATE TABLE "accommodations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "type" "AccommodationType" NOT NULL DEFAULT 'OTHER',
    "created_by_user_id" TEXT,
    "partner_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accommodations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: card_accommodations (M2M)
CREATE TABLE "card_accommodations" (
    "card_id" TEXT NOT NULL,
    "accommodation_id" TEXT NOT NULL,

    CONSTRAINT "card_accommodations_pkey" PRIMARY KEY ("card_id","accommodation_id")
);

-- CreateTable: accommodation_blocks
CREATE TABLE "accommodation_blocks" (
    "id" TEXT NOT NULL,
    "accommodation_id" TEXT NOT NULL,
    "date_from" DATE NOT NULL,
    "date_to" DATE NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accommodation_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: card_guides (M2M)
CREATE TABLE "card_guides" (
    "card_id" TEXT NOT NULL,
    "guide_id" TEXT NOT NULL,

    CONSTRAINT "card_guides_pkey" PRIMARY KEY ("card_id","guide_id")
);

-- CreateTable: guide_blocks
CREATE TABLE "guide_blocks" (
    "id" TEXT NOT NULL,
    "guide_id" TEXT NOT NULL,
    "date_from" DATE NOT NULL,
    "date_to" DATE NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guide_blocks_pkey" PRIMARY KEY ("id")
);

-- Add accommodationId to reviews
ALTER TABLE "reviews" ADD COLUMN "accommodation_id" TEXT;

-- Drop old accommodation fields from cards
ALTER TABLE "cards" DROP COLUMN IF EXISTS "accommodation_description";
ALTER TABLE "cards" DROP COLUMN IF EXISTS "accommodation_reviews";
-- Drop old card_id from accommodation_photos (after migration)
ALTER TABLE "accommodation_photos" DROP COLUMN IF EXISTS "card_id";

-- Set accommodation_id NOT NULL after populating (here we just make it required by constraint)
ALTER TABLE "accommodation_photos" ALTER COLUMN "accommodation_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "accommodations_id_idx" ON "accommodations"("id");
CREATE INDEX "accommodation_blocks_accommodation_id_idx" ON "accommodation_blocks"("accommodation_id");
CREATE INDEX "accommodation_blocks_date_from_date_to_idx" ON "accommodation_blocks"("date_from", "date_to");
CREATE INDEX "accommodation_photos_accommodation_id_sort_order_idx" ON "accommodation_photos"("accommodation_id", "sort_order");
CREATE INDEX "card_accommodations_accommodation_id_idx" ON "card_accommodations"("accommodation_id");
CREATE INDEX "guide_blocks_guide_id_idx" ON "guide_blocks"("guide_id");
CREATE INDEX "guide_blocks_date_from_date_to_idx" ON "guide_blocks"("date_from", "date_to");
CREATE INDEX "reviews_accommodation_id_idx" ON "reviews"("accommodation_id");

-- AddForeignKey: accommodation_photos -> accommodations
ALTER TABLE "accommodation_photos" ADD CONSTRAINT "accommodation_photos_accommodation_id_fkey"
    FOREIGN KEY ("accommodation_id") REFERENCES "accommodations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: card_accommodations -> cards
ALTER TABLE "card_accommodations" ADD CONSTRAINT "card_accommodations_card_id_fkey"
    FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: card_accommodations -> accommodations
ALTER TABLE "card_accommodations" ADD CONSTRAINT "card_accommodations_accommodation_id_fkey"
    FOREIGN KEY ("accommodation_id") REFERENCES "accommodations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: accommodation_blocks -> accommodations
ALTER TABLE "accommodation_blocks" ADD CONSTRAINT "accommodation_blocks_accommodation_id_fkey"
    FOREIGN KEY ("accommodation_id") REFERENCES "accommodations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: card_guides -> cards
ALTER TABLE "card_guides" ADD CONSTRAINT "card_guides_card_id_fkey"
    FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: card_guides -> guides
ALTER TABLE "card_guides" ADD CONSTRAINT "card_guides_guide_id_fkey"
    FOREIGN KEY ("guide_id") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: guide_blocks -> guides
ALTER TABLE "guide_blocks" ADD CONSTRAINT "guide_blocks_guide_id_fkey"
    FOREIGN KEY ("guide_id") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: reviews -> accommodations
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_accommodation_id_fkey"
    FOREIGN KEY ("accommodation_id") REFERENCES "accommodations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
