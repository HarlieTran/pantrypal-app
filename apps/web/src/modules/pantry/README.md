# Pantry Module

## Responsibility
Manage pantry items, manual add/remove, and image-driven bulk ingestion.

## Public API
- `PantryPage`
- `fetchPantry`
- `addPantryItem`
- `addPantryItemsBulk`
- `updatePantryItem`
- `deletePantryItem`
- `getPantryUploadUrl`
- `parseImageForIngredients`
- `PantryItem`
- `PantryMeta`
- `ParsedIngredient`

## Dependencies
- Backend HTTP API via `infra/pantry.api.ts`
