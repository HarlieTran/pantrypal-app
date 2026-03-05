# Profile Module

## Responsibility
Owns profile viewing/editing UI and profile-related application flows.

## Structure
- `ui/` page components and visual elements
- `application/` hooks and view-model composition
- `infra/` HTTP client calls to backend profile endpoints
- `model/` domain types and module constants

## Public API
- `ProfilePage`
- `EditProfilePage`

## Notes
- Cross-module dependencies should go through module public APIs.
- Keep network and side-effects in `application`/`infra`, not `ui` pages.
