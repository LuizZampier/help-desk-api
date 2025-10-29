/*
  Warnings:

  - You are about to drop the column `updated_at` on the `available_hours` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[technical_id,hour]` on the table `available_hours` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "available_hours" DROP COLUMN "updated_at";

-- CreateIndex
CREATE UNIQUE INDEX "available_hours_technical_id_hour_key" ON "available_hours"("technical_id", "hour");
