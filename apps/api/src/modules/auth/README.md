# Auth Module

JWT verification and authentication middleware.

## Features

- Cognito JWT token verification
- Auth middleware wrapper
- Claims extraction

## Middleware

- `auth.middleware.ts` - requireAuth function
- `with-auth.ts` - Higher-order function for protected routes

## Usage

```typescript
return withAuth(authHeader, async (claims) => {
  // claims.sub, claims.email available
  return ok({ data });
});
```
