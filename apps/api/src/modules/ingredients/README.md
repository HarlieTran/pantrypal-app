# Ingredients Module

Ingredient normalization and matching with AI fallback.

## Features

- Exact match against canonical names
- Alias matching with auto-learning
- AI-powered ingredient normalization
- Category classification

## Services

- `ingredient.service.ts` - Multi-stage matching (exact → alias → AI)

## Matching Strategy

1. Exact match on `canonicalName`
2. Alias match (case-insensitive)
3. AI fallback (Bedrock) for unknown ingredients
4. Auto-save new aliases for learning
