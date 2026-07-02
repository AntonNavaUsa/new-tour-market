-- Add consent audit fields to payments
ALTER TABLE "payments"
ADD COLUMN "consent_accepted_at" TIMESTAMP(3),
ADD COLUMN "consent_ip_address" TEXT,
ADD COLUMN "consent_offer_version" TEXT,
ADD COLUMN "consent_user_email" TEXT;
