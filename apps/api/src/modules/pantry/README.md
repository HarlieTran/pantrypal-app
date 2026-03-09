# Pantry Module

Manages user pantry items with AI-powered image parsing.

## Features

- Add/update/delete pantry items
- Bulk item addition
- Image upload with S3 presigned URLs
- AI-powered ingredient extraction from images
- Expiry tracking and status calculation

## Routes

- `GET /pantry` - Get all items + metadata
- `POST /pantry/items` - Add single item
- `POST /pantry/items/bulk` - Add multiple items
- `PATCH /pantry/items/:id` - Update item
- `DELETE /pantry/items/:id` - Delete item
- `POST /pantry/upload-url` - Get S3 upload URL
- `POST /pantry/parse-image` - Parse ingredients from image

## Services

- `pantry.service.ts` - CRUD, image parsing, expiry logic

## Types

- `pantry.types.ts` - PantryItem, ExpiryStatus, ParsedIngredient
