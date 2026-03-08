# Users Module

## Responsibility
Manages user profiles, authentication bootstrapping, dietary preferences, and
onboarding answers. Acts as the source of truth for user identity within the
API — all other modules that need a display name, profile ID, or feed
preferences call into this module.

## Public API
- `upsertUserProfileFromClaims(claims)` — creates or updates a user profile
  from verified Cognito JWT claims; called on every login via the bootstrap
  endpoint
- `getUserBySubject(sub)` — returns the full Prisma user record by Cognito sub
- `getUserProfileIdBySubject(sub)` — returns just the Postgres profile UUID;
  used by other modules that need a stable internal ID
- `getUserDisplayNameBySubject(sub)` — returns the user's display name for
  use in community posts and comments
- `getUserFeedPreferencesBySubject(sub)` — returns the user's inferred
  preference profile and allergy answers for feed personalization
- `getUserProfile(sub)` — returns the full profile shape including answers
  and preference profile; used by the profile page
- `updateUserProfile(sub, payload)` — updates display name, diet type,
  allergies, disliked ingredients, diet notes, and preference profile in a
  single Postgres transaction
- `handleUsersRoute(method, path, authHeader, rawBody)` — module router

## Routes
| Method | Path           | Auth     | Description                              |
|--------|----------------|----------|------------------------------------------|
| POST   | `/me/bootstrap`| Required | Upserts profile from JWT claims          |
| GET    | `/me`          | Required | Returns the raw user record              |
| GET    | `/me/profile`  | Required | Returns full profile with answers        |
| PATCH  | `/me/profile`  | Required | Updates profile fields and answers       |

## Bootstrap Flow
`POST /me/bootstrap` is called by the frontend immediately after login. It
upserts the user profile using claims from the Cognito ID token — creating the
record on first login and updating email and name fields on subsequent logins.
This ensures the profile always reflects the latest Cognito data.

## Profile Update
`updateUserProfile` handles multiple concern types in one transaction:
- Display name update on `user_profiles`
- Diet type answers on `user_answers` (delete + recreate)
- Allergy answers on `user_answers` (delete + recreate)
- Disliked ingredients free text on `user_answers`
- Diet notes free text on `user_answers`
- Preference profile likes, dislikes, and diet signals on
  `user_preference_profiles`

Question lookup uses key-based matching with a label substring fallback via
`pickQuestion`, so answer updates are resilient to question reordering.

## Cross-Module Usage
This module is imported by several others for specific lookups:

| Caller       | Function used                      | Purpose                        |
|--------------|------------------------------------|--------------------------------|
| `pantry`     | `getUserProfileIdBySubject`        | Pantry meta sync               |
| `community`  | `getUserDisplayNameBySubject`      | Post and comment author name   |
| `community`  | `getUserFeedPreferencesBySubject`  | Feed personalization           |
| `onboarding` | `getUserBySubject`                 | Answer and selection saving    |

## Environment Variables
None. Auth configuration is handled by the `auth` module.

## Dependencies
- `common/db/prisma` — all user data persistence
- `auth` — JWT verification via `withAuth`