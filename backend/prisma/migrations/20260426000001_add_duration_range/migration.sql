-- Add duration range fields (hours)
ALTER TABLE "cards" ADD COLUMN "duration_from" INTEGER;
ALTER TABLE "cards" ADD COLUMN "duration_to" INTEGER;

-- Remove old duration field (minutes)
ALTER TABLE "cards" DROP COLUMN IF EXISTS "duration";
