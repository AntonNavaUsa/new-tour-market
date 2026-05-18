-- AlterTable: add hero_type and hero_perks to cards
ALTER TABLE "cards" ADD COLUMN "hero_type" VARCHAR(20) NOT NULL DEFAULT 'cover';
ALTER TABLE "cards" ADD COLUMN "hero_perks" JSONB;

-- Migrate existing noCover data: if no_cover = true → hero_type = 'no_cover'
UPDATE "cards" SET "hero_type" = 'no_cover' WHERE "no_cover" = true;
