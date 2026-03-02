-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "authProvider" TEXT NOT NULL DEFAULT 'cognito',
    "authSubject" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_auth_provider_auth_subject_key" ON "user_profiles"("authProvider", "authSubject");
