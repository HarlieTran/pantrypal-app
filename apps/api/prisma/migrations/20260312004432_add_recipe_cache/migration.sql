-- CreateTable
CREATE TABLE "recipes" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT,
    "imageSourceUrl" TEXT,
    "cuisine" TEXT[],
    "dietTags" TEXT[],
    "readyMinutes" INTEGER,
    "servings" INTEGER,
    "sourceUrl" TEXT,
    "summary" TEXT,
    "instructions" JSONB,
    "rawData" JSONB NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "rawName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "unit" TEXT,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipeId_idx" ON "recipe_ingredients"("recipeId");

-- CreateIndex
CREATE INDEX "recipe_ingredients_canonicalName_idx" ON "recipe_ingredients"("canonicalName");

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
