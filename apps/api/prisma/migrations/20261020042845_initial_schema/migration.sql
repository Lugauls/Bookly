-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "Professional" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "businessName" VARCHAR(120),
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "bio" TEXT,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'America/Manaus',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "priceCents" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "email" VARCHAR(254),
    "notes" TEXT,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeOff" (
    "id" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "reason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TimeOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "cancelledAt" TIMESTAMPTZ(3),
    "cancelReason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Professional_email_key" ON "Professional"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_slug_key" ON "Professional"("slug");

-- CreateIndex
CREATE INDEX "Service_professionalId_active_idx" ON "Service"("professionalId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Service_professionalId_id_key" ON "Service"("professionalId", "id");

-- CreateIndex
CREATE INDEX "Client_professionalId_archivedAt_name_idx" ON "Client"("professionalId", "archivedAt", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Client_professionalId_id_key" ON "Client"("professionalId", "id");

-- CreateIndex
CREATE INDEX "AvailabilityRule_professionalId_weekday_idx" ON "AvailabilityRule"("professionalId", "weekday");

-- CreateIndex
CREATE INDEX "TimeOff_professionalId_startsAt_endsAt_idx" ON "TimeOff"("professionalId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Appointment_professionalId_status_startsAt_idx" ON "Appointment"("professionalId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");

-- CreateIndex
CREATE INDEX "Appointment_serviceId_idx" ON "Appointment"("serviceId");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOff" ADD CONSTRAINT "TimeOff_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_professionalId_clientId_fkey" FOREIGN KEY ("professionalId", "clientId") REFERENCES "Client"("professionalId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_professionalId_serviceId_fkey" FOREIGN KEY ("professionalId", "serviceId") REFERENCES "Service"("professionalId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PostgreSQL extension used by the exclusion constraints below.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Domain checks that Prisma's schema language cannot currently express.
ALTER TABLE "Professional"
ADD CONSTRAINT "Professional_name_check" CHECK (char_length(btrim("name")) > 0),
ADD CONSTRAINT "Professional_email_lowercase_check" CHECK ("email" = lower("email")),
ADD CONSTRAINT "Professional_phone_check" CHECK ("phone" ~ '^[1-9][0-9]{7,14}$'),
ADD CONSTRAINT "Professional_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
ADD CONSTRAINT "Professional_timezone_check" CHECK (char_length(btrim("timezone")) > 0);

ALTER TABLE "Service"
ADD CONSTRAINT "Service_name_check" CHECK (char_length(btrim("name")) > 0),
ADD CONSTRAINT "Service_durationMinutes_check" CHECK ("durationMinutes" BETWEEN 1 AND 1440),
ADD CONSTRAINT "Service_priceCents_check" CHECK ("priceCents" IS NULL OR "priceCents" >= 0);

ALTER TABLE "Client"
ADD CONSTRAINT "Client_name_check" CHECK (char_length(btrim("name")) > 0),
ADD CONSTRAINT "Client_phone_check" CHECK ("phone" ~ '^[1-9][0-9]{7,14}$'),
ADD CONSTRAINT "Client_email_lowercase_check" CHECK ("email" IS NULL OR "email" = lower("email"));

ALTER TABLE "AvailabilityRule"
ADD CONSTRAINT "AvailabilityRule_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
ADD CONSTRAINT "AvailabilityRule_time_order_check" CHECK ("startTime" < "endTime");

ALTER TABLE "TimeOff"
ADD CONSTRAINT "TimeOff_time_order_check" CHECK ("startsAt" < "endsAt");

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_time_order_check" CHECK ("startsAt" < "endsAt"),
ADD CONSTRAINT "Appointment_cancelled_fields_check" CHECK (
    ("status" = 'CANCELLED' AND "cancelledAt" IS NOT NULL)
    OR
    ("status" <> 'CANCELLED' AND "cancelledAt" IS NULL AND "cancelReason" IS NULL)
);

-- Two recurring availability windows for the same professional and weekday
-- may touch at their boundaries, but they may never overlap.
ALTER TABLE "AvailabilityRule"
ADD CONSTRAINT "AvailabilityRule_no_overlap"
EXCLUDE USING gist (
    "professionalId" WITH =,
    "weekday" WITH =,
    int8range(
        EXTRACT(EPOCH FROM "startTime")::bigint,
        EXTRACT(EPOCH FROM "endTime")::bigint,
        '[)'
    ) WITH &&
);

-- The database is the final guard against concurrent double booking.
-- CANCELLED and COMPLETED rows preserve history without blocking new slots.
ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_no_scheduled_overlap"
EXCLUDE USING gist (
    "professionalId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
)
WHERE ("status" = 'SCHEDULED');
