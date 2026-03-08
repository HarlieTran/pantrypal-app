# App Layer - Separation of Concerns

## Structure

```
app/
├── application/     # Business logic hooks
│   ├── session.types.ts
│   ├── useSession.ts
│   ├── useSessionBootstrap.ts
│   ├── useIdentity.ts
│   ├── useHomeAndPantryPreview.ts
│   ├── useAuthForm.ts (NEW)
│   └── useAppNavigation.ts (NEW)
└── App.tsx          # Pure presentation (REFACTORED)
```

## Layer Responsibilities

### application/ - Business Logic ✅
**Purpose**: Manage app-level state and orchestrate operations

**Existing Files**:
- `useSession.ts` - Session management (login/logout/bootstrap)
- `useSessionBootstrap.ts` - Session bootstrap from localStorage
- `useIdentity.ts` - User identity computation
- `useHomeAndPantryPreview.ts` - Home page data loading

**New Files**:
- `useAuthForm.ts` - Auth form state and handlers
  - Manages email, password, name, code inputs
  - Handles signup, confirm, resend, login
  - Manages loading/error states
  - Calls auth module functions
  
- `useAppNavigation.ts` - App navigation and state
  - Manages view state (home, pantry, recipes, etc.)
  - Manages right panel state (guest, login, user, etc.)
  - Manages onboarding completion state
  - Handles recipe picks completion
  - Provides reset on logout

**Status**: ✅ Complete - All business logic extracted from App.tsx

### App.tsx - Presentation ✅
**Purpose**: Render app layout and route to views

**Before**: 200+ lines with complex business logic
**After**: ~100 lines of pure presentation

**Status**: ✅ Refactored - Pure presentation, no business logic

## Key Changes Made

### Before (Business Logic in App.tsx)
```tsx
// App.tsx - 200+ lines
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [authError, setAuthError] = useState("");
const [authLoading, setAuthLoading] = useState(false);
const [view, setView] = useState("community");
const [rightPanel, setRightPanel] = useState("guest");
const [onboardingCompleted, setOnboardingCompleted] = useState(false);

const onLogin = async () => {
  setAuthLoading(true);
  setAuthError("");
  try {
    const idToken = await signIn(email.trim(), password);
    const bootstrapRes = await fetch(`${API_BASE}/me/bootstrap`, { ... });
    // ... 30+ lines of logic
  } catch (e) {
    setAuthError(String((e as Error).message));
  } finally {
    setAuthLoading(false);
  }
};

const handlePicksComplete = async ({ selectedImageIds, rejectedImageIds }) => {
  const res = await submitRecipeSelections(token, { ... });
  // ... 15+ lines of logic
};
```

### After (Business Logic in Application Layer)
```tsx
// application/useAuthForm.ts
export function useAuthForm(onLoginSuccess) {
  const [email, setEmail] = useState("");
  // ... all auth state
  
  const handleLogin = async () => {
    // ... all login logic
    onLoginSuccess(token, userId, email, onboardingCompleted);
  };
  
  return { email, password, handleLogin, ... };
}

// application/useAppNavigation.ts
export function useAppNavigation(sessionStatus, token) {
  const [view, setView] = useState("community");
  // ... all navigation state
  
  const handlePicksComplete = async (payload) => {
    // ... all picks logic
  };
  
  return { view, setView, handlePicksComplete, ... };
}

// App.tsx - ~100 lines
const { email, password, handleLogin, ... } = useAuthForm(onLoginSuccess);
const { view, setView, handlePicksComplete, ... } = useAppNavigation(...);
```

## Benefits

✅ **Separation of Concerns** - App.tsx is pure presentation
✅ **Testability** - Hooks can be tested independently
✅ **Maintainability** - Business logic clearly separated
✅ **Readability** - App.tsx reduced from 200+ to ~100 lines
✅ **Reusability** - Auth form logic can be reused

## App.tsx Responsibilities (After Refactoring)

App.tsx now only:
1. Uses hooks to get state and handlers
2. Renders conditional views based on state
3. Passes props to child components
4. No business logic, no API calls, no complex state management

## Hooks Composition

```
App.tsx
  ├── useSession() - Session management
  ├── useAuthForm() - Auth form state/handlers
  ├── useAppNavigation() - Navigation state
  ├── useIdentity() - User identity
  └── useHomeAndPantryPreview() - Home data
```

Each hook has a single, clear responsibility.

## Conclusion

✅ **App layer is correctly structured**

The app layer now demonstrates proper separation:
- All business logic in application layer hooks
- App.tsx is pure presentation
- Clear, testable, maintainable code
