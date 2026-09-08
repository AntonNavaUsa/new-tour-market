ALTER TABLE "accommodations"
  ADD COLUMN "is_available_in_ota" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "is_archived" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "accommodations_is_available_in_ota_is_archived_idx"
  ON "accommodations"("is_available_in_ota", "is_archived");