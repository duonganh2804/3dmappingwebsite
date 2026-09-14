CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
CREATE TYPE "IssueSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TABLE "Issue" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT,
  "status" "IssueStatus" NOT NULL DEFAULT 'OPEN', "severity" "IssueSeverity" NOT NULL DEFAULT 'MEDIUM',
  "longitude" DOUBLE PRECISION NOT NULL, "latitude" DOUBLE PRECISION NOT NULL, "height" DOUBLE PRECISION NOT NULL,
  "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Issue_projectId_createdAt_idx" ON "Issue"("projectId", "createdAt");
CREATE INDEX "Issue_createdById_idx" ON "Issue"("createdById");
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
