-- AlterTable: add booking_steps column to cards
ALTER TABLE "cards" ADD COLUMN "booking_steps" JSONB;

-- CreateTable: booking steps templates
CREATE TABLE "booking_steps_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_steps_templates_pkey" PRIMARY KEY ("id")
);
