/*
  Warnings:

  - The values [1,2,3] on the enum `Shift` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Shift_new" AS ENUM ('ONE', 'TWO', 'THREE');
ALTER TABLE "users" ALTER COLUMN "shift" TYPE "Shift_new" USING ("shift"::text::"Shift_new");
ALTER TYPE "Shift" RENAME TO "Shift_old";
ALTER TYPE "Shift_new" RENAME TO "Shift";
DROP TYPE "public"."Shift_old";
COMMIT;
