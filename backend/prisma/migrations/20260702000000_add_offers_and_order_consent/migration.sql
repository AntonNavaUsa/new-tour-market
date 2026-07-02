-- Offers table
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "revision_date" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- Join table: offers <-> card types
CREATE TABLE "offer_card_types" (
    "offer_id" TEXT NOT NULL,
    "card_type_id" TEXT NOT NULL,

    CONSTRAINT "offer_card_types_pkey" PRIMARY KEY ("offer_id", "card_type_id")
);

CREATE INDEX "offers_is_active_idx" ON "offers"("is_active");
CREATE INDEX "offer_card_types_card_type_id_idx" ON "offer_card_types"("card_type_id");

ALTER TABLE "offer_card_types"
ADD CONSTRAINT "offer_card_types_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "offer_card_types"
ADD CONSTRAINT "offer_card_types_card_type_id_fkey" FOREIGN KEY ("card_type_id") REFERENCES "card_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Order consent fields
ALTER TABLE "orders"
ADD COLUMN "offer_id" TEXT,
ADD COLUMN "offer_revision_date" TEXT,
ADD COLUMN "offer_accepted_at" TIMESTAMP(3),
ADD COLUMN "offer_accepted_ip" TEXT;

CREATE INDEX "orders_offer_id_idx" ON "orders"("offer_id");

ALTER TABLE "orders"
ADD CONSTRAINT "orders_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
