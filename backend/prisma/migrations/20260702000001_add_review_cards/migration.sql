-- Join table for reviews attached to multiple tour cards
CREATE TABLE "review_cards" (
    "review_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,

    CONSTRAINT "review_cards_pkey" PRIMARY KEY ("review_id", "card_id")
);

CREATE INDEX "review_cards_card_id_idx" ON "review_cards"("card_id");

ALTER TABLE "review_cards"
ADD CONSTRAINT "review_cards_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_cards"
ADD CONSTRAINT "review_cards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
