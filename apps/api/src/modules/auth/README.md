# Auth Module

## Responsibility
Verifies Cognito ID tokens and provides auth middleware used by all protected
routes across the API.

## Public API
- `requireAuth(req)` — extracts and verifies the Bearer token from the
  Authorization header, returns typed `AuthClaims` on success, throws on
  failure
- `withAuth(authHeader, handler)` — higher-order helper used by route handlers;
  calls `requireAuth` and passes verified claims to the handler, returns 401
  automatically if verification fails
- `AuthClaims` — type exported for use across modules; includes `sub`, `email`,
  `given_name`, `family_name`, `token_use`

## Token Verification
- Expects a Cognito **ID token** (not access token)
- Verifies signature against the Cognito JWKS endpoint
- Validates `issuer` and `audience` (app client ID)
- Rejects tokens where `token_use` is not `"id"`

## Usage Pattern
Every protected route handler wraps its logic in `withAuth`:
```ts
if (method === "POST" && path === "/some/route") {
  return withAuth(authHeader, async (claims) => {
    // claims.sub is the verified Cognito user ID
  });
}
```

## Environment Variables
| Variable                | Purpose                        |
|-------------------------|--------------------------------|
| `COGNITO_REGION`        | AWS region of the user pool    |
| `COGNITO_USER_POOL_ID`  | User pool ID                   |
| `COGNITO_APP_CLIENT_ID` | App client ID for audience check |

## Dependencies
- `jose` — JWT verification and JWKS fetching
- `common/auth/jwt` — core token verification logic