-- CreateTable
CREATE TABLE "PantryItem" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "rawName" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "ingredientId" TEXT,
    "category" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT '',
    "notes" TEXT,
    "expiryDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PantryItem_userProfileId_idx" ON "PantryItem"("userProfileId");

-- CreateIndex
CREATE INDEX "PantryItem_userProfileId_expiryDate_idx" ON "PantryItem"("userProfileId", "expiryDate");

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
