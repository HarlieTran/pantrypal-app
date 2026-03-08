# Ingredients Module

## Responsibility
Resolves raw ingredient name strings into canonical, categorized ingredient
records. Used by the pantry module whenever a new item is added. Implements
a three-tier matching strategy with a self-improving alias learning loop.

## Public API
- `matchIngredient(raw)` — resolves a single `ParsedIngredient` to a
  `MatchedIngredient` with a canonical name, category, and match confidence
- `matchIngredients(raws)` — convenience batch wrapper around `matchIngredient`

## Matching Strategy
Each ingredient name is resolved in order through three tiers:

| Tier | Method      | Description                                              |
|------|-------------|----------------------------------------------------------|
| 1    | Exact match | Case-insensitive match against `canonicalName` in Postgres |
| 2    | Alias match | JS-side scan of the `aliases` JSON array for each ingredient |
| 3    | AI fallback | Bedrock prompt returns a canonical name and category     |

If all three tiers fail, the raw name is stored as-is with
`matchConfidence: "unmatched"`.

## Alias Learning
When a match is found via alias or AI, the raw input string is written back
to the `aliases` array of the matched ingredient in Postgres. This means
future lookups for the same raw string will hit tier 1 or tier 2 instead of
calling Bedrock again, reducing latency and cost over time.

## Match Confidence Values
| Value       | Meaning                                      |
|-------------|----------------------------------------------|
| `exact`     | Matched directly against `canonicalName`     |
| `alias`     | Matched via the `aliases` array              |
| `ai`        | Matched or created via Bedrock               |
| `unmatched` | No match found, raw name stored as-is        |

## Environment Variables
| Variable          | Purpose                              |
|-------------------|--------------------------------------|
| `BEDROCK_MODEL_ID`| Model used for AI fallback matching  |
| `AWS_REGION`      | AWS region for Bedrock client        |

## Dependencies
- `common/db/prisma` — ingredient reads and alias writes
- `common/ai/bedrock` — `stripCodeFence` utility
- `@pantrypal/shared-types` — `INGREDIENT_CATEGORIES` and `IngredientCategory`

## Notes
The alias match tier fetches all active ingredients from Postgres and filters
in JavaScript. This is acceptable at the current seed size (~60 ingredients)
but will need a Postgres trigram index or full-text search as the ingredient
table grows.