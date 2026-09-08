ALTER TABLE "accommodations"
  ADD COLUMN "stars" INTEGER,
  ADD COLUMN "ski_in_ski_out" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "accommodation_locations" (
  "accommodation_id" TEXT NOT NULL,
  "location_id" TEXT NOT NULL,
  CONSTRAINT "accommodation_locations_pkey" PRIMARY KEY ("accommodation_id", "location_id"),
  CONSTRAINT "accommodation_locations_accommodation_id_fkey"
    FOREIGN KEY ("accommodation_id") REFERENCES "accommodations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "accommodation_locations_location_id_fkey"
    FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "accommodation_locations_location_id_idx"
  ON "accommodation_locations"("location_id");
