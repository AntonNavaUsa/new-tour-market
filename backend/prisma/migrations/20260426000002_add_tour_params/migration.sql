-- Add tour parameters
ALTER TABLE "cards" ADD COLUMN "distance_km" DOUBLE PRECISION;
ALTER TABLE "cards" ADD COLUMN "elevation_gain" INTEGER;
ALTER TABLE "cards" ADD COLUMN "child_friendly" BOOLEAN;
ALTER TABLE "cards" ADD COLUMN "meeting_point" TEXT;
