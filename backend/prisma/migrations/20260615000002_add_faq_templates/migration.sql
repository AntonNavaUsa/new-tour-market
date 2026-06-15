-- CreateTable
CREATE TABLE "faq_templates" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faq_templates_sort_order_idx" ON "faq_templates"("sort_order");
