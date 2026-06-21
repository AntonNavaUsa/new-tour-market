-- Add advance booking fields to cards
ALTER TABLE "cards" ADD COLUMN "advance_booking_value" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "cards" ADD COLUMN "advance_booking_unit" TEXT NOT NULL DEFAULT 'hours';
