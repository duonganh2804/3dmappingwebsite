-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "centerLon" DOUBLE PRECISION NOT NULL,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "epsg" INTEGER NOT NULL DEFAULT 32648,
    "domUrl" TEXT,
    "metadataUrl" TEXT,
    "modelUrl" TEXT,
    "pointCloudId" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
