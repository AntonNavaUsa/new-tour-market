-- CreateTable: card_extras
CREATE TABLE "card_extras" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "pricing_type" "PricingType" NOT NULL DEFAULT 'PER_PERSON',
    "is_optional" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "card_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable: order_extras
CREATE TABLE "order_extras" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "extra_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_extras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "card_extras_card_id_idx" ON "card_extras"("card_id");
CREATE INDEX "order_extras_order_id_idx" ON "order_extras"("order_id");

-- AddForeignKey
ALTER TABLE "card_extras" ADD CONSTRAINT "card_extras_card_id_fkey"
    FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_extras" ADD CONSTRAINT "order_extras_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_extras" ADD CONSTRAINT "order_extras_extra_id_fkey"
    FOREIGN KEY ("extra_id") REFERENCES "card_extras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
