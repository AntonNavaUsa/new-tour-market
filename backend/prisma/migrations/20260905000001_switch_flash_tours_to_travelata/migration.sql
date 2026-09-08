ALTER TABLE "flash_tour_sources" RENAME COLUMN "resort_hash" TO "source_key";
ALTER TABLE "flash_tour_sources" RENAME COLUMN "base_url" TO "search_url";
DROP INDEX "flash_tour_sources_provider_resort_hash_key";
CREATE UNIQUE INDEX "flash_tour_sources_provider_source_key_key" ON "flash_tour_sources"("provider", "source_key");

UPDATE "flash_tour_sources"
SET "is_active" = false,
    "last_run_status" = 'MIGRATED_TO_TRAVELATA',
    "last_run_error" = 'Источник Onlinetours отключен после перехода на Travelata'
WHERE "provider" = 'onlinetours';