CREATE TABLE "flash_tour_sources" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "resort_hash" TEXT NOT NULL,
    "resort_name" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_attempted_at" TIMESTAMP(3),
    "last_successful_at" TIMESTAMP(3),
    "last_run_status" TEXT,
    "last_run_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_tour_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flash_tour_scrape_runs" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "requested_source_ids" JSONB NOT NULL,
    "successful_source_count" INTEGER NOT NULL DEFAULT 0,
    "failed_source_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_source_count" INTEGER NOT NULL DEFAULT 0,
    "created_offer_count" INTEGER NOT NULL DEFAULT 0,
    "updated_offer_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_by_user_id" TEXT NOT NULL,

    CONSTRAINT "flash_tour_scrape_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flash_tour_scrape_results" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "requested_url" TEXT NOT NULL,
    "http_status" INTEGER,
    "status" TEXT NOT NULL,
    "raw_html" TEXT,
    "cleaned_text" TEXT,
    "raw_llm_response" TEXT,
    "offers_extracted" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "flash_tour_scrape_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flash_tour_offers" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "scrape_result_id" TEXT,
    "hotel_name" TEXT NOT NULL,
    "resort" TEXT,
    "country" TEXT,
    "price" DECIMAL(12,2),
    "currency" TEXT,
    "checkin_date" DATE,
    "nights" INTEGER,
    "meal_type" TEXT,
    "category" TEXT,
    "tour_url" TEXT,
    "dedupe_key" TEXT NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "premium_status" TEXT NOT NULL DEFAULT 'PENDING',
    "publication_status" TEXT NOT NULL DEFAULT 'IMPORTED',
    "rejection_reason" TEXT,
    "last_seen_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_tour_offers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "flash_tour_sources_provider_resort_hash_key" ON "flash_tour_sources"("provider", "resort_hash");
CREATE INDEX "flash_tour_sources_is_active_idx" ON "flash_tour_sources"("is_active");
CREATE INDEX "flash_tour_scrape_runs_started_at_idx" ON "flash_tour_scrape_runs"("started_at");
CREATE INDEX "flash_tour_scrape_runs_status_idx" ON "flash_tour_scrape_runs"("status");
CREATE INDEX "flash_tour_scrape_results_run_id_idx" ON "flash_tour_scrape_results"("run_id");
CREATE INDEX "flash_tour_scrape_results_source_id_started_at_idx" ON "flash_tour_scrape_results"("source_id", "started_at");
CREATE UNIQUE INDEX "flash_tour_offers_dedupe_key_key" ON "flash_tour_offers"("dedupe_key");
CREATE INDEX "flash_tour_offers_source_id_last_seen_at_idx" ON "flash_tour_offers"("source_id", "last_seen_at");
CREATE INDEX "flash_tour_offers_premium_status_publication_status_idx" ON "flash_tour_offers"("premium_status", "publication_status");
CREATE INDEX "flash_tour_offers_checkin_date_idx" ON "flash_tour_offers"("checkin_date");

ALTER TABLE "flash_tour_scrape_results" ADD CONSTRAINT "flash_tour_scrape_results_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "flash_tour_scrape_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flash_tour_scrape_results" ADD CONSTRAINT "flash_tour_scrape_results_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "flash_tour_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "flash_tour_offers" ADD CONSTRAINT "flash_tour_offers_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "flash_tour_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "flash_tour_offers" ADD CONSTRAINT "flash_tour_offers_scrape_result_id_fkey" FOREIGN KEY ("scrape_result_id") REFERENCES "flash_tour_scrape_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;