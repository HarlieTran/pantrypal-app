# API Module

## Responsibility
Central request dispatcher. Receives all incoming HTTP requests from both the
local dev server (`main.ts`) and the Lambda handler (`lambda.ts`), normalizes
the path, and delegates to the appropriate module router.

## Public API
- `dispatchApiRoute(method, path, authHeader, rawBody)` — main entry point for
  all requests

## Routing
Requests are matched by path prefix and forwarded to module routers:

| Prefix                  | Module       |
|-------------------------|--------------|
| `/me`, `/me/*`          | users        |
| `/onboarding/*`         | onboarding   |
| `/pantry/*`             | pantry       |
| `/recipes/*`            | recipes      |
| `/community/*`          | community    |
| `/home`                 | home         |
| `/internal/home/*`      | home         |

## Error Handling
Any unhandled exception that escapes a module router is caught here and
returned as a 500 with a generic message. Module routers are responsible for
their own domain-specific error handling.

## Dependencies
- `common/routing/helpers` — path normalization
- All module routers