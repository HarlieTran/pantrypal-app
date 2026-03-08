# Pantry Module

## Responsibility
Manages a user's pantry inventory. Handles CRUD operations on pantry items,
tracks expiry status, syncs item counts to Postgres for dashboard display,
and supports adding items via receipt/photo scanning using Bedrock vision.

## Public API
- `getPantryItems(userId)` — returns all items for a user, sorted by expiry
  status
- `getPantryMeta(userId)` — returns item count and expiring count from Postgres
- `addPantryItem(userId, data)` — adds a single item, runs ingredient matching
- `addPantryItemsBulk(userId, items)` — batch wrapper around `addPantryItem`
- `updatePantryItem(userId, itemId, updates)` — partial update of quantity,
  unit, expiry date, or notes
- `deletePantryItem(userId, itemId)` — removes an item
- `getPantryImageUploadUrl(userId, filename, contentType)` — returns a
  presigned S3 PUT URL for uploading a receipt or pantry photo
- `parseImageForIngredients(imageKey)` — fetches an image from S3, sends it to
  Bedrock vision, and returns a list of parsed ingredients
- `handlePantryRoute(method, path, authHeader, rawBody)` — module router

## Routes
| Method | Path                      | Auth     | Description                          |
|--------|---------------------------|----------|--------------------------------------|
| GET    | `/pantry`                 | Required | Returns items and meta               |
| POST   | `/pantry/items`           | Required | Adds a single item                   |
| POST   | `/pantry/items/bulk`      | Required | Adds multiple items                  |
| PATCH  | `/pantry/items/:itemId`   | Required | Updates an item                      |
| DELETE | `/pantry/items/:itemId`   | Required | Deletes an item                      |
| POST   | `/pantry/upload-url`      | Required | Returns presigned S3 upload URL      |
| POST   | `/pantry/parse-image`     | Required | Parses uploaded image for ingredients |

## Expiry Status
Every item returned from `getPantryItems` includes a computed `expiryStatus`:

| Status          | Condition                        |
|-----------------|----------------------------------|
| `fresh`         | More than 3 days until expiry    |
| `expiring_soon` | 0–3 days until expiry            |
| `expired`       | Past expiry date                 |
| `no_date`       | No expiry date provided          |

Items are sorted by expiry status in the order above, then by date ascending
within each group.

## Ingredient Matching
Every item added via `addPantryItem` is passed through the ingredients module's
three-tier matching pipeline (exact → alias → AI) to resolve a canonical name
and category before being stored.

## Pantry Meta Sync
After every write operation (add, update, delete), `syncPantryMeta` updates
the `pantry_meta` Postgres row for the user with the current item count and
expiring count. This allows the dashboard to display counts without querying
DynamoDB on every page load. Sync failures are logged as warnings and do not
fail the main operation.

## Image Scanning Flow
1. Frontend requests a presigned URL via `POST /pantry/upload-url`
2. Frontend uploads the image directly to S3
3. Frontend calls `POST /pantry/parse-image` with the returned `imageKey`
4. API fetches the image from S3 and sends it to Bedrock vision
5. Bedrock returns a structured list of ingredients
6. Frontend reviews the list and calls `POST /pantry/items/bulk` to confirm

## Environment Variables
| Variable                | Purpose                                         |
|-------------------------|-------------------------------------------------|
| `PANTRY_IMAGES_BUCKET`  | S3 bucket for pantry upload images              |
| `CURATED_RECIPES_BUCKET`| Fallback bucket if `PANTRY_IMAGES_BUCKET` unset |
| `BEDROCK_MODEL_ID`      | Model used for image parsing                    |
| `AWS_REGION`            | AWS region for Bedrock and S3 clients           |

## Dependencies
- `common/db/dynamo` — pantry item storage
- `common/db/prisma` — pantry meta sync
- `common/storage/s3` — image upload and fetch
- `common/ai/bedrock` — `stripCodeFence` utility
- `ingredients` — ingredient matching pipeline
- `users` — profile ID lookup for meta sync