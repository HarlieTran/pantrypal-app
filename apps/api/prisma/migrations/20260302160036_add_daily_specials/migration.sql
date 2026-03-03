-- CreateTable
CREATE TABLE "daily_specials" (
    "id" UUID NOT NULL,
    "special_date" DATE NOT NULL,
    "locale" VARCHAR(32) NOT NULL DEFAULT 'global',
    "dish_name" VARCHAR(255) NOT NULL,
    "cuisine" VARCHAR(100),
    "origin" VARCHAR(100),
    "description" TEXT,
    "history" TEXT,
    "cultural_meaning" TEXT,
    "inspired_by" TEXT,
    "fun_fact" TEXT,
    "ingredients" JSONB,
    "instructions" JSONB,
    "image_url" TEXT,
    "source_model" VARCHAR(120),
    "raw_payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "daily_specials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_specials_special_date_locale_key" ON "daily_specials"("special_date", "locale");
