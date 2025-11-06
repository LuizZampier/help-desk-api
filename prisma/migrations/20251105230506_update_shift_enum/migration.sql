/*
  Warnings:

  - The `shift` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('1', '2', '3');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "shift",
ADD COLUMN     "shift" "Shift";
