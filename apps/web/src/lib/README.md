# Shared Infrastructure (Phase 1)

## Overview
Shared utilities, API client, and hooks to eliminate duplication across modules.

## Structure

```
lib/
├── api/
│   ├── client.ts       # HTTP client with auth
│   ├── types.ts        # ApiError, ApiResponse types
│   ├── helpers.ts      # buildUrl, getApiBaseUrl
│   └── index.ts
├── hooks/
│   ├── useApi.ts       # Generic data fetching hook
│   ├── useMutation.ts  # Generic mutation hook
│   └── index.ts
└── utils/
    ├── validation.ts   # Email, password, URL validation
    ├── format.ts       # Date, number formatting
    └── index.ts
```

## Usage Examples

### API Client

```typescript
import { apiGet, apiPost } from '@/lib/api';

// GET request
const data = await apiGet<MyType>('/endpoint', token);

// POST request
const result = await apiPost<MyType>('/endpoint', { body }, token);
```

### useApi Hook

```typescript
import { useApi } from '@/lib/hooks';

const { data, loading, error, execute } = useApi(
  () => apiGet('/endpoint', token),
  { immediate: true }
);
```

### useMutation Hook

```typescript
import { useMutation } from '@/lib/hooks';

const { mutate, loading, error } = useMutation(
  (variables) => apiPost('/endpoint', variables, token)
);

await mutate({ name: 'value' });
```

### Utilities

```typescript
import { formatRelativeTime, isValidEmail } from '@/lib/utils';

const timeAgo = formatRelativeTime(post.createdAt);
const valid = isValidEmail(email);
```

## Migration Strategy

1. **Keep existing code working** - All current module APIs remain unchanged
2. **Gradual adoption** - New features use shared lib, old code migrates over time
3. **No breaking changes** - Modules can opt-in when ready

## Next Steps (Phase 2)

- Refactor community module to use shared client (template for others)
- Add error boundary components
- Standardize loading/error states across modules
