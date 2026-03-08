# Home Module

## Responsibility
Generates and serves the daily special — a culturally significant dish picked
by Bedrock each day. Handles caching, image sourcing, S3 storage, and
automatically bootstraps the community topic and system post for the day.

## Public API
- `getOrCreateDailySpecial(locale?)` — main entry point; returns today's daily
  special for the given locale, generating it if it doesn't exist yet
- `handleHomeRoute(method, path, authHeader)` — module router

## Routes
| Method | Path                        | Auth     | Description                        |
|--------|-----------------------------|----------|------------------------------------|
| GET    | `/home`                     | None     | Returns today's special + nav links |
| POST   | `/internal/home/prewarm`    | Internal | Triggers generation ahead of time  |

The prewarm route is protected by `INTERNAL_WORKER_KEY` — it is intended for
use by a scheduled Lambda, not by the frontend.

## Daily Special Lifecycle
1. Check Postgres for today's record — return it if found
2. If missing image, attempt to repair by fetching from Unsplash and uploading
   to S3
3. If no record exists, call Bedrock to generate dish data
4. Fetch image from Unsplash (or use `DEFAULT_DISH_IMAGE_URL` as fallback)
5. Upload image to S3 and save record to Postgres
6. Auto-create today's pinned community topic
7. Auto-create the PantryPal system post for the topic
8. Return the record with a signed S3 image URL

## Environment Variables
| Variable                  | Purpose                                      |
|---------------------------|----------------------------------------------|
| `BEDROCK_MODEL_ID`        | Bedrock model used for dish generation       |
| `BEDROCK_REGION`          | AWS region for Bedrock                       |
| `S3_BUCKET_DAILY_SPECIALS`| S3 bucket for dish images                    |
| `UNSPLASH_ACCESS_KEY`     | Unsplash API key for image fetching          |
| `DEFAULT_DISH_IMAGE_URL`  | Fallback image if Unsplash is unavailable    |
| `INTERNAL_WORKER_KEY`     | Secret key for the prewarm route             |

## Dependencies
- `common/db/prisma` — daily special persistence
- `common/storage/s3` — image upload and signed URL generation
- `community` — topic and system post creation