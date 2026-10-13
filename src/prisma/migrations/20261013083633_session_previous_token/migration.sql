/*
  Warnings:

  - A unique constraint covering the columns `[previousRefreshTokenHash]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "previousRefreshTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Session_previousRefreshTokenHash_key" ON "Session"("previousRefreshTokenHash");
