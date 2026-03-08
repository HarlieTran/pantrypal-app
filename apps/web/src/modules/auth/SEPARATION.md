# Auth Module - Separation of Concerns ✅

## Structure
```
auth/
├── model/
│   └── auth.types.ts          # SignUpInput, AuthError types
├── infra/
│   ├── cognito.api.ts         # Cognito SDK integration
│   └── cognito.pool.ts        # Cognito pool config
├── application/
│   └── useAuth.ts             # Auth business logic hook
└── ui/
    └── pages/
        ├── LoginPage.tsx      # Pure presentation
        └── SignUpPage.tsx     # Pure presentation
```

## Separation Achieved

### ✅ model/
- Types defined without external dependencies
- `SignUpInput`, `AuthError` types

### ✅ infra/
- Cognito SDK integration
- Promise-based API functions
- No React dependencies

### ✅ application/
- `useAuth` hook orchestrates infra layer
- Manages loading/error state
- Provides clean API: `login()`, `register()`, `confirm()`, `resend()`

### ✅ ui/
- Pure presentation components
- Props-driven (no direct API calls)
- No business logic

## Public API
```typescript
import { useAuth, LoginPage, SignUpPage, signOut } from '@/modules/auth';

// In parent component:
const { login, register, confirm, loading, error } = useAuth();
```

## Status: ✅ COMPLIANT
All layers properly separated with clear responsibilities.
