-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "card_id" TEXT,
    "author_name" TEXT NOT NULL,
    "author_photo" TEXT,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_card_id_idx" ON "reviews"("card_id");

-- CreateIndex
CREATE INDEX "reviews_is_visible_idx" ON "reviews"("is_visible");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
