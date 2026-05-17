ALTER TABLE "ProjectRetrospective" RENAME COLUMN "wentWell" TO "start";
ALTER TABLE "ProjectRetrospective" RENAME COLUMN "toImprove" TO "stop";
ALTER TABLE "ProjectRetrospective" RENAME COLUMN "actionItems" TO "continue";
ALTER TABLE "ProjectRetrospective" DROP COLUMN "notes";
