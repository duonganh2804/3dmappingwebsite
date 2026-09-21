CREATE TABLE "FlowLine" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT,
    "startLon" DOUBLE PRECISION NOT NULL,
    "startLat" DOUBLE PRECISION NOT NULL,
    "startHeight" DOUBLE PRECISION,
    "endLon" DOUBLE PRECISION NOT NULL,
    "endLat" DOUBLE PRECISION NOT NULL,
    "endHeight" DOUBLE PRECISION,

    CONSTRAINT "FlowLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FlowLine_projectId_idx" ON "FlowLine"("projectId");

ALTER TABLE "FlowLine" ADD CONSTRAINT "FlowLine_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
