CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "domUrl" TEXT,
    "metadataUrl" TEXT,
    "modelUrl" TEXT,
    "pointCloudId" TEXT,
    "calibration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Survey_projectId_capturedAt_idx" ON "Survey"("projectId", "capturedAt");

ALTER TABLE "Survey" ADD CONSTRAINT "Survey_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
