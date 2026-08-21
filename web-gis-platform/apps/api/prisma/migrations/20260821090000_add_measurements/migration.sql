CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "positions" JSONB NOT NULL,
    "value" TEXT,
    "label" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Measurement_projectId_createdAt_idx" ON "Measurement"("projectId", "createdAt");
CREATE INDEX "Measurement_createdById_idx" ON "Measurement"("createdById");

ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
