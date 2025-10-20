-- AlterTable: Add n8nExecutionId field to workflow_executions
ALTER TABLE "workflow_executions" ADD COLUMN "n8nExecutionId" TEXT;

-- CreateIndex: Add unique index on n8nExecutionId
CREATE UNIQUE INDEX "workflow_executions_n8nExecutionId_key" ON "workflow_executions"("n8nExecutionId");
