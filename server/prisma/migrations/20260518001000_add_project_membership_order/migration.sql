-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- Seed existing implicit project memberships. Existing non-owner add times were not stored,
-- so owners are anchored to project creation and other existing members are placed after.
INSERT INTO "ProjectMember" ("id", "projectId", "userId", "createdAt")
SELECT
    CONCAT('pm_', md5(CONCAT(pm."A", ':', pm."B"))),
    pm."A",
    pm."B",
    CASE
        WHEN p."ownerId" = pm."B" THEN p."createdAt"
        ELSE CURRENT_TIMESTAMP
    END
FROM "_ProjectMembers" pm
JOIN "Project" p ON p."id" = pm."A"
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
