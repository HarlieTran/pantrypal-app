# Recipes Module

## Responsibility
Suggests recipes based on a user's current pantry contents, retrieves recipe
details, and applies a cooked recipe to the pantry by deducting used
ingredients. Recipe data is sourced from the Spoonacular API with multi-key
failover for rate limit handling.

## Public API
- `getRecipeSuggestionsForUser(userId, limit?)` — returns scored recipe
  suggestions based on pantry contents, prioritising recipes that use
  expiring ingredients
- `getRecipeDetails(recipeId)` — returns full recipe details including
  ingredients and step-by-step instructions
- `cookRecipeForUser(userId, recipeId, options?)` — deducts used ingredients
  from the pantry after cooking a recipe
- `handleRecipesRoute(method, path, authHeader, rawBody)` — module router

## Routes
| Method | Path                    | Auth     | Description                            |
|--------|-------------------------|----------|----------------------------------------|
| POST   | `/recipes/suggestions`  | Required | Returns ranked recipe suggestions      |
| GET    | `/recipes/:id`          | Required | Returns full recipe details            |
| POST   | `/recipes/:id/cook`     | Required | Applies recipe to pantry               |

## Recipe Suggestion Scoring
Suggestions are fetched from Spoonacular by matching pantry ingredient names,
then scored locally:
```
score = (expiringSoonUsedCount × 5)
      + (usedIngredientCount × 2)
      - (missedIngredientCount × 1.5)
```

Recipes that use expiring or expired ingredients are ranked highest to
encourage waste reduction.

## Cook Recipe Flow
`cookRecipeForUser` matches each recipe ingredient against the user's pantry
using a token-based name similarity score, then deducts the required quantity
from matched pantry items:

1. Fetch pantry items and recipe details in parallel
2. For each recipe ingredient, find the best-matching pantry item (score ≥ 30)
3. Convert units where possible (mass↔mass, volume↔volume)
4. Deduct quantities, tracking partial coverage as warnings
5. Delete fully depleted items, update partially used items
6. Return a summary of updated items, removed items, unmatched ingredients,
   and warnings

Supports a `dryRun` mode that calculates deductions without writing to the
pantry, useful for previewing the impact before confirming.

## Spoonacular Key Failover
Multiple API keys can be provided as a comma-separated list in
`SPOONACULAR_API_KEYS`. If a request returns 402 or 429, the next key is
tried automatically. This allows rotating across keys to stay within free
tier limits.

## Environment Variables
| Variable               | Purpose                                          |
|------------------------|--------------------------------------------------|
| `SPOONACULAR_API_KEYS` | Comma-separated list of Spoonacular API keys     |
| `SPOONACULAR_API_KEY`  | Single key fallback if `SPOONACULAR_API_KEYS` unset |

## Dependencies
- `pantry` — pantry item reads and writes for suggestions and cook flow
- Spoonacular REST API — recipe search and details