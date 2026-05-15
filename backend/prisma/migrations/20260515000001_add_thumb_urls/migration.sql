-- AlterTable
ALTER TABLE "cards" ADD COLUMN "head_photo_thumb_url" TEXT;

-- AlterTable
ALTER TABLE "slideshow_photos" ADD COLUMN "thumb_url" TEXT;

-- AlterTable
ALTER TABLE "expressions" ADD COLUMN "thumb_url" TEXT;

-- AlterTable
ALTER TABLE "accommodation_photos" ADD COLUMN "thumb_url" TEXT;
