# App Module

## Responsibility
Top-level orchestration for auth flow, global view routing, and cross-module composition.

## Internal Structure
- `application/` app-level orchestration hooks (`useIdentity`, `useHomeAndPantryPreview`)
- `App.tsx` composition/orchestration layer

## Dependencies
- Module public APIs only (`auth`, `onboarding`, `home`, `pantry`)
