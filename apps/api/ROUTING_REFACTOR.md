# API Routing Refactor

## Changes Made

### 1. Query-string Normalization
**Problem**: Exact route matching failed when query strings were present (e.g., `/me?token=xyz` didn't match `/me`).

**Solution**: Added `normalizePathname()` helper in `common/routing/helpers.ts` that extracts pathname using `URL` API. Main dispatcher now normalizes paths before routing.

```typescript
const pathname = normalizePathname(path); // /me?foo=bar → /me
```

### 2. Removed Stub Ingredients Router
**Problem**: `ingredients.router.ts` always returned `null`, adding unnecessary overhead.

**Solution**: Removed `handleIngredientsRoute` from dispatcher. Can be re-added when real endpoints are needed.

### 3. Shared Routing Helpers
**Problem**: Every router duplicated JSON parsing, Zod validation, and error handling patterns.

**Solution**: Created `common/routing/helpers.ts` with:
- `parseBody<T>(rawBody, schema)` - Parse + validate in one call
- `ok()`, `created()`, `badRequest()`, etc. - Response builders
- `handleError()` - Unified error handling with Zod support
- `JsonResponse` type export

**Before**:
```typescript
try {
  const parsed = schema.parse(rawBody ? JSON.parse(rawBody) : {});
  const result = await service(parsed);
  return { statusCode: 200, body: { result } };
} catch (error) {
  if (error instanceof z.ZodError) {
    return { statusCode: 400, body: { error: "Invalid payload", details: error.flatten() } };
  }
  console.error("error:", error);
  return { statusCode: 500, body: { error: "Server error" } };
}
```

**After**:
```typescript
try {
  const parsed = parseBody(rawBody, schema);
  const result = await service(parsed);
  return ok({ result });
} catch (error) {
  return handleError(error, "Server error");
}
```

### 4. Test Infrastructure
**Added**:
- `jest.config.js` - Jest configuration for ESM + TypeScript
- `tests/integration/routes/router.test.ts` - Basic router tests
- Test scripts in `package.json`: `npm test`, `npm run test:watch`

**To run tests**:
```bash
npm install  # Install Jest dependencies
npm test
```

## Files Modified
- `src/modules/api/routes/router.ts` - Pathname normalization, removed ingredients stub
- `src/modules/users/routes/users.router.ts` - Use shared helpers
- `src/modules/onboarding/routes/onboarding.router.ts` - Use shared helpers
- `src/modules/pantry/routes/pantry.router.ts` - Use shared helpers
- `src/modules/recipes/routes/recipes.router.ts` - Use shared helpers
- `src/modules/home/routes/home.router.ts` - Use shared helpers
- `src/modules/community/routes/community.router.ts` - Use shared helpers

## Files Created
- `src/common/routing/helpers.ts` - Shared routing utilities
- `tests/integration/routes/router.test.ts` - Router integration tests
- `jest.config.js` - Test configuration

## Next Steps
1. Add more integration tests for each module router
2. Add unit tests for individual services
3. Consider adding request/response type safety with branded types
4. Add OpenAPI/Swagger documentation generation
