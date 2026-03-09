# Recipes Module

Recipe suggestions and cooking simulation with pantry integration.

## Features

- Personalized recipe suggestions based on pantry
- Recipe details from Spoonacular API
- Cook recipe (deduct ingredients from pantry)
- Dry-run mode for preview

## Routes

- `POST /recipes/suggestions` - Get recipe suggestions
- `GET /recipes/:id` - Get recipe details
- `POST /recipes/:id/cook` - Cook recipe (update pantry)

## Services

- `recipes.service.ts` - Suggestion generation
- `recipe-cook.service.ts` - Cooking logic, pantry deduction
- `spoonacular.service.ts` - External API integration
