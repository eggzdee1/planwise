CREATE TABLE "ProjectRetrospective" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "wentWell" TEXT NOT NULL DEFAULT '',
    "toImprove" TEXT NOT NULL DEFAULT '',
    "actionItems" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectRetrospective_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectRetrospective_projectId_key" ON "ProjectRetrospective"("projectId");

ALTER TABLE "ProjectRetrospective" ADD CONSTRAINT "ProjectRetrospective_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
