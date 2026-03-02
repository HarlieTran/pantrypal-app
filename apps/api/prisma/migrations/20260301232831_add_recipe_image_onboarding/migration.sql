-- CreateTable
CREATE TABLE "curated_recipe_images" (
    "id" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cuisine" TEXT,
    "dietTags" JSONB NOT NULL,
    "proteinTags" JSONB NOT NULL,
    "spiceLevel" TEXT,
    "extraTags" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curated_recipe_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_recipe_selections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "isSelected" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_recipe_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preference_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "likes" JSONB NOT NULL,
    "dislikes" JSONB NOT NULL,
    "dietSignals" JSONB NOT NULL,
    "confidence" JSONB NOT NULL,
    "rawModelOutput" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preference_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "curated_recipe_images_s3Key_key" ON "curated_recipe_images"("s3Key");

-- CreateIndex
CREATE INDEX "user_recipe_selections_userId_idx" ON "user_recipe_selections"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_recipe_selection_unique" ON "user_recipe_selections"("userId", "imageId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preference_profiles_userId_key" ON "user_preference_profiles"("userId");

-- AddForeignKey
ALTER TABLE "user_recipe_selections" ADD CONSTRAINT "user_recipe_selections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_recipe_selections" ADD CONSTRAINT "user_recipe_selections_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "curated_recipe_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preference_profiles" ADD CONSTRAINT "user_preference_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
