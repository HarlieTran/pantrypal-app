-- CreateTable
CREATE TABLE "pantry_meta" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "expiringCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pantry_meta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pantry_meta_userId_key" ON "pantry_meta"("userId");

-- AddForeignKey
ALTER TABLE "pantry_meta" ADD CONSTRAINT "pantry_meta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
