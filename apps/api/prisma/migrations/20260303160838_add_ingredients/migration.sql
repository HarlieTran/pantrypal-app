-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "aliases" JSONB NOT NULL DEFAULT '[]',
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_canonicalName_key" ON "ingredients"("canonicalName");

-- CreateIndex
CREATE INDEX "ingredients_canonicalName_idx" ON "ingredients"("canonicalName");
