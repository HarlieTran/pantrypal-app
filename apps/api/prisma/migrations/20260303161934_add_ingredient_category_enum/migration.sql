/*
  Warnings:

  - The `category` column on the `ingredients` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "IngredientCategory" AS ENUM ('produce', 'dairy', 'meat', 'seafood', 'grains', 'spices', 'condiments', 'frozen', 'beverages', 'snacks', 'other');

-- AlterTable
ALTER TABLE "ingredients" DROP COLUMN "category",
ADD COLUMN     "category" "IngredientCategory";
