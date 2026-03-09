# Frontend Module Structure Standard

All modules follow this structure:

```
modules/[feature]/
├── model/
│   └── [feature].types.ts     # Domain types and interfaces
├── infra/
│   └── [feature].api.ts       # API client (uses shared lib/api)
├── application/
│   └── use[Feature].ts        # Business logic hooks
├── ui/
│   ├── components/            # Feature-specific components
│   └── pages/                 # Feature pages
├── index.ts                   # Public API exports
└── README.md                  # Module documentation
```

## Layer Responsibilities

### model/
- Domain types and interfaces
- Constants and enums
- Business rules (validation, calculations)
- No external dependencies

### infra/
- API client functions
- External service integrations
- Uses `lib/api` for HTTP calls
- Returns typed responses

### application/
- React hooks for business logic
- State management
- Orchestrates infra + model layers
- Reusable across UI components

### ui/
- React components
- Pages and layouts
- Uses application hooks
- Minimal business logic

## Current Status

| Module      | model/ | infra/ | application/ | ui/ |
|-------------|--------|--------|--------------|-----|
| auth        | ✅     | ✅     | ❌           | ✅  |
| community   | ✅     | ✅     | ✅           | ✅  |
| home        | ✅     | ✅     | ✅           | ✅  |
| onboarding  | ✅     | ✅     | ✅           | ✅  |
| pantry      | ✅     | ✅     | ✅           | ✅  |
| profile     | ✅     | ✅     | ✅           | ✅  |
| recipes     | ✅     | ✅     | ✅           | ✅  |

All modules now have standardized structure!
