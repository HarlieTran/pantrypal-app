# Onboarding Module

## Responsibility
Guides new users through the onboarding flow: answering dietary preference
questions, selecting and rejecting curated recipe images, and generating an
AI-inferred preference profile that personalizes the community feed and recipe
suggestions.

## Public API
- `getOnboardingQuestions()` — returns all active questions with their options
- `saveUserAnswers(sub, answers)` — persists a user's question answers
- `markOnboardingComplete(sub)` — sets `onboardingCompleted: true` on the profile
- `getRandomRecipeImages(count?)` — returns a shuffled selection of curated
  recipe images with signed S3 URLs
- `submitRecipeSelections(sub, payload)` — saves selected/rejected image IDs,
  calls Bedrock to infer preferences, upserts the preference profile, and marks
  onboarding complete
- `handleOnboardingRoute(method, path, authHeader, rawBody)` — module router

## Routes
| Method | Path                               | Auth     | Description                          |
|--------|------------------------------------|----------|--------------------------------------|
| GET    | `/onboarding/questions`            | None     | Returns all active onboarding questions |
| PUT    | `/me/answers`                      | Required | Saves user's question answers        |
| POST   | `/me/onboarding/complete`          | Required | Marks onboarding as complete         |
| GET    | `/onboarding/recipe-images`        | None     | Returns random curated recipe images |
| POST   | `/me/onboarding/recipe-selections` | Required | Submits image selections and infers preferences |

## Onboarding Flow
1. Frontend fetches questions via `GET /onboarding/questions`
2. User answers are saved via `PUT /me/answers`
3. Frontend fetches recipe images via `GET /onboarding/recipe-images?count=6`
4. User selects and rejects images
5. `POST /me/onboarding/recipe-selections` saves selections, calls Bedrock to
   infer a preference profile, and marks onboarding complete in one transaction
6. The inferred profile is used by `getPersonalizedFeed` and recipe suggestions

## Preference Inference
Bedrock receives the metadata of selected and rejected images (cuisine, diet
tags, protein tags, spice level) and returns a structured profile:
```ts
{
  likes: string[];
  dislikes: string[];
  dietSignals: string[];
  confidence: { likes: number; dislikes: number; overall: number };
}
```

This profile is stored in `user_preference_profiles` and read by the community
and recipes modules at request time.

## Environment Variables
| Variable                   | Purpose                                        |
|----------------------------|------------------------------------------------|
| `DEFAULT_RECIPE_IMAGE_URL` | Fallback image URL if S3 signing fails         |

## Dependencies
- `common/db/prisma` — questions, answers, recipe images, preference profiles
- `common/storage/s3` — signed URLs for recipe images
- `common/ai/bedrock` — preference inference from image selections
- `users` — user lookup by Cognito subject