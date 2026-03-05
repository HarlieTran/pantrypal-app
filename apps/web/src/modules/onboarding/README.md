# Onboarding Module

## Responsibility
Collect user onboarding inputs and recipe preference picks.

## Public API
- `OnboardingQuestionnaire`
- `RecipePreferencePicker`
- `getMe`
- `getOnboardingQuestions`
- `saveAnswers`
- `completeOnboarding`
- `getRecipeImages`
- `submitRecipeSelections`

## Dependencies
- `@pantrypal/shared-types`
- Backend HTTP API via `infra/onboarding.api.ts`
