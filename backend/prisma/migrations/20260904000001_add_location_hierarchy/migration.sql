ALTER TABLE "locations"
  ADD COLUMN "parent_id" TEXT;

CREATE INDEX "locations_parent_id_idx" ON "locations"("parent_id");

ALTER TABLE "locations"
  ADD CONSTRAINT "locations_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "locations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;